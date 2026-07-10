import Link from "next/link";

const docs = [
  {
    category: "MVP 路线图",
    items: [
      { title: "MVP Roadmap", desc: "从 Phase 0 到 Phase 4 的完整路线图", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/mvp-roadmap.md" },
      { title: "技术白皮书", desc: "NSEAP 架构技术白皮书 2026-07-08", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/technical-whitepaper-20260708.md" },
      { title: "愿景文档", desc: "项目愿景与目标", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/vision.md" },
    ],
  },
  {
    category: "部署与运维",
    items: [
      { title: "Vercel 部署指南", desc: "将 Next.js MVP 部署到 Vercel 的完整步骤", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/vercel-deploy-guide.md" },
      { title: "飞书表结构文档", desc: "7 张核心表的完整 schema 定义", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/feishu-table-schema.md" },
      { title: "下一步实现计划", desc: "Agent 重构与功能补全计划", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/next-implementation-plan.md" },
      { title: "Agent 重构方案", desc: "把 /api/submit 拆成 Agent 消息链", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/agent-refactor-plan.md" },
    ],
  },
  {
    category: "Agent 规范",
    items: [
      { title: "Agent 协作流程", desc: "7 个 Agent 的协作流程图", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/agent-collaboration-flow.md" },
      { title: "Message Envelope Schema", desc: "Agent 消息封装格式", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/messages/message-envelope-schema.md" },
      { title: "Audit Log Schema", desc: "审计日志格式", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/audit/audit-log-schema.md" },
      { title: "Coding Coach Agent", desc: "编码教练 Agent 规范", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/coding-coach-agent.md" },
      { title: "Evaluation Agent", desc: "自动评审 Agent 规范", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/evaluation-agent.md" },
      { title: "Project Manager Agent", desc: "项目管理 Agent 规范", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/agents/project-manager-agent.md" },
    ],
  },
  {
    category: "Challenge 库",
    items: [
      { title: "Challenge 总览", desc: "C01-C10 完整挑战库", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/challenges/Challenge-Library/README.md" },
      { title: "评分标准", desc: "Rubric 评估标准", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/challenges/Challenge-Library/rubrics/assessment-rubric.md" },
      { title: "提交模板", desc: "学生提交 YAML 模板", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/challenges/submission-template.yaml" },
    ],
  },
  {
    category: "课程门户",
    items: [
      { title: "课程首页", desc: "Elite20 课程展示门户", url: "/course-platform/index.html" },
      { title: "部署指南", desc: "GitHub Pages 部署指南", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/teams/platform-team/course-platform/docs/deployment-guide.md" },
      { title: "Agent 接口规范", desc: "对齐 IEEE P3394", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/teams/platform-team/course-platform/docs/agent-interface.md" },
      { title: "贡献指南", desc: "Builder Workflow 贡献指南", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/teams/platform-team/course-platform/CONTRIBUTING.md" },
    ],
  },
  {
    category: "治理与流程",
    items: [
      { title: "贡献指南", desc: "全局贡献规范", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/governance/contribution-guide.md" },
      { title: "Review 流程", desc: "代码评审流程", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/governance/review-process.md" },
      { title: "工作流", desc: "团队协作工作流", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/docs/workflow.md" },
    ],
  },
];

export default function DocsPage() {
  return (
    <main>
      <header className="platformTop">
        <div className="platformBrand">AI+X 学习空间</div>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/challenges">任务</Link>
          <Link href="/submit">提交</Link>
          <Link href="/portfolio">作品集</Link>
          <Link href="/dashboard">仪表盘</Link>
          <Link href="/docs">文档</Link>
          <Link href="/knowledge-base">知识库</Link>
        </nav>
        <div className="userPill">文档中心</div>
      </header>

      <div className="shell">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Documentation Portal</p>
            <h1>文档中心</h1>
            <p>NSEAP 标准体系、部署指南、Agent 规范、Challenge 库、治理流程 — 全部文档一览</p>
          </div>
        </div>

        {docs.map((group) => (
          <section key={group.category} style={{ marginBottom: "28px" }}>
            <div className="moduleTitle">
              <h2>{group.category}</h2>
              <span>{group.items.length} 篇</span>
            </div>
            <div className="cards" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {group.items.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target={item.url.startsWith("http") ? "_blank" : undefined}
                  rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="row"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px", padding: "16px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)" }}
                >
                  <strong>{item.title}</strong>
                  <p className="muted" style={{ fontSize: "13px" }}>{item.desc}</p>
                  <span className="tag" style={{ marginTop: "4px" }}>阅读 →</span>
                </a>
              ))}
            </div>
          </section>
        ))}

        <div className="notice" style={{ marginTop: "24px" }}>
          <strong>关于文档中心：</strong>
          <span>所有文档链接指向 GitHub 上的 Markdown 源文件。如需本地离线浏览，可 clone 仓库后用 Markdown 编辑器查看。</span>
        </div>
      </div>
    </main>
  );
}
