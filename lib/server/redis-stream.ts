// Redis Stream message bus — T19 (§3.4 of whitepaper)
// Replaces in-memory envelope passing with Redis Stream consumer groups.
// Envelope format is unchanged (ADR-001): same MessageEnvelope, new transport.
//
// Stream design:
//   Stream: nseap:messages
//   Consumer groups: submission-task-agent, review-task-agent
//   Each agent is a consumer in its group → at-least-once delivery with ACK.
//   Pending messages > 30s idle are auto-claimed and redelivered.
import { getRedis } from "./redis";
import type { MessageEnvelope } from "../schemas/zod-from-schemas";

const STREAM = "nseap:messages";
const MAX_STREAM_LEN = 10_000; // keep last 10k messages

// ---- Publish ----

/** Publish an envelope to the Redis Stream. Returns the stream message ID. */
export async function publishEnvelope(envelope: MessageEnvelope): Promise<string | null> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[stream] Redis unavailable — envelope not published");
    return null;
  }

  const id = await redis.xadd(
    STREAM,
    "MAXLEN", "~", MAX_STREAM_LEN,
    "*",
    "envelope", JSON.stringify(envelope),
  );

  console.log(`[stream] Published ${envelope.message_type} → ${id} (${envelope.from_agent} → ${envelope.to_agent})`);
  return id;
}

// ---- Consumer group ----

/** Ensure the consumer group exists. Creates it from the beginning on first run. */
async function ensureGroup(redis: ReturnType<typeof getRedis>, group: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.xgroup("CREATE", STREAM, group, "0", "MKSTREAM");
    console.log(`[stream] Created consumer group: ${group}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("BUSYGROUP")) {
      // Group already exists — OK
      return;
    }
    throw err;
  }
}

// ---- Consumer ----

export type MessageHandler = (
  envelope: MessageEnvelope,
  streamId: string,
) => Promise<void>;

/**
 * Start consuming messages from the stream as a member of a consumer group.
 * Runs indefinitely — intended to be spawned as a long-lived background task.
 *
 * Flow:
 *  1. Read new messages via XREADGROUP
 *  2. Call handler for each message
 *  3. ACK on success (XACK)
 *  4. On failure, message stays pending → auto-claimed after idle timeout
 */
export async function startConsumer(
  group: string,
  consumerName: string,
  handler: MessageHandler,
  signal?: AbortSignal,
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    console.warn("[stream] Redis unavailable — consumer not started");
    return;
  }

  await ensureGroup(redis, group);
  console.log(`[stream] Consumer started: ${consumerName} (group=${group})`);

  // Also claim any stale pending messages on startup
  await claimPending(redis, group, consumerName, handler);

  // Main read loop
  while (!signal?.aborted) {
    try {
      // @ts-expect-error ioredis xreadgroup types
      const results = await redis.xreadgroup(
        "GROUP", group, consumerName,
        "COUNT", 5,
        "BLOCK", 5000,
        "STREAMS", STREAM, ">",
      );

      if (!results) continue;

      for (const [, messages] of results as [string, Array<[string, string[]]>][]) {
        for (const [id, fields] of messages) {
          const envelopeStr = fields[fields.indexOf("envelope") + 1];
          if (!envelopeStr) continue;

          try {
            const envelope = JSON.parse(envelopeStr) as MessageEnvelope;
            await handler(envelope, id);
            await redis.xack(STREAM, group, id);
            console.log(`[stream] ACK ${id} (${envelope.message_type})`);
          } catch (err) {
            console.error(`[stream] Handler error for ${id}:`, err);
            // Don't ACK — message stays pending for redelivery
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Connection") || msg.includes("ECONNREFUSED") || msg.includes("READONLY")) {
        console.error("[stream] Redis connection lost, retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error("[stream] Consumer error:", msg);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
}

// ---- Pending message recovery ----

const PENDING_IDLE_MS = 30_000; // 30s idle → claim for redelivery

/** Claim pending messages that have been idle too long and redeliver them. */
export async function claimPending(
  redis: ReturnType<typeof getRedis>,
  group: string,
  consumerName: string,
  handler: MessageHandler,
): Promise<number> {
  if (!redis) return 0;

  try {
    // Get pending messages
    // @ts-expect-error ioredis xpending types
    const pending = await redis.xpending(STREAM, group, "-", "+", 100);

    let claimed = 0;
    for (const entry of (pending || []) as Array<{ id: string; milliseconds_elapsed: number }>) {
      if (entry.milliseconds_elapsed < PENDING_IDLE_MS) continue;

      // Claim the message
      // @ts-expect-error ioredis xclaim types
      const claimed_msgs = await redis.xclaim(
        STREAM, group, consumerName,
        PENDING_IDLE_MS,
        entry.id,
        "JUSTID",
      );

      if (claimed_msgs && claimed_msgs.length > 0) {
        // Re-read the full message to get the envelope
        // @ts-expect-error ioredis xrange types
        const msgs = await redis.xrange(STREAM, entry.id, entry.id);
        for (const [, fields] of msgs as [string, string[]][]) {
          const envelopeStr = fields[fields.indexOf("envelope") + 1];
          if (!envelopeStr) continue;
          try {
            const envelope = JSON.parse(envelopeStr) as MessageEnvelope;
            await handler(envelope, entry.id);
            await redis.xack(STREAM, group, entry.id);
            claimed++;
            console.log(`[stream] Claimed + ACK ${entry.id}`);
          } catch (err) {
            console.error(`[stream] Claim handler error for ${entry.id}:`, err);
          }
        }
      }
    }
    return claimed;
  } catch (err) {
    console.error("[stream] Claim error:", err);
    return 0;
  }
}

// ---- Shutdown ----

export async function stopConsumer(consumerName: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    // @ts-expect-error ioredis xgroup delconsumer
    await redis.xgroup("DELCONSUMER", STREAM, await getGroupForConsumer(consumerName), consumerName);
  } catch {
    // Consumer might not exist — OK
  }
}

async function getGroupForConsumer(consumerName: string): Promise<string> {
  if (consumerName.includes("submission")) return "submission-task-agent";
  if (consumerName.includes("review")) return "review-task-agent";
  return "default";
}
