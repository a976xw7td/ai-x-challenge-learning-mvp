// Agent identity layer — implements AGENT_CN.md §2 (agents must have identity)
// and Agent-inbox Trusted Relationship model, backed by Team3 zod schemas.
import {
  MessageEnvelopeSchema,
  AuditLogSchema,
  TrustedRelationshipSchema,
  StudentCompanionManifestSchema,
  SubmissionTaskAgentManifestSchema,
  ReviewTaskAgentManifestSchema,
  type MessageEnvelope,
  type AuditLog,
  type TrustedRelationship,
} from "../schemas/zod-from-schemas";

// ---- Agent identities (WebApp fallback mode, whitepaper §7.4 phase 1) ----
export const WEBAPP_FALLBACK_STUDENT_AGENT = "student-companion-webapp-fallback";
export const SUBMISSION_TASK_AGENT = "submission-task-agent-001";
export const REVIEW_TASK_AGENT = "review-task-agent-001";
export const WEBAPP_FALLBACK_TEACHER_AGENT = "teacher-companion-webapp-fallback";
export const ADMIN_IDENTITY_MODE = "teacher_delegated" as const;

// ---- Agent Manifests (T4: loaded and validated at import time) ----
import studentManifestRaw from "../../agents/manifests/student-companion-webapp-fallback.json";
import submissionManifestRaw from "../../agents/manifests/submission-task-agent-001.json";
import reviewManifestRaw from "../../agents/manifests/review-task-agent-001.json";

export const STUDENT_COMPANION_MANIFEST = StudentCompanionManifestSchema.parse(studentManifestRaw);
export const SUBMISSION_TASK_MANIFEST = SubmissionTaskAgentManifestSchema.parse(submissionManifestRaw);
export const REVIEW_TASK_MANIFEST = ReviewTaskAgentManifestSchema.parse(reviewManifestRaw);

// ---- Trusted Relationship graph (Agent-inbox 7.6 supplement) ----
export const TRUSTED_RELATIONSHIPS: TrustedRelationship[] = [
  {
    relationship_id: "rel-webapp-to-submission",
    agent_a: WEBAPP_FALLBACK_STUDENT_AGENT,
    agent_b: SUBMISSION_TASK_AGENT,
    relationship_type: "task-agent",
    trust_level: "auto",
    permissions: ["submission_request"],
    expiration: null,
  },
  {
    relationship_id: "rel-submission-to-review",
    agent_a: SUBMISSION_TASK_AGENT,
    agent_b: REVIEW_TASK_AGENT,
    relationship_type: "task-agent",
    trust_level: "auto",
    permissions: ["review_request"],
    expiration: null,
  },
  {
    relationship_id: "rel-teacher-to-submission",
    agent_a: WEBAPP_FALLBACK_TEACHER_AGENT,
    agent_b: SUBMISSION_TASK_AGENT,
    relationship_type: "task-agent",
    trust_level: "auto",
    permissions: ["challenge_publish"],
    expiration: null,
  },
].map((r) => TrustedRelationshipSchema.parse(r));

export function isTrusted(fromAgent: string, toAgent: string): boolean {
  return TRUSTED_RELATIONSHIPS.some(
    (r) => r.agent_a === fromAgent && r.agent_b === toAgent && r.trust_level === "auto",
  );
}

// ---- Extended message types (not in Team3 enum, v3.1 additions) ----
export const EXTENDED_MESSAGE_TYPES = ["manual_review_adjustment", "peer_review_request"] as const;
export type ExtendedMessageType = (typeof EXTENDED_MESSAGE_TYPES)[number];
export type AllMessageTypes = MessageEnvelope["message_type"] | ExtendedMessageType;

// ---- Message envelope (AGENT_CN.md §8: no identity-less messages) ----
let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEnvelope(params: {
  messageType: AllMessageTypes;
  fromAgent: string;
  toAgent: string;
  payload: Record<string, unknown>;
  auditId: string;
}): MessageEnvelope {
  // For extended types, use relaxed validation (skip strict MessageType enum check)
  const raw = {
    message_id: uid("msg"),
    request_id: uid("req"),
    from_agent: params.fromAgent,
    to_agent: params.toAgent,
    message_type: params.messageType,
    timestamp: new Date().toISOString(),
    payload: params.payload,
    audit_trace_pointer: params.auditId,
  };

  // Relaxed parse: allow extended message types
  try {
    return MessageEnvelopeSchema.parse(raw);
  } catch {
    // Extended type: strip message_type for schema check, then restore
    const { message_type, ...rest } = raw;
    const base = MessageEnvelopeSchema.omit({ message_type: true }).parse(rest);
    return { ...base, message_type } as MessageEnvelope;
  }
}

// ---- Audit trail (AGENT_CN.md §8.2: no state change without audit trace) ----
export class AuditTrail {
  readonly traceId = uid("audit");
  readonly entries: AuditLog[] = [];

  log(agentId: string, action: string, targetResource: string, extra?: Partial<AuditLog>) {
    const entry = AuditLogSchema.parse({
      audit_id: uid("audit"),
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      action,
      target_resource: targetResource,
      ...extra,
    });
    this.entries.push(entry);
    console.log(`[audit] ${entry.agent_id} ${entry.action} ${entry.target_resource}`);
    return entry;
  }
}
