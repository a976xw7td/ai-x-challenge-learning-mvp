import Link from "next/link";

async function fetchJson(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  return response.json();
}

export default async function Dashboard() {
  const [health, studentsResult, challengesResult, portfolioResult] = await Promise.all([
    fetchJson("/api/health"),
    fetchJson("/api/students").catch((error) => ({ ok: false, error: error.message, students: [] })),
    fetchJson("/api/challenges").catch((error) => ({ ok: false, error: error.message, challenges: [] })),
    fetchJson("/api/portfolio").catch((error) => ({ ok: false, error: error.message, items: [] })),
  ]);

  const students = studentsResult.students || [];
  const challenges = challengesResult.challenges || [];
  const portfolio = portfolioResult.items || [];

  return (
    <main>
      <header className="platformTop">
        <div className="platformBrand">AI+X 学习空间</div>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/challenges">任务</Link>
          <Link href="/submit">提交</Link>
          <Link href="/portfolio">作品集</Link>
        </nav>
        <div className="userPill">测试学生A</div>
      </header>

      <div className="shell">
        <section className="courseBanner">
          <div>
            <p className="eyebrow">当前课程</p>
            <h1>AI+X Challenge Bootcamp</h1>
            <p>用真实 GitHub 项目完成 Challenge，系统自动检查、初评，并沉淀到个人作品集。</p>
          </div>
          <div className="courseBadge">
            <strong>进行中</strong>
            <span>1 门课程 · {challenges.length} 个任务</span>
          </div>
        </section>

        <section className="quickActions">
          <Link href="/challenges"><span>任务</span><strong>查看 Challenge</strong></Link>
          <Link href="/submit"><span>作业</span><strong>提交项目</strong></Link>
          <Link href="/portfolio"><span>成果</span><strong>查看作品集</strong></Link>
        </section>

        {!health.ok && (
          <section className="notice">
            <strong>配置未完成：</strong>
            <span>缺少 {health.missing.join(", ")}。页面可以启动，但真实飞书读写需要先配置 env。</span>
          </section>
        )}

        <section className="stats">
          <div><span>{students.length}</span><p>学生</p></div>
          <div><span>{challenges.length}</span><p>已发布任务</p></div>
          <div><span>{portfolio.length}</span><p>公开作品</p></div>
          <div><span>{health.optional?.OPENAI_API_KEY ? "已接入" : "Fallback"}</span><p>AI 初评</p></div>
        </section>

        <section className="grid two">
          <div className="panel">
            <div className="moduleTitle"><h2>学习任务流</h2><span>本周</span></div>
            <ol className="timeline">
              <li><strong>领取任务</strong><p>从飞书读取已发布 Challenge</p></li>
              <li><strong>提交项目</strong><p>填写 GitHub Repo、Demo、AAR 和自评</p></li>
              <li><strong>系统检查</strong><p>检查 README、仓库状态和最近提交</p></li>
              <li><strong>生成成果</strong><p>AI 初评后写入作品集</p></li>
            </ol>
          </div>
          <div className="panel">
            <div className="moduleTitle"><h2>系统连通状态</h2><span>实时</span></div>
            <p className={studentsResult.ok ? "ok" : "bad"}>Students：{studentsResult.ok ? "已连接" : studentsResult.error}</p>
            <p className={challengesResult.ok ? "ok" : "bad"}>Challenges：{challengesResult.ok ? "已连接" : challengesResult.error}</p>
            <p className={portfolioResult.ok ? "ok" : "bad"}>Portfolio：{portfolioResult.ok ? "已连接" : portfolioResult.error}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
