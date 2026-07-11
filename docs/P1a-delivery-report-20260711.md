# P1a 交付报告（T7–T12）

## 1. 概况

| 维度 | 值 |
|------|-----|
| 提交数 | 6 commits |
| 文件数 | 24 files |
| 代码量 | +1,375 行 / -18 行 |
| Build | ✅ `next build` 编译成功 |
| curl 验证 | ✅ 所有新增 API 端点返回正确 |

## 2. Commit 清单

| # | Commit | 内容 |
|---|--------|------|
| T7 | `c8ea1c8` | audit-outbox.ts — Outbox 模式，批量写飞书 AuditLogs，3次退避重试，fire-and-forget |
| T8 | `0ddb630` | notify.ts — 飞书 Bot 通知，notifyStudent + notifyGroup，4事件接入 |
| T9 | `02fd48f` | principal.ts + login/me 路由 + login 页面 — HMAC-SHA256 session，role 服务端判定 |
| T10 | `45d891d` | getSubmissions + /api/submissions + 教师/详情页接真实数据 |
| T11 | `e750a13` | review-workflow.ts + /api/evaluations — manual_review_adjustment，状态双列，评审弹窗 |
| T12 | `77e733b` | github SHA + teacher manifest + buildEnvelope signature |

## 3. curl 实测

```bash
# T9 — 登录拒绝未知学生
curl -s http://localhost:3333/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"studentId":"nonexistent","name":"NoOne"}'
# → {"ok":false,"error":"学生ID不存在或未导入系统"}

# T9 — 匿名访问 /api/auth/me
curl -s http://localhost:3333/api/auth/me
# → {"ok":false,"error":"未登录"}

# T10 — 匿名访问 Submissions
curl -s http://localhost:3333/api/submissions
# → {"ok":false,"error":"请先登录"}

# T10 — Challenges 返回真实数据
curl -s http://localhost:3333/api/challenges
# → {"ok":true,"challenges":["cha_demo_001","AI+X 学习任务..."]}

# T11 — 匿名 POST Evaluations 被拒绝
curl -s http://localhost:3333/api/evaluations -X POST \
  -H 'Content-Type: application/json' -d '{}'
# → {"ok":false,"error":"仅教师可提交评审"}
```

## 4. 审查重点自检

| 审查项 | 状态 | 说明 |
|--------|------|------|
| T9 role 不可客户端注入 | ✅ | `determineRole()` 服务端判断，客户端不传 role；cookie 中 role 经 HMAC 签名 |
| T7 不阻塞业务 | ✅ | `flush()` → `batchWriteWithRetry()` 不 await；失败仅 console.error |
| T11 未改 zod-from-schemas.ts | ✅ | `manual_review_adjustment` 走 buildEnvelope 的 relaxed 分支，不改 Team3 枚举 |
| 通知失败只审计 | ✅ | `.then()` 中 `audit.log("notify_failed")`，不抛异常 |
| 每项独立 commit | ✅ | 6 个 commit，前缀 feat + T 编号 |
| Principal 只信服务端 | ✅ | `getPrincipal()` 从 HttpOnly cookie 解析 HMAC，失败返回 null |

## 5. 新增文件清单

```
lib/server/audit-outbox.ts          # T7 Outbox 审计持久化
lib/server/notify.ts                # T8 飞书 Bot 通知
lib/server/principal.ts             # T9 Principal 解析+Token 签发
lib/server/review-workflow.ts       # T11 教师终评工作流
app/api/auth/login/route.ts         # T9 登录 API
app/api/auth/me/route.ts            # T9 当前用户 API
app/api/submissions/route.ts        # T10 提交列表 API
app/api/submissions/[id]/route.ts   # T10 提交详情 API
app/api/evaluations/route.ts        # T11 教师评审 API
app/(public)/login/page.tsx         # T9 登录页面
agents/manifests/teacher-companion-webapp-fallback.json  # T12b 教师 Manifest
```

## 6. 未 Push — 留在本地等审查

所有 commits 仅在本地 main 分支，待审查通过后统一 push。
