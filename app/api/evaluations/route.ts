// POST /api/evaluations — Teacher final review + Peer review (T11 + P2)
import { NextResponse } from "next/server";
import { getPrincipal, getStudentId } from "@/lib/server/principal";
import { teacherFinalizeReview } from "@/lib/server/review-workflow";
import { getSubmissionById } from "@/lib/server/feishu";
import * as feishu from "@/lib/server/feishu";
import { notifyStudent } from "@/lib/server/notify";

// GET /api/evaluations — list evaluations
//   student: peer-review assignments where I am the evaluator (pending + done)
//   teacher: all evaluations, optional ?submissionId= filter
export async function GET(request: Request) {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
    }
    const url = new URL(request.url);
    const submissionId = url.searchParams.get("submissionId") || undefined;

    let evaluations = submissionId
      ? await feishu.getEvaluationsBySubmission(submissionId)
      : await feishu.getEvaluations();

    if (principal.role === "student" || getStudentId(principal)) {
      // Student (webapp or agent): only peer-review assignments where I am evaluator
      const sid = getStudentId(principal) || principal.person;
      evaluations = evaluations.filter(
        (e) => e.evaluator_type === "peer" && e.evaluator_id === sid,
      );
    } else if (principal.role !== "teacher") {
      return NextResponse.json({ ok: false, error: "无权访问" }, { status: 403 });
    }

    // Join submission titles so the UI can render a meaningful list
    const subIds = Array.from(new Set(evaluations.map((e) => e.submission_id).filter(Boolean)));
    const titles: Record<string, { project_title: string; student_name: string }> = {};
    await Promise.all(
      subIds.map(async (sid) => {
        try {
          const sub = await getSubmissionById(sid);
          if (sub) titles[sid] = { project_title: sub.project_title, student_name: sub.student_name };
        } catch { /* keep going */ }
      }),
    );

    const items = evaluations.map((e) => ({
      evaluation_id: e.evaluation_id,
      submission_id: e.submission_id,
      student_id: e.student_id,
      challenge_id: e.challenge_id,
      evaluator_type: e.evaluator_type,
      evaluator_id: e.evaluator_id,
      score_total: e.score_total,
      feedback: e.feedback,
      created_at: e.created_at,
      pending: !e.feedback,
      project_title: titles[e.submission_id]?.project_title || "",
      submitter_name: titles[e.submission_id]?.student_name || "",
    }));

    return NextResponse.json({ ok: true, evaluations: items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "加载失败" },
      { status: 500 },
    );
  }
}

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
      const evalStudentId = getStudentId(principal) || principal.person;
      if (submission.student_id === evalStudentId) {
        return NextResponse.json(
          { ok: false, error: "不能评审自己的提交" },
          { status: 403 },
        );
      }

      // Find my assignment placeholder (created at allocation time).
      // A completed review has non-empty feedback; placeholders have feedback="".
      const existingEvaluations = await feishu.getEvaluationsBySubmission(submissionId);
      const mine = existingEvaluations.filter(
        (e) => e.evaluator_type === "peer" && e.evaluator_id === evalStudentId,
      );
      if (mine.some((e) => !!e.feedback)) {
        return NextResponse.json(
          { ok: false, error: "你已提交过同伴评审，请勿重复提交" },
          { status: 409 },
        );
      }

      const placeholder = mine.find((e) => !e.feedback);
      let evaluationId: string;
      if (placeholder) {
        // Fill the assignment record in place (no duplicate rows)
        await feishu.updateEvaluation(placeholder.recordId, {
          score_total: Number(score),
          feedback: String(feedback),
        });
        evaluationId = placeholder.evaluation_id;
      } else {
        // Unsolicited but allowed peer review — create a new record
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
        evaluationId = evaluation.evaluation_id;
      }

      // Notify the submitter (best-effort)
      notifyStudent(
        submission.student_id,
        `🤝 收到同伴评审\n\n你的项目「${submission.project_title}」收到一份同伴评审：${Number(score)} 分。\n反馈：${String(feedback)}`,
      ).catch(() => {});

      return NextResponse.json({
        ok: true,
        evaluationId,
        message: "同伴评审已提交",
      });
    }

    // ---- Teacher review (existing P1a) ----
    // AGENT_CN.md §8.2: Agent channels must go through Redis Stream
    const isAgentChannel = principal.role === "agent";
    if (isAgentChannel) {
      return NextResponse.json(
        { ok: false, error: "Agent 通道请通过消息总线提交评审" },
        { status: 400 },
      );
    }

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
