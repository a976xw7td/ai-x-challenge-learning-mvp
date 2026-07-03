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

function normalizeStudent(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<Student> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    student_id: asString(f.student_id),
    name: asString(f.name),
    email: asString(f.email),
    github_username: asString(f.github_username),
    github_profile_url: asString(f.github_profile_url),
    school: asString(f.school),
    major: asString(f.major),
    grade: asString(f.grade),
    cohort: asString(f.cohort),
    ai_x_direction: asString(f.ai_x_direction),
    status: asString(f.status),
    portfolio_url: asString(f.portfolio_url),
  };
}

function normalizeChallenge(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<Challenge> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    challenge_id: asString(f.challenge_id),
    title: asString(f.title),
    brief: asString(f.brief),
    objective: asString(f.objective),
    deliverables: asString(f.deliverables),
    rubric: asString(f.rubric),
    deadline: asString(f.deadline),
    status: asString(f.status),
    created_by: asString(f.created_by),
  };
}

function normalizePortfolio(record: { record_id: string; fields: Record<string, unknown> }): FeishuRecord<PortfolioItem> {
  const f = record.fields;
  return {
    recordId: record.record_id,
    portfolio_item_id: asString(f.portfolio_item_id),
    student_id: asString(f.student_id),
    student_name: asString(f.student_name),
    submission_id: asString(f.submission_id),
    title: asString(f.title),
    type: asString(f.type),
    summary: asString(f.summary),
    public_description: asString(f.public_description),
    github_url: asString(f.github_url),
    demo_url: asString(f.demo_url),
    cover_image_url: asString(f.cover_image_url),
    skills: asString(f.skills),
    ai_feedback_summary: asString(f.ai_feedback_summary),
    is_public: asBoolean(f.is_public),
    created_at: asString(f.created_at),
  };
}

async function listRecords(tableId: string) {
  const payload = await feishuRequest<FeishuListResponse>(listPath(tableId));
  return payload.data?.items || [];
}

async function createRecord(tableId: string, fields: Record<string, unknown>) {
  const payload = await feishuRequest<FeishuCreateResponse>(createPath(tableId), {
    method: "POST",
    body: JSON.stringify({ fields }),
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

