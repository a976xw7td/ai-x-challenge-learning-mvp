import { NextResponse } from "next/server";
import { checkRepoHealth } from "@/lib/server/github";

export async function POST(request: Request) {
  try {
    const { repoUrl } = await request.json();
    const githubCheck = await checkRepoHealth(repoUrl);
    return NextResponse.json({ ok: true, githubCheck });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "GitHub check failed" },
      { status: 500 },
    );
  }
}

