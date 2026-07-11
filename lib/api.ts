// Client-side adapter: fetch real data from the MVP backend APIs and map to
// the UI types; fall back to the local mock data when the backend (Feishu
// env vars etc.) is not configured, so the UI always renders.
import {
  challenges as mockChallenges,
  portfolioItems as mockPortfolio,
  type Challenge,
  type PortfolioItem,
} from "./data";

type BackendChallenge = {
  challenge_id: string;
  title: string;
  brief?: string;
  objective?: string;
  deadline?: string;
  status?: string;
};

type BackendPortfolioItem = {
  portfolio_item_id?: string;
  student_id: string;
  student_name: string;
  submission_id?: string;
  title: string;
  summary?: string;
  skills?: string;
  github_url?: string;
  demo_url?: string;
  is_public?: boolean;
  created_at?: string;
};

export async function fetchChallenges(): Promise<{ items: Challenge[]; live: boolean }> {
  try {
    const res = await fetch("/api/challenges");
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.challenges) || data.challenges.length === 0) throw new Error();
    const items: Challenge[] = (data.challenges as BackendChallenge[]).map((c, i) => ({
      id: c.challenge_id,
      number: `Challenge ${String(i + 1).padStart(2, "0")}`,
      title: c.title,
      description: c.brief || c.objective || "",
      difficulty: "进阶",
      status: c.status === "closed" ? "已完成" : "进行中",
      team: "",
    }));
    return { items, live: true };
  } catch {
    return { items: mockChallenges, live: false };
  }
}

export async function fetchPortfolio(): Promise<{ items: PortfolioItem[]; live: boolean }> {
  try {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    const list = data.portfolioItems ?? data.items;
    if (!data.ok || !Array.isArray(list) || list.length === 0) throw new Error();
    const items: PortfolioItem[] = (list as BackendPortfolioItem[]).map((p) => ({
      id: p.portfolio_item_id || p.submission_id || p.title,
      studentName: p.student_name,
      studentId: p.student_id,
      challengeTitle: p.title,
      challengeId: p.submission_id || "",
      summary: p.summary || "",
      techStack: (p.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      demoUrl: p.demo_url || undefined,
      githubRepo: (p.github_url || "").replace(/^https?:\/\/github\.com\//, ""),
      aiScore: 0,
      isPublic: p.is_public ?? true,
      submittedAt: p.created_at || "",
    }));
    return { items, live: true };
  } catch {
    return { items: mockPortfolio, live: false };
  }
}

export type GithubCheckResult = {
  repoExists: boolean;
  readmeExists: boolean;
  latestCommitAt?: string;
  warnings: string[];
  score: number;
};

export async function checkGithubRepo(repoUrl: string): Promise<GithubCheckResult | null> {
  try {
    const res = await fetch("/api/github/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });
    const data = await res.json();
    return data.ok ? data.githubCheck : null;
  } catch {
    return null;
  }
}

export type SubmitPayload = {
  studentId: string;
  challengeId: string;
  projectTitle: string;
  projectSummary: string;
  githubRepoUrl: string;
  githubBranch?: string;
  demoUrl?: string;
  aarText: string;
  selfEvaluationText: string;
  isPublic: boolean;
};

export async function submitProject(payload: SubmitPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "提交失败" };
  }
}

// ---- Auth (T9) ----

export type LoginPayload = { studentId: string; name: string };
export type UserInfo = { person: string; role: string; name?: string };

export async function login(payload: LoginPayload): Promise<{ ok: boolean; error?: string; person?: string; role?: string; name?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "登录失败" };
  }
}

export async function fetchCurrentUser(): Promise<{ ok: boolean; person?: string; role?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/me");
    return await res.json();
  } catch {
    return { ok: false, error: "网络错误" };
  }
}

// ---- Submissions (T10) ----

export type SubmissionListItem = {
  submission_id: string;
  student_id: string;
  student_name: string;
  challenge_id: string;
  project_title: string;
  project_summary?: string;
  github_repo_url?: string;
  status?: string;
  task_state?: string;
  review_mode?: string;
  submitted_at?: string;
  score_total?: number;
};

export async function fetchSubmissions(): Promise<{ ok: boolean; submissions?: SubmissionListItem[]; error?: string }> {
  try {
    const res = await fetch("/api/submissions");
    return await res.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "加载失败" };
  }
}

export async function fetchSubmissionById(id: string): Promise<{ ok: boolean; submission?: SubmissionListItem; error?: string }> {
  try {
    const res = await fetch(`/api/submissions/${id}`);
    return await res.json();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "加载失败" };
  }
}
