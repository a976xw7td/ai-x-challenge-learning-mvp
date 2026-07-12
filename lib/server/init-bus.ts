// Message bus initialization — called once at server startup (T19 + T20).
// Registers message handlers and starts Redis Stream consumers.
import { registerHandler, handleMessage, appendRouteHop } from "./message-handler";
import { startConsumer } from "./redis-stream";
import { busAdapter } from "./bus-adapter";
import { updateTaskStatus } from "./tasks";
import { bootstrapRegistry, lookupAgent } from "./agent-registry";
import { setRegistryLookup } from "./service-principal";
import { enqueue } from "./audit-outbox";
import { makeId } from "./ids";
import type { ServicePrincipal } from "../schemas/envelope-v2.schema";
import type { MessageEnvelope } from "../schemas/zod-from-schemas";
import type { AuditLog } from "../schemas/zod-from-schemas";
import type { SubmissionInput } from "./types";

// ---- Handler implementations ----

async function handleSubmissionRequest(envelope: MessageEnvelope): Promise<void> {
  const taskId = envelope.audit_trace_pointer;
  console.log(`[bus] Processing submission_request: task=${taskId}`);

  await updateTaskStatus(taskId, "processing");

  try {
    // Lazy import to avoid circular deps at module init time
    const { submitChallengeProject } = await import("./workflow");
    const input = envelope.payload as unknown as SubmissionInput;

    // Pass the actual caller agent ID from the envelope
    const result = await submitChallengeProject(input, envelope.from_agent);

    await updateTaskStatus(taskId, result.ok ? "completed" : "failed", {
      ok: result.ok,
      submissionId: result.submissionId,
      evaluationId: result.evaluationId,
      portfolioItemId: result.portfolioItemId,
      error: result.error,
    });

    console.log(`[bus] Submission task ${taskId}: ${result.ok ? "completed" : "failed"}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await updateTaskStatus(taskId, "failed", { ok: false, error: errMsg });
    console.error(`[bus] Submission task ${taskId} failed:`, errMsg);
    throw err; // re-throw so consumer doesn't ACK
  }
}

async function handleReviewRequest(envelope: MessageEnvelope): Promise<void> {
  console.log(`[bus] Processing review_request: ${envelope.audit_trace_pointer}`);
  // AI evaluation is handled within submitChallengeProject (synchronous step).
  // This handler receives review requests routed from submission-task-agent.
  // For now, the review is triggered inline — T22 will make this truly async.
}

async function handlePeerReviewRequest(envelope: MessageEnvelope): Promise<void> {
  console.log(`[bus] Processing peer_review_request (stub — P2)`);
}

async function handleManualReviewAdjustment(envelope: MessageEnvelope): Promise<void> {
  const taskId = envelope.audit_trace_pointer;
  console.log(`[bus] Processing manual_review_adjustment: task=${taskId}`);

  await updateTaskStatus(taskId, "processing");

  try {
    const { teacherFinalizeReview } = await import("./review-workflow");
    const input = envelope.payload as unknown as {
      submissionId: string;
      submissionRecordId: string;
      studentId: string;
      action: "accept" | "return";
      score: number;
      feedback: string;
    };

    const result = await teacherFinalizeReview(input);

    await updateTaskStatus(taskId, result.ok ? "completed" : "failed", {
      ok: result.ok,
      error: result.error,
    });

    console.log(`[bus] Review task ${taskId}: ${result.ok ? "completed" : "failed"}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await updateTaskStatus(taskId, "failed", { ok: false, error: errMsg });
    console.error(`[bus] Review task ${taskId} failed:`, errMsg);
    throw err;
  }
}

// ---- Startup ----

/** Persist route trace to audit (AGENT_CN.md §8.1).
 *  Fire-and-forget — must never throw or block message processing. */
function persistRouteTrace(envelope: MessageEnvelope): void {
  try {
    const existing = envelope as Record<string, unknown>;
    const route = existing["route"] as Array<Record<string, unknown>> | undefined;
    if (!route || route.length === 0) return;

    const trace: AuditLog = {
      audit_id: makeId("audit"),
      timestamp: new Date().toISOString(),
      agent_id: envelope.to_agent,
      action: "route_trace",
      target_resource: envelope.message_id,
      related_message_id: envelope.message_id,
      after_state: { type: "route_trace", route },
    };
    enqueue([trace]);
    console.log(`[bus] Route trace persisted: ${envelope.message_id} (${route.length} hops)`);
  } catch (err) {
    console.warn("[bus] Route trace persist failed:", err instanceof Error ? err.message : String(err));
  }
}

export async function initMessageBus(): Promise<void> {
  // Register handlers for each message type
  registerHandler("submission_request", handleSubmissionRequest);
  registerHandler("review_request", handleReviewRequest);
  registerHandler("peer_review_request", handlePeerReviewRequest);
  registerHandler("manual_review_adjustment", handleManualReviewAdjustment);

  console.log("[bus] Message bus initialized with 4 handlers");

  // P3 T2: Bootstrap agent registry + wire dynamic lookup
  await bootstrapRegistry();
  setRegistryLookup(async (agentId) => {
    const reg = await lookupAgent(agentId);
    if (!reg) return null;
    return { person: reg.person, org: reg.org, role: reg.role as ServicePrincipal["role"] };
  });

  // Start consumers in background
  const abortController = new AbortController();

  // P3 T1: Subscribe via bus adapter (transport-agnostic)
  // BUGFIX: await consumer startup promises so failures are visible at boot,
  // not silently lost in background.
  //
  // AGENT_CN.md §8.1: Each consumer stamps forward hop before handler,
  // deliver hop after success. This gives full route traceability.
  const subConsumer = busAdapter.subscribe("submission-task-agent", "submission-consumer-1", async (env, id) => {
    const forwarded = appendRouteHop(env, "forward");
    await handleMessage(forwarded);
    // On success, stamp deliver hop + persist full route trace
    const delivered = appendRouteHop(forwarded, "deliver");
    persistRouteTrace(delivered);
  }, abortController.signal).catch((err) => {
    console.error("[bus] Submission consumer crashed:", err);
  });

  const reviewConsumer = busAdapter.subscribe("review-task-agent", "review-consumer-1", async (env, id) => {
    const forwarded = appendRouteHop(env, "forward");
    await handleMessage(forwarded);
    const delivered = appendRouteHop(forwarded, "deliver");
    persistRouteTrace(delivered);
  }, abortController.signal).catch((err) => {
    console.error("[bus] Review consumer crashed:", err);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("[bus] Shutting down consumers...");
    abortController.abort();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Await both consumer startups so boot is blocked until consumers are live
  await Promise.all([subConsumer, reviewConsumer]);
}
