// POST /api/evaluations — Teacher final review (T11)
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";
import { teacherFinalizeReview } from "@/lib/server/review-workflow";
import { getSubmissionById } from "@/lib/server/feishu";

export async function POST(request: Request) {
  try {
    // Require teacher role
    const principal = await getPrincipal();
    if (!principal || principal.role !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "仅教师可提交评审" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { submissionId, action, score, feedback } = body;

    if (!submissionId || !action || score === undefined || !feedback) {
      return NextResponse.json(
        { ok: false, error: "缺少必填项：submissionId, action, score, feedback" },
        { status: 400 },
      );
    }

    if (!["accept", "return"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "action 必须为 accept 或 return" },
        { status: 400 },
      );
    }

    // Get submission record_id for update
    const submission = await getSubmissionById(submissionId);
    if (!submission || !submission.recordId) {
      return NextResponse.json(
        { ok: false, error: "提交记录不存在" },
        { status: 404 },
      );
    }

    const result = await teacherFinalizeReview({
      submissionId,
      submissionRecordId: submission.recordId,
      studentId: submission.student_id,
      action,
      score: Number(score),
      feedback: String(feedback),
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "评审失败" },
      { status: 500 },
    );
  }
}
