// POST /api/evaluations — Teacher final review + Peer review (T11 + P2)
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";
import { teacherFinalizeReview } from "@/lib/server/review-workflow";
import { getSubmissionById } from "@/lib/server/feishu";
import * as feishu from "@/lib/server/feishu";

export async function POST(request: Request) {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const evaluatorType = body.evaluator_type || "teacher";

    // ---- Peer review (P2) ----
    if (evaluatorType === "peer") {
      const { submissionId, score, feedback } = body;

      if (!submissionId || score === undefined || !feedback) {
        return NextResponse.json(
          { ok: false, error: "缺少必填项：submissionId, score, feedback" },
          { status: 400 },
        );
      }

      const submission = await getSubmissionById(submissionId);
      if (!submission) {
        return NextResponse.json({ ok: false, error: "提交记录不存在" }, { status: 404 });
      }

      // Verify this user is the assigned peer
      if (submission.student_id === principal.person) {
        return NextResponse.json(
          { ok: false, error: "不能评审自己的提交" },
          { status: 403 },
        );
      }

      // Check if already reviewed (dedup)
      const existingEvaluations = await feishu.getEvaluationsBySubmission(submissionId);
      const alreadyReviewed = existingEvaluations.some(
        (e: Record<string, unknown>) =>
          e.evaluator_type === "peer" &&
          (e as Record<string, unknown>).evaluator_id === principal.person
      );
      if (alreadyReviewed) {
        return NextResponse.json(
          { ok: false, error: "你已提交过同伴评审，请勿重复提交" },
          { status: 409 },
        );
      }

      // Write peer evaluation
      const evaluation = await feishu.createEvaluation({
        submission_id: submissionId,
        student_id: submission.student_id,
        challenge_id: submission.challenge_id,
        evaluator_type: "peer",
        evaluator_id: principal.person,
        score_total: Number(score),
        feedback: String(feedback),
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        ok: true,
        evaluationId: evaluation.evaluation_id,
        message: "同伴评审已提交",
      });
    }

    // ---- Teacher review (existing P1a) ----
    if (principal.role !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "仅教师可提交评审" },
        { status: 403 },
      );
    }

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

    const submission = await getSubmissionById(submissionId);
    if (!submission || !submission.recordId) {
      return NextResponse.json({ ok: false, error: "提交记录不存在" }, { status: 404 });
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
