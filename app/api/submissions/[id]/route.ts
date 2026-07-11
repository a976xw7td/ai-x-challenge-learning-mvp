// GET /api/submissions/[id] — Get single submission detail (T10)
import { NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/server/feishu";
import { getPrincipal } from "@/lib/server/principal";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const submission = await getSubmissionById(id);
    if (!submission) {
      return NextResponse.json(
        { ok: false, error: "提交不存在" },
        { status: 404 },
      );
    }

    // Row-level: student can only see own submissions
    if (principal.role === "student" && submission.student_id !== principal.person) {
      return NextResponse.json(
        { ok: false, error: "无权查看此提交" },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load submission" },
      { status: 500 },
    );
  }
}
