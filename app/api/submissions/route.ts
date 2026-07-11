// GET /api/submissions — List submissions with row-level permissions (T10)
import { NextResponse } from "next/server";
import { getSubmissions } from "@/lib/server/feishu";
import { getPrincipal } from "@/lib/server/principal";

export async function GET() {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 },
      );
    }

    // Row-level permission: student sees only own submissions
    const filter = principal.role === "student"
      ? { studentId: principal.person }
      : undefined;

    const submissions = await getSubmissions(filter);
    return NextResponse.json({ ok: true, submissions });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load submissions" },
      { status: 500 },
    );
  }
}
