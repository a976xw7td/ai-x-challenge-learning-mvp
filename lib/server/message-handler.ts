// Unified message handler — T19 handle_message (§3.4 of whitepaper).
// This is the SINGLE entry point for all agent-to-agent messages.
// API routes publish envelopes; consumers call this handler; no direct
// workflow calls bypass this path.
//
// Consumer groups:
//   - submission-task-agent: handles submission_request
//   - review-task-agent:    handles review_request, peer_review_request, manual_review_adjustment
import type { MessageEnvelope } from "../schemas/zod-from-schemas";
import {
  SUBMISSION_TASK_AGENT,
  REVIEW_TASK_AGENT,
  isTrusted,
} from "./agents";
import { checkTrust, agentToSP, type PrincipalMatch } from "./service-principal";
import type { ServicePrincipal } from "../schemas/envelope-v2.schema";

type HandlerFn = (envelope: MessageEnvelope) => Promise<void>;

const handlers = new Map<string, HandlerFn>();

/** Register a handler for a message type. Called at startup. */
export function registerHandler(messageType: string, handler: HandlerFn): void {
  handlers.set(messageType, handler);
  console.log(`[handler] Registered: ${messageType}`);
}

/**
 * The unified message entry point. All agent messages flow through here.
 *
 * Steps:
 *  1. Validate trust via Service Principal (T21) — fallback to v1 isTrusted
 *  2. Route to registered handler
 */
export async function handleMessage(envelope: MessageEnvelope): Promise<void> {
  // T21: Service Principal trust check with message-type awareness
  const fromSP = agentToSP(envelope.from_agent);
  const toSP = agentToSP(envelope.to_agent);

  if (fromSP && toSP) {
    const trust = checkTrust(fromSP, toSP, envelope.message_type);
    if (!trust.allowed) {
      console.warn(
        `[handler] Untrusted: ${envelope.from_agent} → ${envelope.to_agent} (${envelope.message_type}): ${trust.reason}`,
      );
      return;
    }
  } else {
    // Fallback to v1 isTrusted for unknown agents
    if (!isTrusted(envelope.from_agent, envelope.to_agent)) {
      console.warn(
        `[handler] Untrusted (v1 fallback): ${envelope.from_agent} → ${envelope.to_agent} (${envelope.message_type})`,
      );
      return;
    }
  }

  const handler = handlers.get(envelope.message_type);
  if (!handler) {
    console.warn(`[handler] No handler for message type: ${envelope.message_type}`);
    return;
  }

  console.log(
    `[handler] Dispatching ${envelope.message_type} (${envelope.from_agent} → ${envelope.to_agent})`,
  );

  try {
    await handler(envelope);
  } catch (err) {
    console.error(
      `[handler] Error handling ${envelope.message_type}:`,
      err instanceof Error ? err.message : err,
    );
    throw err; // re-throw so consumer doesn't ACK → pending redelivery
  }
}
