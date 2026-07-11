import { NextResponse } from "next/server";
import { submitChallengeProject } from "@/lib/server/workflow";
import type { SubmissionInput } from "@/lib/server/types";
import { getPrincipal } from "@/lib/server/principal";
import { AuditTrail, SUBMISSION_TASK_AGENT } from "@/lib/server/agents";
import { enqueue, flush } from "@/lib/server/audit-outbox";

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

    // T9: Row-level permission — student can only submit as themselves
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

    const result = await submitChallengeProject(input);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Submit failed" },
      { status: 500 },
    );
  }
}
