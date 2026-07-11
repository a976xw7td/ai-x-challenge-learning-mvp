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
    const key = keyParts.join(":"); // handle keys with colons
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
 * Returns null if the key is invalid or not configured.
 */
export function resolveAgentApiKey(apiKey: string): ServicePrincipal | null {
  const keyMap = loadKeyMap();
  const agentId = keyMap.get(apiKey);
  if (!agentId) return null;
  return agentToSP(agentId);
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
