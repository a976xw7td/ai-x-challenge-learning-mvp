import { optionalEnv } from "./env";
import type { AiEvaluation, PortfolioDescription } from "./types";
import { z } from "zod";

type AiInput = {
  student: unknown;
  challenge: unknown;
  submission: unknown;
  githubCheck?: unknown;
  aiEvaluation?: unknown;
};

// ---- Zod schema for AI evaluation validation ----

const AiEvaluationSchema = z.object({
  problemUnderstanding: z.number().int().min(0).max(20),
  aiUsage: z.number().int().min(0).max(20),
  artifactCompleteness: z.number().int().min(0).max(20),
  technicalExecution: z.number().int().min(0).max(20),
  reflectionQuality: z.number().int().min(0).max(20),
  scoreTotal: z.number().int().min(0).max(100),
  strengths: z.string().min(1),
  weaknesses: z.string().min(1),
  suggestions: z.string().min(1),
  feedback: z.string().min(1),
});

type AiEvaluationRaw = z.infer<typeof AiEvaluationSchema>;

// ---- Default rubric (used when challenge has no rubric) ----

const DEFAULT_RUBRIC = `请按以下五维标准评分（每项 0-20 分，总分 100）：

1. 问题理解 (problemUnderstanding, 0-20)：是否准确理解项目目标与挑战
2. AI 使用质量 (aiUsage, 0-20)：AI 工具使用是否恰当、有效
3. 产物完整性 (artifactCompleteness, 0-20)：交付物是否齐全、可运行
4. 技术实现 (technicalExecution, 0-20)：技术方案与代码质量
5. 复盘质量 (reflectionQuality, 0-20)：AAR 反思是否深入、有洞察`;

// ---- AI config ----

const defaultAiProvider = "deepseek";
const defaultAiBaseUrl = "https://api.deepseek.com";
const defaultAiModel = "deepseek-chat";

function fallbackEvaluation(reason: string): AiEvaluation {
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
    fallbackReason: reason,
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

// ---- Public API ----

export async function evaluateSubmission(input: AiInput): Promise<AiEvaluation> {
  const config = aiConfig();
  if (!config.apiKey) {
    const reason = "AI_API_KEY_missing";
    console.error("[ai] fallback:", reason);
    return fallbackEvaluation(reason);
  }

  // Extract rubric from challenge
  const challenge = input.challenge as { rubric?: string } | undefined;
  const rubricText = challenge?.rubric?.trim() || DEFAULT_RUBRIC;

  const systemPrompt = `你是 AI+X 项目课的助教。请按以下评分标准进行初评，只返回严格 JSON。

评分标准：
${rubricText}

返回格式（严格 JSON，所有字段必填）：
{
  "problemUnderstanding": <0-20 整数>,
  "aiUsage": <0-20 整数>,
  "artifactCompleteness": <0-20 整数>,
  "technicalExecution": <0-20 整数>,
  "reflectionQuality": <0-20 整数>,
  "scoreTotal": <五项之和，0-100 整数>,
  "strengths": "<优点，非空字符串>",
  "weaknesses": "<不足，非空字符串>",
  "suggestions": "<改进建议，非空字符串>",
  "feedback": "<综合评价，非空字符串>"
}`;

  // Try up to 2 times (initial + 1 retry)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callAiJson<AiEvaluationRaw>([
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(input, null, 2) },
      ]);

      // Zod validation
      const parsed = AiEvaluationSchema.safeParse(raw);
      if (!parsed.success) {
        if (attempt === 0) {
          console.warn("[ai] schema validation failed, retrying:", parsed.error.flatten());
          continue; // retry once
        }
        const reason = `schema_validation_failed: ${parsed.error.flatten().fieldErrors}`;
        console.error("[ai] fallback:", reason);
        return fallbackEvaluation(reason);
      }

      const result = parsed.data;

      // Trust, but verify: enforce scoreTotal = sum of dimensions
      const computedTotal =
        result.problemUnderstanding +
        result.aiUsage +
        result.artifactCompleteness +
        result.technicalExecution +
        result.reflectionQuality;

      return {
        scoreTotal: computedTotal,
        scores: {
          problemUnderstanding: result.problemUnderstanding,
          aiUsage: result.aiUsage,
          artifactCompleteness: result.artifactCompleteness,
          technicalExecution: result.technicalExecution,
          reflectionQuality: result.reflectionQuality,
        },
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        suggestions: result.suggestions,
        feedback: result.feedback,
      };
    } catch (err) {
      if (attempt === 0) {
        console.warn("[ai] AI call failed, retrying:", err instanceof Error ? err.message : String(err));
        continue;
      }
      const reason = `ai_call_failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error("[ai] fallback:", reason);
      return fallbackEvaluation(reason);
    }
  }

  // Should not reach here, but TypeScript requires a return
  const reason = "unexpected_loop_exit";
  console.error("[ai] fallback:", reason);
  return fallbackEvaluation(reason);
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
