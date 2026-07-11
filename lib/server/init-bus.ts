// Message bus initialization — called once at server startup (T19).
// Registers message handlers and starts Redis Stream consumers.
import { registerHandler, handleMessage } from "./message-handler";
import { startConsumer } from "./redis-stream";
import type { MessageEnvelope } from "../schemas/zod-from-schemas";

// ---- Handler stubs (T19: infrastructure only, full handlers in T20) ----

function createHandler(label: string): (envelope: MessageEnvelope) => Promise<void> {
  return async (envelope) => {
    console.log(`[bus] Handler "${label}" received: ${envelope.message_type} from ${envelope.from_agent}`);
    // T20: route to actual workflow functions here
  };
}

// ---- Startup ----

export async function initMessageBus(): Promise<void> {
  // Register handlers for each message type
  registerHandler("submission_request", createHandler("submission_request"));
  registerHandler("review_request", createHandler("review_request"));
  registerHandler("peer_review_request", createHandler("peer_review_request"));
  registerHandler("manual_review_adjustment", createHandler("manual_review_adjustment"));

  console.log("[bus] Message bus initialized with 4 handlers");

  // Start consumers in background (don't block server startup)
  const abortController = new AbortController();

  startConsumer("submission-task-agent", "submission-consumer-1", async (env, id) => {
    await handleMessage(env);
  }, abortController.signal).catch((err) => {
    console.error("[bus] Submission consumer crashed:", err);
  });

  startConsumer("review-task-agent", "review-consumer-1", async (env, id) => {
    await handleMessage(env);
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
}
