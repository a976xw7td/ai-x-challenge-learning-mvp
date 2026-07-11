// Submission Task Agent workflow — the "architecture red line" (AGENT_CN.md §2.4):
// the WebApp acts as Student Companion fallback and only *requests* submission;
// this module, acting as submission-task-agent-001, is the only writer of the
// final Submission Record. Every state change carries an audit entry.
import * as ai from "./ai";
import * as feishu from "./feishu";
import * as github from "./github";
import type { SubmissionInput, WorkflowResult } from "./types";
import { ReviewMode } from "../schemas/zod-from-schemas";
import {
  AuditTrail,
  buildEnvelope,
  isTrusted,
  ADMIN_IDENTITY_MODE,
  REVIEW_TASK_AGENT,
  SUBMISSION_TASK_AGENT,
  WEBAPP_FALLBACK_STUDENT_AGENT,
} from "./agents";
import { enqueue, flush } from "./audit-outbox";

// T3: In-memory deduplication map for submission idempotency.
// Key: `${studentId}:${challengeId}:${githubRepoUrl}`, value: timestamp.
// Entries expire after 60 seconds. Single-instance only — replace with a
// shared store (Redis / DB) for multi-instance deployments.
const dedupeCache = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60_000;

function validateInput(input: SubmissionInput) {
  const required: Array<[keyof SubmissionInput, string]> = [
    ["studentId", "学生"],
    ["challengeId", "Challenge"],
    ["projectTitle", "项目名称"],
    ["projectSummary", "项目简介"],
    ["githubRepoUrl", "GitHub Repo"],
    ["aarText", "AAR 复盘"],
    ["selfEvaluationText", "自评"],
  ];
  for (const [key, label] of required) {
    if (!input[key]) throw new Error(`缺少必填项：${label}`);
  }
}

// Feishu rejects unknown field names; agent-extension columns may not exist yet
// on older Bitable tables. Only fall back to the base field set when the error
// is specifically a field-not-found error (Feishu code 1254045 or FieldNameNotFound).
// Any other error (network, auth, etc.) is re-thrown to prevent duplicate writes.
async function createSubmissionWithAgentFields(
  baseFields: Record<string, unknown>,
  agentFields: Record<string, unknown>,
  audit: AuditTrail,
) {
  try {
    return await feishu.createSubmission({ ...baseFields, ...agentFields });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isFieldNotFound =
      msg.includes("1254045") ||
      msg.includes("FieldNameNotFound") ||
      msg.includes("field not found") ||
      msg.includes("unknown field");
    if (isFieldNotFound) {
      audit.log(SUBMISSION_TASK_AGENT, "agent_fields_dropped", "pending_submission");
      return await feishu.createSubmission(baseFields);
    }
    throw err;
  }
}

export async function submitChallengeProject(input: SubmissionInput): Promise<WorkflowResult> {
  const audit = new AuditTrail();
  const dedupeKey = `${input.studentId}:${input.challengeId}:${input.githubRepoUrl}`;
  try {
    // 1. Student Companion (webapp fallback) constructs the submission request
    const envelope = buildEnvelope({
      messageType: "submission_request",
      fromAgent: WEBAPP_FALLBACK_STUDENT_AGENT,
      toAgent: SUBMISSION_TASK_AGENT,
      payload: { student_id: input.studentId, challenge_id: input.challengeId, github_repo: input.githubRepoUrl },
      auditId: audit.traceId,
    });
    audit.log(WEBAPP_FALLBACK_STUDENT_AGENT, "send_submission_request", envelope.message_id);

    // 2. Inbox: verify trusted relationship before executing any skill
    if (!isTrusted(envelope.from_agent, envelope.to_agent)) {
      throw new Error("提交请求来自未受信任的 Agent，已拒绝");
    }
    audit.log(SUBMISSION_TASK_AGENT, "verify_relationship", envelope.from_agent);

    // T3: Deduplication — reject identical submissions within 60s window
    const lastTs = dedupeCache.get(dedupeKey);
    if (lastTs !== undefined && Date.now() - lastTs < DEDUPE_WINDOW_MS) {
      audit.log(SUBMISSION_TASK_AGENT, "duplicate_submission_rejected", dedupeKey);
      enqueue(audit.entries);
      flush();
      return {
        ok: false,
        error: "重复提交，请勿重试",
        auditTrail: audit.entries,
      };
    }
    dedupeCache.set(dedupeKey, Date.now());

    // 3. Validate payload / identity / challenge state
    validateInput(input);
    const student = await feishu.getStudentById(input.studentId);
    audit.log(SUBMISSION_TASK_AGENT, "validate_student_identity", student.student_id);
    const challenge = await feishu.getChallengeById(input.challengeId);
    // T2: validate challenge is open for submission (backward compat: empty/null status = allowed)
    if (challenge.status && !["published", "active"].includes(challenge.status)) {
      audit.log(SUBMISSION_TASK_AGENT, "challenge_not_open", challenge.challenge_id, {
        after_state: { status: challenge.status },
      });
      throw new Error(`Challenge 未开放提交：${challenge.status}`);
    }
    audit.log(SUBMISSION_TASK_AGENT, "validate_challenge", challenge.challenge_id);

    // 4. Verify GitHub evidence pointer
    const githubCheck = await github.checkRepoHealth(input.githubRepoUrl);
    audit.log(SUBMISSION_TASK_AGENT, "verify_github_pointer", input.githubRepoUrl, {
      after_state: { repoExists: githubCheck.repoExists, score: githubCheck.score },
    });

    // 5. Route based on review_mode (T6)
    const reviewMode = (() => {
      const raw = input.reviewMode || "teacher_only";
      const parsed = ReviewMode.safeParse(raw);
      return parsed.success ? parsed.data : "teacher_only";
    })();

    let routingStatus: string;
    let aiEvaluation: Awaited<ReturnType<typeof ai.evaluateSubmission>> | null = null;

    if (reviewMode === "teacher_only") {
      // Existing behavior: AI initial evaluation
      const reviewEnvelope = buildEnvelope({
        messageType: "review_request",
        fromAgent: SUBMISSION_TASK_AGENT,
        toAgent: REVIEW_TASK_AGENT,
        payload: { challenge_id: challenge.challenge_id, student_id: student.student_id },
        auditId: audit.traceId,
      });
      audit.log(SUBMISSION_TASK_AGENT, "route_to_review_task_agent", reviewEnvelope.message_id);
      aiEvaluation = await ai.evaluateSubmission({ student, challenge, submission: input, githubCheck });
      audit.log(REVIEW_TASK_AGENT, "generate_ai_evaluation", challenge.challenge_id, {
        after_state: { scoreTotal: aiEvaluation.scoreTotal },
      });
      routingStatus = "routed_to_teacher";
    } else if (reviewMode === "peer_only") {
      // TODO: peer allocation pending P2
      const peerEnvelope = buildEnvelope({
        messageType: "peer_review_request",
        fromAgent: SUBMISSION_TASK_AGENT,
        toAgent: REVIEW_TASK_AGENT,
        payload: { challenge_id: challenge.challenge_id, student_id: student.student_id, mode: "peer_only" },
        auditId: audit.traceId,
      });
      audit.log(SUBMISSION_TASK_AGENT, "route_to_peer_review", peerEnvelope.message_id, {
        error_trace: "TODO: peer 分配待 P2 实现",
      });
      routingStatus = "routed_to_peer";
    } else {
      // teacher_and_peer
      const bothEnvelope = buildEnvelope({
        messageType: "peer_review_request",
        fromAgent: SUBMISSION_TASK_AGENT,
        toAgent: REVIEW_TASK_AGENT,
        payload: { challenge_id: challenge.challenge_id, student_id: student.student_id, mode: "teacher_and_peer" },
        auditId: audit.traceId,
      });
      audit.log(SUBMISSION_TASK_AGENT, "route_to_peer_review", bothEnvelope.message_id, {
        error_trace: "TODO: peer 分配待 P2 实现",
      });
      routingStatus = "routed_to_both";
    }

    // 6. Submission Task Agent writes the final Submission Record (red line)
    const submission = await createSubmissionWithAgentFields(
      {
        student_id: student.student_id,
        student_name: student.name,
        challenge_id: challenge.challenge_id,
        project_title: input.projectTitle,
        project_summary: input.projectSummary,
        github_repo_url: input.githubRepoUrl,
        readme_url: input.readmeUrl || "",
        demo_url: input.demoUrl || "",
        aar_text: input.aarText,
        self_evaluation_text: input.selfEvaluationText,
        github_check_result: JSON.stringify(githubCheck, null, 2),
        status: githubCheck.repoExists ? "checked" : "needs_revision",
        is_public: input.isPublic,
        submitted_at: new Date().toISOString(),
      },
      {
        submitted_by_agent_id: WEBAPP_FALLBACK_STUDENT_AGENT,
        processed_by_agent_id: SUBMISSION_TASK_AGENT,
        admin_identity_mode: ADMIN_IDENTITY_MODE,
        submission_request_id: envelope.request_id,
        audit_log_pointer: audit.traceId,
        review_mode: reviewMode,
        routing_status: routingStatus,
        github_branch: input.githubBranch || githubCheck.defaultBranch || "",
        github_commit: githubCheck.latestCommitAt || "",
      },
      audit,
    );
    audit.log(SUBMISSION_TASK_AGENT, "create_submission_record", String(submission.submission_id));

    // Only AI evaluation for teacher_only mode; peer modes skip AI eval (TODO P2)
    if (aiEvaluation) {
      const evaluation = await feishu.createEvaluation({
        submission_id: submission.submission_id,
        student_id: student.student_id,
        challenge_id: challenge.challenge_id,
        evaluator_type: "ai",
        score_total: aiEvaluation.scoreTotal,
        scores_json: JSON.stringify(aiEvaluation.scores, null, 2),
        strengths: aiEvaluation.strengths,
        weaknesses: aiEvaluation.weaknesses,
        suggestions: aiEvaluation.suggestions,
        feedback: aiEvaluation.feedback,
        created_at: new Date().toISOString(),
      });
      audit.log(REVIEW_TASK_AGENT, "create_evaluation_record", String(evaluation.evaluation_id));

      const portfolioDescription = await ai.generatePortfolioDescription({
        student, challenge, submission: input, githubCheck, aiEvaluation,
      });
      const portfolioItem = await feishu.createPortfolioItem({
        student_id: student.student_id,
        student_name: student.name,
        submission_id: submission.submission_id,
        title: input.projectTitle,
        type: "project",
        summary: input.projectSummary,
        public_description: portfolioDescription.publicDescription,
        github_url: input.githubRepoUrl,
        demo_url: input.demoUrl || "",
        cover_image_url: "",
        skills: portfolioDescription.skills.join(", "),
        ai_feedback_summary: aiEvaluation.feedback,
        is_public: input.isPublic,
        created_at: new Date().toISOString(),
      });
      audit.log(SUBMISSION_TASK_AGENT, "create_portfolio_item", String(portfolioItem.portfolio_item_id));

      enqueue(audit.entries);
      flush();
      return {
        ok: true,
        submissionId: submission.submission_id,
        evaluationId: evaluation.evaluation_id,
        portfolioItemId: portfolioItem.portfolio_item_id,
        githubCheck,
        aiEvaluation,
        auditTrail: audit.entries,
      };
    }

    enqueue(audit.entries);
    flush();
    return {
      ok: true,
      submissionId: submission.submission_id,
      githubCheck,
      auditTrail: audit.entries,
    };
  } catch (error) {
    // Failed submissions must not block a corrected retry within the window;
    // dedupe only guards against replaying a successful submission.
    dedupeCache.delete(dedupeKey);
    audit.log(SUBMISSION_TASK_AGENT, "workflow_failed", "submission", {
      error_trace: error instanceof Error ? error.message : String(error),
    });
    enqueue(audit.entries);
    flush();
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown workflow error",
      auditTrail: audit.entries,
    };
  }
}
