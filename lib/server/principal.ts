// principal.ts — Server-side Principal resolution (§3.5)
// Supports: session cookie (webapp) + API key (Hermes/WorkBuddy agent channels)
// Principal is ONLY resolved server-side; clients never self-report role.
import { createHmac } from "crypto";
import { cookies, headers } from "next/headers";
import { optionalEnv } from "./env";
import { resolveAgentApiKey, resolveStudentApiKey } from "./agent-auth";

export interface ServicePrincipal {
  person: string;
  org: string;
  role: string; // "student" | "teacher" | "agent" | "admin" | "system" | "ta" | "judge" | "observer"
  class_id?: string; // T3: multi-class support
}

const SESSION_COOKIE = "nseap_session";

function getSecret(): string {
  return optionalEnv("SESSION_SECRET");
}

export function signToken(payload: Record<string, string>): string {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ data, hmac })).toString("base64url");
}

export function verifyToken(token: string): Record<string, string> | null {
  try {
    const secret = getSecret();
    if (!secret) return null;
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { data, hmac } = JSON.parse(raw);
    const expectedHmac = createHmac("sha256", secret).update(data).digest("hex");
    if (hmac !== expectedHmac) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/** Resolve Principal from session cookie. Returns null for anonymous. */
export async function getPrincipal(): Promise<ServicePrincipal | null> {
  try {
    // First try session cookie (webapp)
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        return {
          person: payload.person,
          org: payload.org || "elite20",
          role: payload.role || "student",
        };
      }
    }
  } catch {
    // cookies() throws outside of request context — fall through to agent auth
  }

  // Try API key (agent channels: Hermes/WorkBuddy)
  return await getAgentPrincipal();
}

/** Resolve Principal from API key header (for agent channels). */
export async function getAgentPrincipal(): Promise<ServicePrincipal | null> {
  try {
    const hdrs = await headers();
    const apiKey = hdrs.get("x-api-key");
    if (!apiKey) return null;

    // Try hardcoded keys first (WorkBuddy/Hermes)
    const sp = resolveAgentApiKey(apiKey.trim());
    if (sp) return { person: sp.person, org: sp.org, role: sp.role };

    // Try Students table keys (auto-generated for each student)
    const studentSp = await resolveStudentApiKey(apiKey.trim());
    if (studentSp) {
      // Auto-register dynamic student agent in registry if not already known
      const { lookupAgent, registerAgent } = await import("./agent-registry");
      const existing = await lookupAgent(studentSp.person);
      if (!existing) {
        await registerAgent(studentSp.person, studentSp, ["submission_request"]);
      }
      return { person: studentSp.person, org: studentSp.org, role: studentSp.role };
    }
  } catch {
    // headers() throws outside of request context
  }
  return null;
}

export function determineRole(studentId: string, studentsRole?: string): string {
  const teacherIds = optionalEnv("TEACHER_IDS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (teacherIds.includes(studentId.toLowerCase())) return "teacher";

  if (studentsRole && ["teacher", "admin"].includes(studentsRole.toLowerCase())) {
    return studentsRole.toLowerCase();
  }

  return "student";
}

/**
 * Extract the real student_id from a Principal.
 * WebApp sessions have role="student" with person=studentId.
 * Agent channels have role="agent" with person="student-companion-{studentId}".
 * Returns null if the principal does not represent a student.
 */
export function getStudentId(principal: ServicePrincipal): string | null {
  if (principal.role === "student") return principal.person;
  if (principal.role === "agent" && principal.person.startsWith("student-companion-")) {
    return principal.person.slice("student-companion-".length);
  }
  return null;
}

export { SESSION_COOKIE };
