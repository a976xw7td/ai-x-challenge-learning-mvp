import { NextResponse } from "next/server";
import { getStudents } from "@/lib/server/feishu";

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json({ ok: true, students });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load students" },
      { status: 500 },
    );
  }
}

