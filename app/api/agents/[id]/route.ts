// DELETE /api/agents/[id] — Agent unregistration (P3 T2)
import { NextResponse } from "next/server";
import { unregisterAgent } from "@/lib/server/agent-registry";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await unregisterAgent(id);
  return NextResponse.json({ ok: true, agent_id: id, status: "unregistered" });
}
