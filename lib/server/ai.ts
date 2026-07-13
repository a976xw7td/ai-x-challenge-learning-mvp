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

// Default rubric used when challenge has no custom rubric
const DEFAULT_RUBRIC = "问题理解 20分；AI使用质量 20分；产物完整性 20分；技术实现 20分；复盘质量 20分";

function parseRubricDimensions(rubricText: string): Array<{ name: string; maxScore: number }> {
  const cleaned = rubricText
    .replace(/[；;；]/g, ";")
    .replace(/[＋+]/g, "+")
    .replace(/[％%]/g, "%")
    .trim();

  // Try to split by common delimiters
  const parts = cleaned.split(/[;；\n+]+/).filter(Boolean);

  if (parts.length === 0) {
    // Can't parse — return single-dimension fallback
    return [{ name: "综合评分", maxScore: 100 }];
  }

  const dims: Array<{ name: string; maxScore: number }> = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.length < 2) continue;

    // Try to extract "name number" or "name number%" or "name number分"
    const match = trimmed.match(/^(.+?)\s*(\d+)\s*[分%]?\s*$/);
    if (match) {
      dims.push({ name: match[1].trim(), maxScore: parseInt(match[2], 10) });
    } else {
      // Can't parse number — just use the text as dimension name with equal weight
      dims.push({ name: trimmed, maxScore: 20 });
    }
  }

  if (dims.length === 0) {
    return [{ name: "综合评分", maxScore: 100 }];
  }

  return dims;
}

function fallbackEvaluation(rubricText?: string): AiEvaluation {
  const dims = parseRubricDimensions(rubricText || DEFAULT_RUBRIC);
  const scores: Record<string, number> = {};

  // Deterministic fallback scores: ~75% of max for each dimension
  for (const dim of dims) {
    scores[dim.name] = Math.round(dim.maxScore * 0.75);
  }

  return {
    scoreTotal: 76,
    scores,
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

// Runtime validation: ensure the AI response has the required fields.
// If validation fails, throws so the caller's catch block returns fallback.
function validateAiEvaluation(obj: unknown): AiEvaluation {
  if (!obj || typeof obj !== "object") {
    throw new Error("AI evaluation response is not an object");
  }
  const o = obj as Record<string, unknown>;

  if (typeof o.scoreTotal !== "number") {
    throw new Error(`AI evaluation missing scoreTotal (got ${typeof o.scoreTotal})`);
  }
  if (!o.scores || typeof o.scores !== "object") {
    throw new Error("AI evaluation missing scores object");
  }
  if (typeof o.strengths !== "string") {
    throw new Error("AI evaluation missing strengths");
  }
  if (typeof o.weaknesses !== "string") {
    throw new Error("AI evaluation missing weaknesses");
  }
  if (typeof o.suggestions !== "string") {
    throw new Error("AI evaluation missing suggestions");
  }
  if (typeof o.feedback !== "string") {
    throw new Error("AI evaluation missing feedback");
  }

  // Validate scores values are numbers
  const scores = o.scores as Record<string, unknown>;
  for (const [key, value] of Object.entries(scores)) {
    if (typeof value !== "number") {
      throw new Error(`AI evaluation score "${key}" is not a number (got ${typeof value})`);
    }
  }

  return {
    scoreTotal: o.scoreTotal,
    scores: scores as Record<string, number>,
    strengths: o.strengths,
    weaknesses: o.weaknesses,
    suggestions: o.suggestions,
    feedback: o.feedback,
  };
}

function buildEvaluationPrompt(rubricText: string): string {
  return `你是 AI+X 项目课的助教。请严格按照以下评分标准对学生提交进行初评。

评分标准：
${rubricText}

请按评分标准中的每一项维度独立打分，然后返回如下 JSON（只返回 JSON，不要其他文字）：
{
  "scoreTotal": <加权总分，0-100 的整数>,
  "scores": {
    "<评分维度名>": <该维度得分>,
    ...
  },
  "strengths": "<优点，100字以内>",
  "weaknesses": "<不足，100字以内>",
  "suggestions": "<改进建议，150字以内>",
  "feedback": "<综合评语，200字以内>"
}

注意：
- scores 里每个维度的名字必须和评分标准里的一模一样
- scoreTotal 是所有维度加权后的总分
- 所有文字字段必须用中文`;
}

export async function evaluateSubmission(
  input: AiInput,
  rubricText?: string,
): Promise<AiEvaluation> {
  const rubric = rubricText || DEFAULT_RUBRIC;

  if (!aiConfig().apiKey) return fallbackEvaluation(rubric);

  try {
    const result = await callAiJson<AiEvaluation>([
      {
        role: "system",
        content: buildEvaluationPrompt(rubric),
      },
      {
        role: "user",
        content: JSON.stringify(input, null, 2),
      },
    ]);
    return validateAiEvaluation(result);
  } catch {
    return fallbackEvaluation(rubric);
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
