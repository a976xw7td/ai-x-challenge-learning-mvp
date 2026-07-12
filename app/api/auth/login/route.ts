// POST /api/auth/login — Student identity verification + session token issuance (§3.5)
// Client sends {studentId, name}; server validates against Feishu Students table,
// determines role server-side, and signs an HttpOnly session cookie.
import { NextResponse } from "next/server";
import { getStudentById, updateStudent } from "@/lib/server/feishu";
import { signToken, determineRole, SESSION_COOKIE } from "@/lib/server/principal";
import { generateApiKey } from "@/lib/server/agent-auth";

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // BUGFIX: distinguish "not found" from Feishu/network errors
      if (msg.includes("not found") || msg.includes("Student not found")) {
        return NextResponse.json(
          { ok: false, error: "学生ID不存在或未导入系统" },
          { status: 401 },
        );
      }
      console.error("[login] Feishu lookup error:", msg);
      return NextResponse.json(
        { ok: false, error: "系统暂时无法验证身份，请稍后重试" },
        { status: 503 },
      );
    }

    // Name check
    if (student.name.trim().toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "姓名不匹配" },
        { status: 401 },
      );
    }

    // P2: Auto-generate API key on first login (one per student, stored in Feishu)
    let apiKey = student.api_key;
    if (!apiKey && student.recordId) {
      apiKey = generateApiKey();
      await updateStudent(student.recordId, { api_key: apiKey }).catch((err) => {
        console.warn("[login] Failed to save API key:", err instanceof Error ? err.message : String(err));
      });
    }

    // Determine role SERVER-SIDE ONLY
    const role = determineRole(studentId, (student as unknown as Record<string, unknown>)["role"] as string | undefined);

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
      class_id: student.class_id || "",
      api_key: apiKey || undefined,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "登录失败" },
      { status: 500 },
    );
  }
}
