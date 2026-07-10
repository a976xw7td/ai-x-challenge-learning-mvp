import Link from "next/link";

async function fetchJson(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    return res.json();
  } catch {
    return { ok: false };
  }
}

export default async function DashboardPage() {
  const [health, studentsRes, challengesRes, portfolioRes] = await Promise.all([
    fetchJson("/api/health"),
    fetchJson("/api/students").catch(() => ({ ok: false, students: [] })),
    fetchJson("/api/challenges").catch(() => ({ ok: false, challenges: [] })),
    fetchJson("/api/portfolio").catch(() => ({ ok: false, items: [] })),
  ]);

  const students = studentsRes.students || [];
  const challenges = challengesRes.challenges || [];
  const portfolio = portfolioRes.items || [];
  const published = challenges.filter((c: any) => c.status === "published");
  const activeStudents = students.filter((s: any) => s.status === "active");

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
        <div className="userPill">管理员视图</div>
      </header>

      <div className="shell">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>数据仪表盘</h1>
            <p>平台运行状态、学生进度、任务完成率一览</p>
          </div>
        </div>

        {!health.ok && (
          <section className="notice">
            <strong>配置未完成：</strong>
            <span>缺少 {health.missing?.join(", ") || "环境变量"}。页面可浏览，真实数据需要配置飞书环境变量。</span>
          </section>
        )}

        <section className="stats">
          <div>
            <span>{students.length}</span>
            <p>总学生数</p>
          </div>
          <div>
            <span>{activeStudents.length}</span>
            <p>活跃学生</p>
          </div>
          <div>
            <span>{challenges.length}</span>
            <p>任务总数</p>
          </div>
          <div>
            <span>{published.length}</span>
            <p>已发布任务</p>
          </div>
          <div>
            <span>{portfolio.length}</span>
            <p>公开作品</p>
          </div>
          <div>
            <span>{health.optional?.OPENAI_API_KEY ? "已接入" : "Fallback"}</span>
            <p>AI 评审</p>
          </div>
          <div>
            <span>{health.optional?.FEISHU_APP_ID ? "已连接" : "未连接"}</span>
            <p>飞书数据库</p>
          </div>
          <div>
            <span>{health.optional?.GITHUB_TOKEN ? "已配置" : "未配置"}</span>
            <p>GitHub 检查</p>
          </div>
        </section>

        <div className="grid two" style={{ marginTop: "16px" }}>
          <div className="panel">
            <div className="moduleTitle">
              <h2>学生分布</h2>
              <span>共 {students.length} 人</span>
            </div>
            {students.length === 0 ? (
              <p className="muted">暂无学生数据（需配置飞书环境变量）</p>
            ) : (
              <div className="list">
                {students.slice(0, 8).map((s: any) => (
                  <div key={s.student_id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <strong>{s.name}</strong>
                      <span className="muted" style={{ marginLeft: "8px" }}>{s.student_id}</span>
                    </div>
                    <span className="tag">{s.cohort || "Elite20"}</span>
                  </div>
                ))}
                {students.length > 8 && <p className="muted" style={{ textAlign: "center", padding: "8px" }}>还有 {students.length - 8} 人…</p>}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="moduleTitle">
              <h2>任务进度</h2>
              <span>{published.length} 个进行中</span>
            </div>
            {challenges.length === 0 ? (
              <p className="muted">暂无任务数据</p>
            ) : (
              <div className="list">
                {challenges.slice(0, 8).map((c: any) => (
                  <div key={c.challenge_id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                    <div>
                      <strong>{c.title}</strong>
                      <span className="muted" style={{ marginLeft: "8px" }}>{c.challenge_id}</span>
                    </div>
                    <span className="tag" style={{ background: c.status === "published" ? "var(--accent-soft)" : "#f0f0f0", color: c.status === "published" ? "var(--accent)" : "var(--muted)" }}>
                      {c.status || "draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="moduleTitle">
            <h2>系统连通状态</h2>
            <span>实时</span>
          </div>
          <div className="meta">
            <div>
              <dt>飞书 Students 表</dt>
              <dd className={studentsRes.ok ? "ok" : "bad"}>{studentsRes.ok ? "已连接" : "未连接"}</dd>
            </div>
            <div>
              <dt>飞书 Challenges 表</dt>
              <dd className={challengesRes.ok ? "ok" : "bad"}>{challengesRes.ok ? "已连接" : "未连接"}</dd>
            </div>
            <div>
              <dt>飞书 Portfolio 表</dt>
              <dd className={portfolioRes.ok ? "ok" : "bad"}>{portfolioRes.ok ? "已连接" : "未连接"}</dd>
            </div>
            <div>
              <dt>DeepSeek AI</dt>
              <dd className={health.optional?.OPENAI_API_KEY ? "ok" : "bad"}>{health.optional?.OPENAI_API_KEY ? "已接入" : "Fallback 模式"}</dd>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="moduleTitle">
            <h2>作品集</h2>
            <span>{portfolio.length} 件</span>
          </div>
          {portfolio.length === 0 ? (
            <p className="muted">暂无作品（学生提交后自动生成）</p>
          ) : (
            <div className="cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {portfolio.slice(0, 6).map((item: any) => (
                <div key={item.portfolio_item_id} className="row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                  <strong>{item.title}</strong>
                  <span className="muted">{item.student_name}</span>
                  {item.ai_feedback_summary && <p style={{ fontSize: "13px", color: "var(--muted)" }}>{item.ai_feedback_summary.slice(0, 80)}…</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
