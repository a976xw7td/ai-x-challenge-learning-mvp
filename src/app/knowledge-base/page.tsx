import Link from "next/link";

const kbData = [
  {
    category: "最佳实践",
    icon: "BEST",
    items: [
      { title: "DeepSeek API 配置指南", desc: "DeepSeek API 的接入方法、模型选择和调用示例", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/best-practices/deepseek-api.md" },
      { title: "飞书配置指南", desc: "飞书应用创建、多维表建表、权限配置完整流程", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/best-practices/feishu-setup.md" },
      { title: "GitHub 提交规范", desc: "学生通过 GitHub 提交 Challenge 的标准流程", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/best-practices/github-submission.md" },
    ],
  },
  {
    category: "案例研究",
    icon: "CASE",
    items: [
      { title: "指引 AI 导航案例", desc: "真实项目如何从 Challenge 到 Cognitive Cell 的完整案例", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/case-studies/zhiyin-ai-navigator.md" },
      { title: "Challenge → Cognitive Cell 案例", desc: "从挑战到认知细胞的完整转化案例，含提交、评审、知识捕获", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/tree/main/examples/challenge-to-cognitive-cell-case" },
    ],
  },
  {
    category: "Prompt 库",
    icon: "PROMPT",
    items: [
      { title: "AAR 模板", desc: "After Action Review（行动后回顾）模板", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/prompt-library/aar-template.md" },
      { title: "提交自检清单", desc: "学生提交前的自动检查 Prompt", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/prompt-library/submission-self-check.md" },
    ],
  },
  {
    category: "Agent Prompts",
    icon: "AGENT",
    items: [
      { title: "Coding Coach Agent Prompt", desc: "编码教练 Agent 的完整系统提示词", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/prompts/coding-coach-agent-prompt.md" },
      { title: "Evaluation Agent Prompt", desc: "自动评审 Agent 的完整系统提示词", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/prompts/evaluation-agent-prompt.md" },
      { title: "Project Manager Agent Prompt", desc: "项目管理 Agent 的完整系统提示词", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/prompts/project-manager-agent-prompt.md" },
    ],
  },
  {
    category: "本体定义",
    icon: "ONTO",
    items: [
      { title: "Agent Ontology", desc: "Agent 实体的本体定义", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/ontology/agent-ontology.md" },
      { title: "Assessment Ontology", desc: "评估体系本体", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/ontology/assessment-ontology.md" },
      { title: "Challenge Ontology", desc: "挑战任务本体", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/ontology/challenge-ontology.md" },
      { title: "Course Ontology", desc: "课程本体", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/ontology/course-ontology.md" },
      { title: "Skill Ontology", desc: "技能本体", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/ontology/skill-ontology.md" },
    ],
  },
  {
    category: "方法论",
    icon: "METH",
    items: [
      { title: "FDE Builder Workflow", desc: "Field Deployment Engineer 的工作流程", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/methodology/fde-builder-workflow.md" },
      { title: "KSTAR 学习循环", desc: "Knowledge → Situation → Task → Action → Reflection", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/methodology/kstar-learning-loop.md" },
      { title: "Situation to Agent", desc: "从情境到 Agent 的转化方法", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/methodology/situation-to-agent.md" },
      { title: "Skill 构建框架", desc: "技能构建的方法论", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/methodology/skill-construction-framework.md" },
    ],
  },
  {
    category: "Schema 与模板",
    icon: "SCHEMA",
    items: [
      { title: "知识条目 JSON Schema", desc: "知识库条目的标准格式", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/schemas/knowledge-item.schema.json" },
      { title: "Prompt JSON Schema", desc: "Prompt 的标准格式", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/schemas/prompt.schema.json" },
      { title: "知识条目模板", desc: "创建新知识条目的模板", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/templates/knowledge-item-template.md" },
      { title: "Knowledge Cognitive Cell 设计", desc: "知识认知细胞的设计文档", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/knowledge-cognitive-cell/design.md" },
    ],
  },
  {
    category: "FAQ",
    icon: "FAQ",
    items: [
      { title: "常见问题", desc: "学生和老师的常见问题解答", url: "https://github.com/a976xw7td/elite20-builder-program-nseap/blob/main/knowledge-base/faq.md" },
    ],
  },
];

export default function KnowledgeBasePage() {
  const totalItems = kbData.reduce((sum, g) => sum + g.items.length, 0);

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
        <div className="userPill">知识库</div>
      </header>

      <div className="shell">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Knowledge Base</p>
            <h1>知识库</h1>
            <p>最佳实践、案例研究、Prompt 库、Agent 规范、本体定义、方法论 — {totalItems} 条知识资产</p>
          </div>
        </div>

        <section className="stats">
          <div>
            <span>{kbData.length}</span>
            <p>分类</p>
          </div>
          <div>
            <span>{totalItems}</span>
            <p>知识条目</p>
          </div>
          <div>
            <span>{kbData.find(g => g.category === "Agent Prompts")?.items.length || 0}</span>
            <p>Agent Prompt</p>
          </div>
          <div>
            <span>{kbData.find(g => g.category === "本体定义")?.items.length || 0}</span>
            <p>本体定义</p>
          </div>
        </section>

        {kbData.map((group) => (
          <section key={group.category} style={{ marginBottom: "28px" }}>
            <div className="moduleTitle">
              <h2>{group.category}</h2>
              <span>{group.items.length} 条</span>
            </div>
            <div className="cards" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {group.items.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="row"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px", padding: "16px", border: "1px solid var(--line)", borderRadius: "8px", background: "var(--panel)" }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: "10px" }}>{group.icon}</span>
                    <strong>{item.title}</strong>
                  </div>
                  <p className="muted" style={{ fontSize: "13px" }}>{item.desc}</p>
                  <span className="tag" style={{ marginTop: "4px" }}>查看 →</span>
                </a>
              ))}
            </div>
          </section>
        ))}

        <div className="notice" style={{ marginTop: "24px" }}>
          <strong>关于知识库：</strong>
          <span>知识库内容来自 Elite20 Builder Program 主仓库的 knowledge-base/ 目录。每条知识都是 Agent 可引用的结构化资产，遵循 Knowledge Cognitive Cell 设计。</span>
        </div>
      </div>
    </main>
  );
}
