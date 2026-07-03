import { NextResponse } from "next/server";
import { getPublishedChallenges } from "@/lib/feishu";

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

