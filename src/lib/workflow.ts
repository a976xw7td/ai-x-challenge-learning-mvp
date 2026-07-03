import * as ai from "./ai";
import * as feishu from "./feishu";
import * as github from "./github";
import type { SubmissionInput, WorkflowResult } from "./types";

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

export async function submitChallengeProject(input: SubmissionInput): Promise<WorkflowResult> {
  try {
    validateInput(input);

    const student = await feishu.getStudentById(input.studentId);
    const challenge = await feishu.getChallengeById(input.challengeId);
    const githubCheck = await github.checkRepoHealth(input.githubRepoUrl);

    const aiEvaluation = await ai.evaluateSubmission({
      student,
      challenge,
      submission: input,
      githubCheck,
    });

    const submission = await feishu.createSubmission({
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
    });

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

    const portfolioDescription = await ai.generatePortfolioDescription({
      student,
      challenge,
      submission: input,
      githubCheck,
      aiEvaluation,
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

    return {
      ok: true,
      submissionId: submission.submission_id,
      evaluationId: evaluation.evaluation_id,
      portfolioItemId: portfolioItem.portfolio_item_id,
      githubCheck,
      aiEvaluation,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown workflow error",
    };
  }
}

