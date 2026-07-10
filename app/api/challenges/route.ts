import { NextResponse } from "next/server";
import { getPublishedChallenges } from "@/lib/server/feishu";
import { publishChallenge } from "@/lib/server/challenge-workflow";

export async function GET() {
  try {
    const challenges = await getPublishedChallenges();
    return NextResponse.json({ ok: true, challenges });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load challenges" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await publishChallenge(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Publish failed" },
      { status: 500 },
    );
  }
}

