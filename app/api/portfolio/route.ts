import { NextResponse } from "next/server";
import { getPortfolioItems } from "@/lib/server/feishu";
import { getPrincipal, getStudentId } from "@/lib/server/principal";

export async function GET() {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "请先登录" },
        { status: 401 },
      );
    }

    const items = await getPortfolioItems();

    // Row-level: student sees public items + their own private items
    const studentId = getStudentId(principal);
    if (studentId) {
      const filtered = items.filter(
        (item) => item.is_public || item.student_id === studentId,
      );
      return NextResponse.json({ ok: true, items: filtered });
    }

    // Teacher/admin: see all
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load portfolio" },
      { status: 500 },
    );
  }
}
