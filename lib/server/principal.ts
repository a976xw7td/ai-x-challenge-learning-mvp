// principal.ts — Server-side session-to-Principal resolution (§3.5)
// Principal is ONLY resolved server-side; clients never self-report role.
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { optionalEnv } from "./env";

export interface ServicePrincipal {
  person: string;
  org: string;
  role: string; // "student" | "teacher" | "admin"
}

const SESSION_COOKIE = "nseap_session";

function getSecret(): string {
  return optionalEnv("SESSION_SECRET");
}

/** HMAC-SHA256 sign a payload */
export function signToken(payload: Record<string, string>): string {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(JSON.stringify({ data, hmac })).toString("base64url");
}

/** Verify HMAC-SHA256 and parse payload. Returns null if invalid. */
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

/** Resolve Principal from the request's session cookie. Returns null for anonymous. */
export async function getPrincipal(): Promise<ServicePrincipal | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    return {
      person: payload.person,
      org: payload.org || "elite20",
      role: payload.role || "student",
    };
  } catch {
    return null;
  }
}

/** Determine role for a given student ID (server-side only). */
export function determineRole(studentId: string, studentsRole?: string): string {
  // 1. Check TEACHER_IDS env
  const teacherIds = optionalEnv("TEACHER_IDS")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (teacherIds.includes(studentId.toLowerCase())) return "teacher";

  // 2. Check Students table role column
  if (studentsRole && ["teacher", "admin"].includes(studentsRole.toLowerCase())) {
    return studentsRole.toLowerCase();
  }

  return "student";
}

export { SESSION_COOKIE };
