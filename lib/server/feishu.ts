import { requireEnv } from "./env";
import { makeId } from "./ids";
import type { Challenge, FeishuRecord, PortfolioItem, Student } from "./types";

type FeishuListResponse = {
  code: number;
  msg?: string;
  data?: {
    items?: Array<{
      record_id: string;
      fields: Record<string, unknown>;
    }>;
  };
};

type FeishuCreateResponse = {
  code: number;
  msg?: string;
  data?: {
    record?: {
      record_id: string;
      fields: Record<string, unknown>;
    };
  };
};

let cachedTenantToken: { token: string; expiresAt: number } | null = null;

const FEISHU_FIELD_NAMES: Record<string, string> = {
  student_id: "学生ID",
  name: "姓名",
  email: "邮箱",
  github_username: "GitHub用户名",
  github_profile_url: "GitHub主页",
  school: "学校",
  major: "专业",
  grade: "年级",
  cohort: "班级/队列",
  ai_x_direction: "AI+X方向",
  status: "状态",
  portfolio_url: "作品集链接",
  challenge_id: "挑战ID",
  title: "标题",
  brief: "简介",
  objective: "目标",
  deliverables: "交付物",
  rubric: "评分标准",
  deadline: "截止时间",
  created_by: "创建人",
  submission_id: "提交ID",
  github_repo_url: "GitHub仓库链接",
  demo_url: "演示链接",
  summary: "摘要",
  submitted_at: "提交时间",
  github_check_status: "GitHub检查状态",
  readme_found: "README是否存在",
  latest_commit_at: "最新提交时间",
  student_name: "学生姓名",
  project_title: "项目标题",
  project_summary: "项目摘要",
  readme_url: "README链接",
  aar_text: "AAR复盘",
  self_evaluation_text: "自评文本",
  github_check_result: "GitHub检查结果",
  is_public: "是否公开",
  evaluation_id: "评价ID",
  score: "分数",
  level: "等级",
  strengths: "优点",
  risks: "风险",
  suggestions: "建议",
  reviewed_at: "评价时间",
  reviewer: "评价人",
  evaluator_type: "评价类型",
  evaluator_id: "评价人ID",
  score_total: "总分",
  scores_json: "分项分数JSON",
  weaknesses: "不足",
  feedback: "反馈",
  created_at: "创建时间",
  portfolio_item_id: "作品ID",
  description: "描述",
  evidence_summary: "证据摘要",
  type: "类型",
  public_description: "公开描述",
  github_url: "GitHub链接",
  cover_image_url: "封面图链接",
  skills: "技能",
  ai_feedback_summary: "AI反馈摘要",
};

function appToken() {
  return requireEnv("FEISHU_APP_TOKEN");
}

async function getTenantAccessToken() {
  if (cachedTenantToken && cachedTenantToken.expiresAt > Date.now() + 60_000) {
    return cachedTenantToken.token;
  }

  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: requireEnv("FEISHU_APP_ID"),
        app_secret: requireEnv("FEISHU_APP_SECRET"),
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`Feishu token failed: ${payload.msg || response.statusText}`);
  }

  cachedTenantToken = {
    token: payload.tenant_access_token,
    expiresAt: Date.now() + Math.max(1, payload.expire - 120) * 1000,
  };
  return cachedTenantToken.token;
}

async function feishuRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getTenantAccessToken();
  const response = await fetch(`https://open.feishu.cn/open-apis${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok || payload.code !== 0) {
    throw new Error(`Feishu API failed: ${payload.msg || response.statusText}`);
  }
  return payload as T;
}

function listPath(tableId: string) {
  return `/bitable/v1/apps/${appToken()}/tables/${tableId}/records?page_size=500`;
}

function createPath(tableId: string) {
  return `/bitable/v1/apps/${appToken()}/tables/${tableId}/records`;
}

function asString(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: unknown }).text);
  }
  return value == null ? "" : String(value);
}

function asBoolean(value: unknown) {
  return value === true || value === "true" || value === "是";
}

function field(fields: Record<string, unknown>, key: string) {
  return fields[FEISHU_FIELD_NAMES[key]] ?? fields[key];
}

function toFeishuFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [FEISHU_FIELD_NAMES[key] ?? key, value]),
  );
}

function normalizeStudent(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<Student> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    student_id: asString(field(f, "student_id")),
    name: asString(field(f, "name")),
    email: asString(field(f, "email")),
    feishu_open_id: asString(field(f, "feishu_open_id")),
    github_username: asString(field(f, "github_username")),
    github_profile_url: asString(field(f, "github_profile_url")),
    school: asString(field(f, "school")),
    major: asString(field(f, "major")),
    grade: asString(field(f, "grade")),
    cohort: asString(field(f, "cohort")),
    ai_x_direction: asString(field(f, "ai_x_direction")),
    status: asString(field(f, "status")),
    portfolio_url: asString(field(f, "portfolio_url")),
  };
}

function normalizeChallenge(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<Challenge> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    challenge_id: asString(field(f, "challenge_id")),
    title: asString(field(f, "title")),
    brief: asString(field(f, "brief")),
    objective: asString(field(f, "objective")),
    deliverables: asString(field(f, "deliverables")),
    rubric: asString(field(f, "rubric")),
    deadline: asString(field(f, "deadline")),
    status: asString(field(f, "status")),
    created_by: asString(field(f, "created_by")),
  };
}

function normalizePortfolio(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<PortfolioItem> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    portfolio_item_id: asString(field(f, "portfolio_item_id")),
    student_id: asString(field(f, "student_id")),
    student_name: asString(field(f, "student_name")),
    submission_id: asString(field(f, "submission_id")),
    title: asString(field(f, "title")),
    type: asString(field(f, "type")),
    summary: asString(field(f, "summary")),
    public_description: asString(field(f, "public_description")),
    github_url: asString(field(f, "github_url")),
    demo_url: asString(field(f, "demo_url")),
    cover_image_url: asString(field(f, "cover_image_url")),
    skills: asString(field(f, "skills")),
    ai_feedback_summary: asString(field(f, "ai_feedback_summary")),
    is_public: asBoolean(field(f, "is_public")),
    created_at: asString(field(f, "created_at")),
  };
}

async function listRecords(tableId: string) {
  const payload = await feishuRequest<FeishuListResponse>(listPath(tableId));
  return payload.data?.items || [];
}

async function createRecord(tableId: string, fields: Record<string, unknown>) {
  const payload = await feishuRequest<FeishuCreateResponse>(createPath(tableId), {
    method: "POST",
    body: JSON.stringify({ fields: toFeishuFields(fields) }),
  });
  return payload.data?.record;
}

export async function getStudents() {
  const rows = await listRecords(requireEnv("FEISHU_STUDENTS_TABLE_ID"));
  return rows.map(normalizeStudent).filter((student) => student.status !== "inactive");
}

export async function getStudentById(studentId: string) {
  const students = await getStudents();
  const student = students.find((item) => item.student_id === studentId);
  if (!student) throw new Error(`Student not found: ${studentId}`);
  return student;
}

export async function getPublishedChallenges() {
  const rows = await listRecords(requireEnv("FEISHU_CHALLENGES_TABLE_ID"));
  return rows.map(normalizeChallenge).filter((challenge) => challenge.status === "published");
}

export async function getChallengeById(challengeId: string) {
  const rows = await listRecords(requireEnv("FEISHU_CHALLENGES_TABLE_ID"));
  const challenge = rows.map(normalizeChallenge).find((item) => item.challenge_id === challengeId);
  if (!challenge) throw new Error(`Challenge not found: ${challengeId}`);
  return challenge;
}

export async function getPortfolioItems() {
  const rows = await listRecords(requireEnv("FEISHU_PORTFOLIO_TABLE_ID"));
  return rows.map(normalizePortfolio).filter((item) => item.is_public);
}

export async function createSubmission(fields: Record<string, unknown>) {
  const submission_id = asString(fields.submission_id) || makeId("sub");
  const record = await createRecord(requireEnv("FEISHU_SUBMISSIONS_TABLE_ID"), {
    ...fields,
    submission_id,
  });
  return { submission_id, recordId: record?.record_id };
}

export async function createEvaluation(fields: Record<string, unknown>) {
  const evaluation_id = asString(fields.evaluation_id) || makeId("eval");
  const record = await createRecord(requireEnv("FEISHU_EVALUATIONS_TABLE_ID"), {
    ...fields,
    evaluation_id,
  });
  return { evaluation_id, recordId: record?.record_id };
}

export async function createPortfolioItem(fields: Record<string, unknown>) {
  const portfolio_item_id = asString(fields.portfolio_item_id) || makeId("pf");
  const record = await createRecord(requireEnv("FEISHU_PORTFOLIO_TABLE_ID"), {
    ...fields,
    portfolio_item_id,
  });
  return { portfolio_item_id, recordId: record?.record_id };
}

export async function createChallenge(fields: Record<string, unknown>) {
  const challenge_id = asString(fields.challenge_id) || makeId("ch");
  const record = await createRecord(requireEnv("FEISHU_CHALLENGES_TABLE_ID"), {
    ...fields,
    challenge_id,
  });
  return { challenge_id, recordId: record?.record_id };
}

// ---- Submissions read (T10) ----

export type SubmissionRecord = FeishuRecord<{
  submission_id: string;
  student_id: string;
  student_name: string;
  challenge_id: string;
  project_title: string;
  project_summary?: string;
  github_repo_url?: string;
  github_branch?: string;
  github_commit?: string;
  github_check_result?: string;
  demo_url?: string;
  readme_url?: string;
  aar_text?: string;
  self_evaluation_text?: string;
  status?: string;
  task_state?: string;
  review_mode?: string;
  routing_status?: string;
  submitted_at?: string;
  is_public?: boolean;
  score_total?: number;
}>;

function normalizeSubmission(record: { record_id: string; fields: Record<string, unknown> }): SubmissionRecord {
  const f = record.fields;
  return {
    recordId: record.record_id,
    submission_id: asString(field(f, "submission_id")),
    student_id: asString(field(f, "student_id")),
    student_name: asString(field(f, "student_name")),
    challenge_id: asString(field(f, "challenge_id")),
    project_title: asString(field(f, "project_title")),
    project_summary: asString(field(f, "project_summary")),
    github_repo_url: asString(field(f, "github_repo_url")),
    github_branch: asString(field(f, "github_branch")),
    github_commit: asString(field(f, "github_commit")),
    github_check_result: asString(field(f, "github_check_result")),
    demo_url: asString(field(f, "demo_url")),
    readme_url: asString(field(f, "readme_url")),
    aar_text: asString(field(f, "aar_text")),
    self_evaluation_text: asString(field(f, "self_evaluation_text")),
    status: asString(field(f, "status")),
    task_state: asString(field(f, "task_state")),
    review_mode: asString(field(f, "review_mode")),
    routing_status: asString(field(f, "routing_status")),
    submitted_at: asString(field(f, "submitted_at")),
    is_public: asBoolean(field(f, "is_public")),
    score_total: Number(field(f, "score_total") || "0"),
  };
}

export async function getSubmissions(filter?: { studentId?: string }): Promise<SubmissionRecord[]> {
  const rows = await listRecords(requireEnv("FEISHU_SUBMISSIONS_TABLE_ID"));
  let results = rows.map(normalizeSubmission);
  if (filter?.studentId) {
    results = results.filter((s) => s.student_id === filter.studentId);
  }
  return results;
}

export async function getSubmissionById(submissionId: string): Promise<SubmissionRecord | null> {
  const rows = await listRecords(requireEnv("FEISHU_SUBMISSIONS_TABLE_ID"));
  const found = rows.map(normalizeSubmission).find((s) => s.submission_id === submissionId);
  return found || null;
}

// ---- Submissions update (T11) ----

export async function updateSubmission(recordId: string, fields: Record<string, unknown>): Promise<void> {
  const token = await getTenantAccessToken();
  const resp = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken()}/tables/${requireEnv("FEISHU_SUBMISSIONS_TABLE_ID")}/records/${recordId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ fields: toFeishuFields(fields) }),
    },
  );
  const payload = await resp.json();
  if (!resp.ok || payload.code !== 0) {
    throw new Error(`Feishu update failed: ${payload.msg || resp.statusText}`);
  }
}
