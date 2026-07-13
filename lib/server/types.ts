export type FeishuRecord<T> = T & {
  recordId?: string;
};

export type Student = {
  student_id: string;
  name: string;
  email?: string;
  feishu_open_id?: string;
  api_key?: string;
  class_id?: string;
  github_username?: string;
  github_profile_url?: string;
  school?: string;
  major?: string;
  grade?: string;
  cohort?: string;
  ai_x_direction?: string;
  status?: string;
  portfolio_url?: string;
};

export type Challenge = {
  challenge_id: string;
  title: string;
  brief?: string;
  objective?: string;
  deliverables?: string;
  rubric?: string;
  deadline?: string;
  status?: string;
  created_by?: string;
  teacher_id?: string;
  teacher_agent_id?: string;
  feishu_group_id?: string;
  airtable_record_id?: string;
  ontology_nodes?: string;
  learning_objectives?: string;
  required_deliverables?: string;
  rubric_pointer?: string;
  skills?: string;
  created_at?: string;
  updated_at?: string;
};

export type SubmissionInput = {
  studentId: string;
  challengeId: string;
  projectTitle: string;
  projectSummary: string;
  githubRepoUrl: string;
  githubBranch?: string;
  readmeUrl?: string;
  demoUrl?: string;
  aarText: string;
  selfEvaluationText: string;
  isPublic: boolean;
  reviewMode?: string;
};

export type GitHubCheck = {
  repoUrl: string;
  owner?: string;
  repo?: string;
  repoExists: boolean;
  repoAccessible: boolean;
  readmeExists: boolean;
  latestCommitAt?: string;
  latestCommitSha?: string;
  defaultBranch?: string;
  warnings: string[];
  score: number;
};

export type AiEvaluation = {
  scoreTotal: number;
  scores: Record<string, number>;
  strengths: string;
  weaknesses: string;
  suggestions: string;
  feedback: string;
  fallback?: boolean;
};

export type PortfolioDescription = {
  publicDescription: string;
  skills: string[];
  fallback?: boolean;
};

export type PortfolioItem = {
  portfolio_item_id?: string;
  student_id: string;
  student_name: string;
  submission_id?: string;
  title: string;
  type?: string;
  summary?: string;
  public_description?: string;
  github_url?: string;
  demo_url?: string;
  cover_image_url?: string;
  skills?: string;
  ai_feedback_summary?: string;
  is_public?: boolean;
  created_at?: string;
};

export type WorkflowResult = {
  ok: boolean;
  submissionId?: string;
  evaluationId?: string;
  portfolioItemId?: string;
  githubCheck?: GitHubCheck;
  aiEvaluation?: AiEvaluation;
  error?: string;
  auditTrail?: unknown[];
};

