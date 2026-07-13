// POST /api/auth/api-key — Generate/rotate API key (T08)
// Plaintext key is returned ONLY ONCE in this response.
// Old key (hash_prev) is kept for 30-day grace period.
import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/server/principal";
import { getStudentById, updateStudent } from "@/lib/server/feishu";
import { generateApiKey, hashApiKey } from "@/lib/server/agent-auth";

export async function POST() {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false, error: "请先登录" }, { status: 401 });
  }

  try {
    // Only students can manage their own API keys
    const student = await getStudentById(principal.person);

    // Generate new key
    const newKey = generateApiKey();
    const newHash = hashApiKey(newKey);

    // Prepare update: rotate previous hash, set new hash + timestamp
    const updateFields: Record<string, unknown> = {
      api_key: newKey, // T08: still write plaintext for backward compat (migration will hash)
      api_key_hash: newHash,
      api_key_rotated_at: new Date().toISOString(),
    };

    // Preserve previous hash if exists
    if (student.api_key_hash) {
      updateFields.api_key_hash_prev = student.api_key_hash;
    }

    if (student.recordId) {
      await updateStudent(student.recordId, updateFields);
    }

    // Return plaintext key ONCE
    return NextResponse.json({
      ok: true,
      api_key: newKey,
      message: "API Key 已生成，请立即复制保存。此密钥仅显示一次。",
    });
  } catch (error) {
    // If student not found in Students table (e.g., teacher/admin), reject
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("not found") || msg.includes("Student not found")) {
      return NextResponse.json(
        { ok: false, error: "仅学生账号可管理 API Key" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Key generation failed" },
      { status: 500 },
    );
  }
}
