// review-workflow.ts — Teacher final review (§4.3 manual_review_adjustment + dual-column status)
// The teacher confirms or returns a submission. Writes Evaluations (teacher type),
// updates Submission status + task_state, audits, and notifies the student.
import * as feishu from "./feishu";
import {
  AuditTrail,
  buildEnvelope,
  isTrusted,
  SUBMISSION_TASK_AGENT,
  WEBAPP_FALLBACK_TEACHER_AGENT,
} from "./agents";
import { enqueue, flush } from "./audit-outbox";
import { notifyStudent } from "./notify";

export interface TeacherReviewInput {
  submissionId: string;
  submissionRecordId: string; // feishu record_id for update
  studentId: string;
  action: "accept" | "return";
  score: number;
  feedback: string;
}

export interface TeacherReviewResult {
  ok: boolean;
  evaluationId?: string;
  error?: string;
  auditTrail?: unknown[];
}

export async function teacherFinalizeReview(input: TeacherReviewInput): Promise<TeacherReviewResult> {
  const audit = new AuditTrail();

  try {
    // 1. Construct manual_review_adjustment envelope (extended type, not in Team3 enum)
    const envelope = buildEnvelope({
      messageType: "manual_review_adjustment",
      fromAgent: WEBAPP_FALLBACK_TEACHER_AGENT,
      toAgent: SUBMISSION_TASK_AGENT,
      payload: {
        submission_id: input.submissionId,
        student_id: input.studentId,
        action: input.action,
        score: input.score,
        feedback: input.feedback,
      },
      auditId: audit.traceId,
    });
    audit.log(WEBAPP_FALLBACK_TEACHER_AGENT, "send_manual_review_adjustment", envelope.message_id);

    // 2. Trust check: teacher → submission-task agent
    if (!isTrusted(envelope.from_agent, envelope.to_agent)) {
      throw new Error("评审请求来自未受信任的 Agent，已拒绝");
    }
    audit.log(SUBMISSION_TASK_AGENT, "verify_relationship_review", envelope.from_agent);

    // 3. Write teacher evaluation to Evaluations table
    const evaluation = await feishu.createEvaluation({
      submission_id: input.submissionId,
      student_id: input.studentId,
      evaluator_type: "teacher",
      score_total: input.score,
      feedback: input.feedback,
      created_at: new Date().toISOString(),
    });
    audit.log(SUBMISSION_TASK_AGENT, "create_teacher_evaluation", String(evaluation.evaluation_id), {
      after_state: { evaluator_type: "teacher", score: input.score, action: input.action },
    });

    // 4. Update Submission record: status + task_state (dual column, §4.3)
    const newStatus = input.action === "accept" ? "accepted" : "needs_teacher_revision";
    const newTaskState = input.action === "accept" ? "COMPLETED" : "RETURNED_FOR_REVISION";

    try {
      await feishu.updateSubmission(input.submissionRecordId, {
        status: newStatus,
        task_state: newTaskState,
      });
      audit.log(SUBMISSION_TASK_AGENT, "update_submission_status", input.submissionId, {
        before_state: {},
        after_state: { status: newStatus, task_state: newTaskState },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isFieldNotFound =
        msg.includes("1254045") ||
        msg.includes("FieldNameNotFound") ||
        msg.includes("field not found");
      if (isFieldNotFound) {
        // ADR-003 fallback: task_state column may not exist, only update status
        audit.log(SUBMISSION_TASK_AGENT, "task_state_field_missing", input.submissionId);
        await feishu.updateSubmission(input.submissionRecordId, { status: newStatus });
        audit.log(SUBMISSION_TASK_AGENT, "update_submission_status_fallback", input.submissionId, {
          after_state: { status: newStatus, task_state: "⚠️ column missing" },
        });
      } else {
        throw err;
      }
    }

    // 5. Notify student (T8)
    const actionText = input.action === "accept" ? "通过 ✅" : "需要修改 ⚠️";
    notifyStudent(input.studentId,
      `📢 你的提交「${input.submissionId}」教师终评结果：
${actionText}
分数：${input.score}/100
评语：${input.feedback}`
    ).then((result) => {
      if (!result.ok) {
        const entry = audit.log(SUBMISSION_TASK_AGENT, "notify_failed", input.studentId, { error_trace: result.error });
        enqueue([entry]);
        flush();
      }
    });

    enqueue(audit.entries);
    flush();

    return {
      ok: true,
      evaluationId: evaluation.evaluation_id,
      auditTrail: audit.entries,
    };
  } catch (error) {
    audit.log(SUBMISSION_TASK_AGENT, "teacher_review_failed", input.submissionId, {
      error_trace: error instanceof Error ? error.message : String(error),
    });
    enqueue(audit.entries);
    flush();
    return {
      ok: false,
      error: error instanceof Error ? error.message : "评审失败",
      auditTrail: audit.entries,
    };
  }
}
