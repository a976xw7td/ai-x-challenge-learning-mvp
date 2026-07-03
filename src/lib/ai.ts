import { optionalEnv } from "./env";
import type { AiEvaluation, PortfolioDescription } from "./types";

type AiInput = {
  student: unknown;
  challenge: unknown;
  submission: unknown;
  githubCheck?: unknown;
  aiEvaluation?: unknown;
};

const defaultAiProvider = "deepseek";
const defaultAiBaseUrl = "https://api.deepseek.com";
const defaultAiModel = "deepseek-chat";

function fallbackEvaluation(): AiEvaluation {
  return {
    scoreTotal: 76,
    scores: {
      problemUnderstanding: 15,
      aiUsage: 15,
      artifactCompleteness: 16,
      technicalExecution: 15,
      reflectionQuality: 15,
    },
    strengths: "提交材料具备基本完整性，项目目标和成果描述清楚。",
    weaknesses: "当前为本地 fallback 初评，尚未接入真实 AI 评估。",
    suggestions: "补充更详细的实现过程、AI 使用记录、截图或 Demo 说明。",
    feedback: "这是系统在缺少 AI API Key 时生成的确定性初评草稿，仅用于本地开发和流程测试。",
    fallback: true,
  };
}

function fallbackPortfolioDescription(input: AiInput): PortfolioDescription {
  const submission = input.submission as { projectTitle?: string; projectSummary?: string };
  return {
    publicDescription: `${submission.projectTitle || "AI+X Mini Product"} 是一个用于展示 AI 辅助完成项目任务的示例作品。该作品沉淀了项目目标、实现过程、GitHub 产物和复盘记录，可作为学习成果展示。`,
    skills: ["AI 辅助开发", "项目复盘", "GitHub 工作流", "作品集整理"],
    fallback: true,
  };
}

function aiConfig() {
  const provider = optionalEnv("AI_PROVIDER") || defaultAiProvider;
  const apiKey = optionalEnv("DEEPSEEK_API_KEY") || optionalEnv("OPENAI_API_KEY");
  const baseUrl =
    optionalEnv("AI_BASE_URL") ||
    (provider === "openai" ? "https://api.openai.com" : defaultAiBaseUrl);
  const model =
    optionalEnv("AI_MODEL") ||
    (provider === "openai" ? "gpt-4.1-mini" : defaultAiModel);

  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ""), model };
}

async function callAiJson<T>(messages: Array<{ role: "system" | "user"; content: string }>): Promise<T> {
  const { apiKey, baseUrl, model } = aiConfig();
  if (!apiKey) throw new Error("AI API key missing");

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "AI request failed");
  return JSON.parse(payload.choices[0].message.content) as T;
}

export async function evaluateSubmission(input: AiInput): Promise<AiEvaluation> {
  if (!aiConfig().apiKey) return fallbackEvaluation();

  try {
    return await callAiJson<AiEvaluation>([
      {
        role: "system",
        content:
          "你是 AI+X 项目课的助教。请按问题理解、AI使用质量、产物完整性、技术实现、复盘质量五项各20分进行初评，只返回 JSON。",
      },
      {
        role: "user",
        content: JSON.stringify(input, null, 2),
      },
    ]);
  } catch {
    return fallbackEvaluation();
  }
}

export async function generatePortfolioDescription(input: AiInput): Promise<PortfolioDescription> {
  if (!aiConfig().apiKey) return fallbackPortfolioDescription(input);

  try {
    return await callAiJson<PortfolioDescription>([
      {
        role: "system",
        content:
          "你是作品集编辑。请把学生项目整理成可公开展示的中文简介，并给出3-6个技能标签。只返回 JSON：publicDescription, skills。",
      },
      {
        role: "user",
        content: JSON.stringify(input, null, 2),
      },
    ]);
  } catch {
    return fallbackPortfolioDescription(input);
  }
}
