import { NextResponse } from "next/server";
import { submitChallengeProject } from "@/lib/server/workflow";
import type { SubmissionInput } from "@/lib/server/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as SubmissionInput;
    const result = await submitChallengeProject(input);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Submit failed" },
      { status: 500 },
    );
  }
}

