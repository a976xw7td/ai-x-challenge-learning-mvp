// Agent API Key authentication — P2 agent channel auth (AGENT_CN.md §3.5).
// Agent channels (Hermes/WorkBuddy) use pre-shared API keys stored in env.
// The server maps API key → Service Principal for authorization.
//
// Keys are stored as comma-separated pairs in env:
//   AGENT_API_KEYS=agent_id:key1,agent_id:key2
// Example: AGENT_API_KEYS=teacher-companion-workbuddy:wb-secret-xxx,student-companion-zhanghao-001:zh-secret-yyy
import { optionalEnv } from "./env";
import type { ServicePrincipal } from "../schemas/envelope-v2.schema";
import { agentToSP } from "./service-principal";

// ---- Key → Agent mapping ----

let _keyMap: Map<string, string> | null = null;

function loadKeyMap(): Map<string, string> {
  if (_keyMap) return _keyMap;

  _keyMap = new Map();
  const raw = optionalEnv("AGENT_API_KEYS");
  if (!raw) return _keyMap;

  for (const pair of raw.split(",")) {
    const [agentId, ...keyParts] = pair.trim().split(":");
    const key = keyParts.join(":");
    if (agentId && key) {
      _keyMap.set(key.trim(), agentId.trim());
    }
  }

  if (_keyMap.size > 0) {
    console.log(`[auth] Loaded ${_keyMap.size} agent API keys`);
  }
  return _keyMap;
}

// ---- Principal resolution ----

/**
 * Resolve an API key to a Service Principal.
 * Checks: 1) hardcoded env keys (WorkBuddy/Hermes), 2) Students table keys
 */
export function resolveAgentApiKey(apiKey: string): ServicePrincipal | null {
  // 1. Check hardcoded keys (env)
  const keyMap = loadKeyMap();
  const agentId = keyMap.get(apiKey);
  if (agentId) return agentToSP(agentId);

  return null;
}

/**
 * Resolve from Students table. Must be called with await since it hits Feishu.
 * Returns { person: "student_<studentId>", org: "elite20", role: "agent" }
 */
export async function resolveStudentApiKey(apiKey: string): Promise<ServicePrincipal | null> {
  const keyMap = loadKeyMap();
  if (keyMap.has(apiKey)) return null; // already handled by resolveAgentApiKey

  // Check Students table
  try {
    const { getStudents } = await import("./feishu");
    const students = await getStudents();
    const match = students.find((s) => s.api_key === apiKey);
    if (match) {
      return {
        person: `student-companion-${match.student_id}`,
        org: "elite20",
        role: "agent",
      };
    }
  } catch {
    // Feishu unavailable — skip
  }
  return null;
}

/**
 * Extract and validate API key from request headers.
 * Looks for: x-api-key or Authorization: Bearer <key>
 */
export function extractApiKey(request: Request): string | null {
  // Try x-api-key header first
  const xKey = request.headers.get("x-api-key");
  if (xKey) return xKey.trim();

  // Try Bearer token
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  return null;
}

// ---- Key generation helper ----

/** Generate a random API key for agent use. Run once and store in .env.local. */
export function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [16, 16, 16].map((len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  );
  return `nseap-${segments.join("-")}`;
}
