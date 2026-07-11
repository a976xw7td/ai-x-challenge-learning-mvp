// POST /api/auth/login — Student identity verification + session token issuance (§3.5)
// Client sends {studentId, name}; server validates against Feishu Students table,
// determines role server-side, and signs an HttpOnly session cookie.
import { NextResponse } from "next/server";
import { getStudentById } from "@/lib/server/feishu";
import { signToken, determineRole, SESSION_COOKIE } from "@/lib/server/principal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentId = String(body.studentId ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!studentId || !name) {
      return NextResponse.json(
        { ok: false, error: "请填写学生ID和姓名" },
        { status: 400 },
      );
    }

    // Validate against Students table
    let student;
    try {
      student = await getStudentById(studentId);
    } catch {
      return NextResponse.json(
        { ok: false, error: "学生ID不存在或未导入系统" },
        { status: 401 },
      );
    }

    // Name check: case-insensitive, trimmed
    if (student.name.trim().toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "姓名不匹配" },
        { status: 401 },
      );
    }

    // Determine role SERVER-SIDE ONLY (client never sends role)
    const studentsRole = (student as unknown as Record<string, unknown>)["role"] as string | undefined;
    const role = determineRole(studentId, studentsRole);

    // Sign session token
    const token = signToken({
      person: studentId,
      org: "elite20",
      role,
    });

    const response = NextResponse.json({
      ok: true,
      person: studentId,
      role,
      name: student.name,
    });

    // Set HttpOnly session cookie
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "登录失败" },
      { status: 500 },
    );
  }
}
