// GET /api/auth/me — Read current Principal from session cookie
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";

export async function GET() {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...principal });
}
