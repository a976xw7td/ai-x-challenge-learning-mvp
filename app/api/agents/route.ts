// POST /api/agents/register — Agent registration (P3 T2)
// GET  /api/agents          — List registered agents
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";
import { registerAgent, listAgents } from "@/lib/server/agent-registry";

export async function POST(request: Request) {
  try {
    const principal = await getPrincipal();
    if (!principal) {
      return NextResponse.json({ ok: false, error: "请先认证" }, { status: 401 });
    }

    const body = await request.json();
    const { agent_id, capabilities } = body;

    if (!agent_id) {
      return NextResponse.json({ ok: false, error: "缺少 agent_id" }, { status: 400 });
    }

    await registerAgent(
      agent_id,
      { person: principal.person, org: principal.org, role: principal.role as "student" | "teacher" | "agent" | "admin" | "system" },
      capabilities || [],
    );

    return NextResponse.json({ ok: true, agent_id, status: "registered" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ ok: true, agents });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 },
    );
  }
}
