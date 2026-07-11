// GET /api/tasks/[id] — Task status query (T20).
// Checks Redis cache first; Feishu is the source of truth (决策一).
import { NextResponse } from "next/server";
import { getTask } from "@/lib/server/tasks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) {
    return NextResponse.json(
      { ok: false, error: "任务不存在或已过期" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, task });
}
