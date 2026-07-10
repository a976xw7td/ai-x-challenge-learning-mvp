# NSEAP Learning Platform（三方合并版）

AI+X / Elite20 / NSEAP 教育任务系统 —— 取三个来源之精华合并而成：

| 来源 | 取了什么 |
|---|---|
| 吴嘉宇 PR #5（learning-platform） | 全部前端：Landing / Dashboard / LMS / Challenge 详情 / 提交流程 / 作品集 / 教师控制台 / 个人中心 / 部署配置 |
| ai-x-challenge-learning-mvp | 全部真实后端：`lib/server/`（飞书多维表、GitHub 检查、DeepSeek AI 初评、提交工作流）+ `app/api/` 六个接口 |
| 陈万康/Team3 PR #4（本体工程化） | `lib/schemas/zod-from-schemas.ts`：Message Envelope、Submission Record、Audit Log、Trusted Relationship 等运行时校验 |

## 相对三个来源的增强

- **`lib/server/agents.ts`（新增）**：Agent 身份层。定义 `student-companion-webapp-fallback`、`submission-task-agent-001`、`review-task-agent-001` 三个 Agent 身份，Trusted Relationship 图（AGENT_CN.md 7.6 补充稿要求），以及经 Zod 校验的 Message Envelope 构造器和 AuditTrail。
- **`lib/server/workflow.ts`（重写）**：从"普通函数"升级为 Submission Task Agent 状态机 —— 构造提交请求 Envelope → Inbox 信任校验 → 身份/Challenge/GitHub 指针校验 → 路由 Review Task Agent 生成 AI 初评 → 唯一写入 Submission Record（架构红线）→ 每步写审计日志。API 响应携带完整 `auditTrail`。
- **提交记录带 Agent 字段**：`submitted_by_agent_id` / `processed_by_agent_id` / `admin_identity_mode` / `submission_request_id` / `audit_log_pointer` / `review_mode` 会写入飞书；若表尚未加这些列则自动降级为基础字段（不阻塞提交）。
- **前端接真实数据**：`lib/api.ts` 客户端适配层 —— `/submit` 走真实 GitHub 检查 + 真实提交，`/portfolio` 与 Challenge 列表走真实 API；后端未配置（无飞书 env）时自动回落 mock 数据，页面永不白屏。

## 运行

```bash
npm install
cp .env.example .env.local   # 填入飞书 / GitHub / DeepSeek 凭证；不填则前端走 mock
npm run dev
```

## 对照 AGENT_CN.md 红线的合规状态

| 红线 | 状态 |
|---|---|
| Agent 必须有身份 / 每条消息带 from/to | ✅ `agents.ts` + Envelope 校验 |
| 学生侧不能直接写 Submission Record | ✅ 仅 `submitChallengeProject`（submission-task-agent-001）写入 |
| 无 audit trace 的状态变更被禁止 | ✅ 每步 `AuditTrail.log`，响应返回全链路 |
| Trusted Relationship | ✅ 静态关系图 + Inbox 校验（未来由 NSEAP 平台下发） |
| GitHub / 飞书 / Ontology Memory 同步 | 🔶 GitHub + 飞书已同步；Ontology Memory 待接 |
| Hermes / OpenClaw 路由 | 🔶 MVP 阶段以进程内调用模拟，Envelope 格式保持 P3394 兼容，P2 接入（deviation 已记录于此） |

## 已知 TODO

- 教师控制台 / Dashboard / 提交详情页仍用 mock（后端缺 submissions 列表与详情 GET 接口）。
- 飞书 Submissions 表建议新增 6 个 Agent 扩展列（见上），加列后无需改代码即自动启用。
- 登录 / 名单匹配（P1）未实现。
