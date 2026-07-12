import { NextResponse } from "next/server";
import { submitChallengeProject } from "@/lib/server/workflow";
import type { SubmissionInput } from "@/lib/server/types";
import { getPrincipal } from "@/lib/server/principal";
import { AuditTrail, SUBMISSION_TASK_AGENT } from "@/lib/server/agents";
import { enqueue, flush } from "@/lib/server/audit-outbox";
import { publishEnvelope } from "@/lib/server/redis-stream";
import { buildEnvelope } from "@/lib/server/agents";
import { createTask } from "@/lib/server/tasks";
import { getRedis } from "@/lib/server/redis";
import { makeId } from "@/lib/server/ids";

export async function POST(request: Request) {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
    }

    const input = (await request.json()) as SubmissionInput;

    // Row-level permission: student can only submit as themselves
    if (principal.role === "student" && input.studentId !== principal.person) {
      const audit = new AuditTrail();
      audit.log(SUBMISSION_TASK_AGENT, "identity_mismatch", input.studentId, {
        error_trace: `Principal ${principal.person} tried to submit as ${input.studentId}`,
      });
      enqueue(audit.entries);
      flush();
      return NextResponse.json(
        { ok: false, error: "无权代他人提交", auditTrail: audit.entries },
        { status: 403 },
      );
    }

    // Determine fromAgent based on principal
    const isAgentChannel = principal.role === "agent";
    const fromAgent = isAgentChannel
      ? principal.person // "student-companion-zhanghao-001" etc.
      : "student-companion-webapp-fallback";

    // AGENT_CN.md §8.2: Agent channels MUST go through Redis Stream (no sync fallback)
    const redis = getRedis();

    if (isAgentChannel && !redis) {
      return NextResponse.json(
        { ok: false, error: "消息总线不可用，请稍后重试" },
        { status: 503 },
      );
    }

    // Publish to Stream if Redis is available
    if (redis) {
      const taskId = makeId("task");
      await createTask(taskId, "submission_request", input.studentId);

      const auditTraceId = makeId("audit");
      const envelope = buildEnvelope({
        messageType: "submission_request",
        fromAgent,
        toAgent: SUBMISSION_TASK_AGENT,
        payload: input as unknown as Record<string, unknown>,
        auditId: auditTraceId,
      });

      const streamId = await publishEnvelope(envelope);

      if (!streamId) {
        if (isAgentChannel) {
          return NextResponse.json(
            { ok: false, error: "消息发布失败，请稍后重试" },
            { status: 503 },
          );
        }
        // Webapp: Stream publish failed, fall back to sync
        console.warn("[submit] Stream publish failed, falling back to sync");
      } else {
        return NextResponse.json({
          ok: true,
          task_id: taskId,
          status: "pending",
          message: "提交已受理，正在处理中...",
        });
      }
    }

    // Sync fallback: webapp only (agent channels blocked above)
    const result = await submitChallengeProject(input, isAgentChannel ? principal.person : undefined);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Submit failed" },
      { status: 500 },
    );
  }
}
