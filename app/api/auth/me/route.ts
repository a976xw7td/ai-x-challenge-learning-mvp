// GET /api/auth/me — Read current Principal + student info from session
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";
import { getStudentById } from "@/lib/server/feishu";

export async function GET() {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  // Look up student info (name, api_key) from Feishu
  let name: string | undefined;
  let api_key: string | undefined;
  try {
    const student = await getStudentById(principal.person);
    name = student.name;
    api_key = student.api_key || undefined;
  } catch {
    // Student not found or Feishu unavailable — use principal data only
  }

  return NextResponse.json({
    ok: true,
    ...principal,
    name,
    api_key,
  });
}
