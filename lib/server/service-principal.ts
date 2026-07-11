// Service Principal registry + five-level Relationship trust check (T21).
// Replaces the hardcoded isTrusted() in agents.ts with SP-based matching.
// Each agent identity maps to a ServicePrincipal, and every inter-agent
// message is validated against the Relationship graph.
import {
  ServicePrincipalSchema,
  RelationshipSchema,
  type ServicePrincipal,
  type Relationship,
} from "../schemas/envelope-v2.schema";

// ---- Agent → SP mapping (§3.1, §3.6) ----

const AGENT_TO_SP: Record<string, ServicePrincipal> = {
  "student-companion-webapp-fallback": {
    person: "student-companion-webapp-fallback",
    org: "elite20",
    role: "agent",
  },
  "teacher-companion-webapp-fallback": {
    person: "teacher-companion-webapp-fallback",
    org: "elite20",
    role: "agent",
  },
  "submission-task-agent-001": {
    person: "submission-task-agent-001",
    org: "elite20",
    role: "system",
  },
  "review-task-agent-001": {
    person: "review-task-agent-001",
    org: "elite20",
    role: "system",
  },
};

// User principals (students/teachers) are resolved at runtime from login session
// and use person=<student_id>, role=<determined_role>.

export function agentToSP(agentId: string): ServicePrincipal | null {
  return AGENT_TO_SP[agentId] || null;
}

// ---- Relationship graph (§3.2) ----

export const RELATIONSHIPS: Relationship[] = [
  // Student webapp → Submission task agent
  {
    relationship_id: "rel-student-to-submission",
    from: AGENT_TO_SP["student-companion-webapp-fallback"],
    to: AGENT_TO_SP["submission-task-agent-001"],
    type: "client",
    capabilities: ["submission_request"],
    allowed_channels: ["webapp", "redis-stream"],
    approval: "auto",
  },
  // Submission task agent → Review task agent
  {
    relationship_id: "rel-submission-to-review",
    from: AGENT_TO_SP["submission-task-agent-001"],
    to: AGENT_TO_SP["review-task-agent-001"],
    type: "owner",
    capabilities: ["review_request", "peer_review_request"],
    allowed_channels: ["redis-stream"],
    approval: "auto",
  },
  // Teacher webapp → Submission task agent
  {
    relationship_id: "rel-teacher-to-submission",
    from: AGENT_TO_SP["teacher-companion-webapp-fallback"],
    to: AGENT_TO_SP["submission-task-agent-001"],
    type: "administrator",
    capabilities: ["challenge_publish", "manual_review_adjustment"],
    allowed_channels: ["webapp", "redis-stream"],
    approval: "auto",
  },
].map((r) => RelationshipSchema.parse(r));

// ---- Trust check (replaces agents.ts isTrusted) ----

export interface PrincipalMatch {
  allowed: boolean;
  reason: string;
  relationship?: Relationship;
}

/**
 * Check if `from` is authorized to send `messageType` to `to`.
 * Matches against the relationship graph using Service Principals.
 */
export function checkTrust(
  from: ServicePrincipal,
  to: ServicePrincipal,
  messageType: string,
): PrincipalMatch {
  // Find matching relationship
  const rel = RELATIONSHIPS.find(
    (r) =>
      r.from.person === from.person &&
      r.to.person === to.person &&
      r.approval !== "denied",
  );

  if (!rel) {
    return {
      allowed: false,
      reason: `No relationship found: ${from.person} → ${to.person}`,
    };
  }

  if (!rel.capabilities.includes(messageType)) {
    return {
      allowed: false,
      reason: `Capability "${messageType}" not allowed in relationship ${rel.relationship_id}`,
      relationship: rel,
    };
  }

  return {
    allowed: true,
    reason: `Authorized via ${rel.relationship_id} (${rel.approval})`,
    relationship: rel,
  };
}

/**
 * Check if `from` needs approval for this message.
 */
export function needsApproval(
  from: ServicePrincipal,
  to: ServicePrincipal,
): boolean {
  const rel = RELATIONSHIPS.find(
    (r) => r.from.person === from.person && r.to.person === to.person,
  );
  return rel?.approval === "require-approval";
}

// ---- Backward-compatible isTrusted (v1 compat) ----

/**
 * Backward-compatible trust check using agent_id strings.
 * Maps agent IDs to SPs and delegates to checkTrust.
 */
export function isTrustedV2(fromAgent: string, toAgent: string, messageType?: string): boolean {
  const fromSP = agentToSP(fromAgent);
  const toSP = agentToSP(toAgent);

  if (!fromSP || !toSP) {
    console.warn(`[trust] Unknown agent(s): ${fromAgent} → ${toAgent}`);
    return false;
  }

  // If no specific message type, check relationship existence only
  const rel = RELATIONSHIPS.find(
    (r) => r.from.person === fromSP.person && r.to.person === toSP.person && r.approval !== "denied",
  );

  if (!rel) {
    console.warn(`[trust] No relationship: ${fromAgent} → ${toAgent}`);
    return false;
  }

  if (messageType && !rel.capabilities.includes(messageType)) {
    console.warn(`[trust] Capability "${messageType}" not in ${rel.relationship_id}`);
    return false;
  }

  return true;
}
