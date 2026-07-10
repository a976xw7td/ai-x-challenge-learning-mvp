import { NextResponse } from "next/server";
import { getPortfolioItems } from "@/lib/server/feishu";

export async function GET() {
  try {
    const items = await getPortfolioItems();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load portfolio" },
      { status: 500 },
    );
  }
}

