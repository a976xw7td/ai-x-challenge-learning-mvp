// notify.ts — Feishu Bot notification bridge (§6.4 notification boundary)
// Sends IM messages to students (private chat) and class groups.
// All notification failures are audited as notify_failed, never block business.
import { requireEnv, optionalEnv } from "./env";
import * as feishu from "./feishu";

// ---- Feishu IM API ----

let cachedTenantToken: { token: string; expiresAt: number } | null = null;

async function getTenantToken(): Promise<string> {
  if (cachedTenantToken && cachedTenantToken.expiresAt > Date.now() + 60_000) {
    return cachedTenantToken.token;
  }

  const resp = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: requireEnv("FEISHU_APP_ID"),
        app_secret: requireEnv("FEISHU_APP_SECRET"),
      }),
    },
  );

  const payload = await resp.json();
  if (!resp.ok || payload.code !== 0) {
    throw new Error(`Feishu token failed: ${payload.msg || resp.statusText}`);
  }

  cachedTenantToken = {
    token: payload.tenant_access_token,
    expiresAt: Date.now() + Math.max(1, payload.expire - 120) * 1000,
  };
  return cachedTenantToken.token;
}

async function sendImMessage(
  receiveIdType: "open_id" | "chat_id",
  receiveId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await getTenantToken();
    const body = JSON.stringify({
      receive_id: receiveId,
      msg_type: "text",
      content: JSON.stringify({ text }),
    });

    const resp = await fetch(
      `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body,
      },
    );

    const payload = await resp.json();
    if (!resp.ok || payload.code !== 0) {
      return { ok: false, error: payload.msg || resp.statusText };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---- Public API ----

/**
 * Send a private IM to a student via Feishu Bot.
 * Reads student's feishu_open_id from Students table.
 * Silently skips if feishu_open_id column is missing (console.warn).
 */
export async function notifyStudent(
  studentId: string,
  text: string,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const student = await feishu.getStudentById(studentId);
    if (!student.feishu_open_id) {
      console.warn(`[notify] Student ${studentId} has no feishu_open_id — notification skipped`);
      return { ok: false, skipped: true, error: "no feishu_open_id" };
    }
    const result = await sendImMessage("open_id", student.feishu_open_id, text);
    console.log(`[notify] Sent to ${studentId} (open_id=${student.feishu_open_id.slice(0,8)}...): ok=${result.ok}`, result.error ? `error=${result.error}` : "");
    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send a message to the class group chat.
 * Uses env FEISHU_CLASS_CHAT_ID. Silently skips if not configured.
 */
export async function notifyGroup(
  text: string,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const chatId = optionalEnv("FEISHU_CLASS_CHAT_ID");
  if (!chatId) {
    console.warn("[notify] FEISHU_CLASS_CHAT_ID not configured — group notification skipped");
    return { ok: false, skipped: true, error: "no chat_id" };
  }
  return await sendImMessage("chat_id", chatId, text);
}
