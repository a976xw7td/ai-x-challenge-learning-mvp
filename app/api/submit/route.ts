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
    // T9: Require authenticated session
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 },
      );
    }

    const input = (await request.json()) as SubmissionInput;

    // T9: Row-level permission
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

    // T20: If Redis is available, publish async → return task_id immediately
    const redis = getRedis();
    if (redis) {
      const taskId = makeId("task");

      // Create task record
      await createTask(taskId, "submission_request", input.studentId);

      // Publish envelope to Redis Stream
      const envelope = buildEnvelope({
        messageType: "submission_request",
        fromAgent: "student-companion-webapp-fallback",
        toAgent: SUBMISSION_TASK_AGENT,
        payload: input as unknown as Record<string, unknown>,
        auditId: taskId,
      });

      const streamId = await publishEnvelope(envelope);
      if (!streamId) {
        // Stream publish failed, fall back to sync
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

    // Sync fallback: call workflow directly (existing behavior, P1a)
    const result = await submitChallengeProject(input);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Submit failed" },
      { status: 500 },
    );
  }
}
