import Link from "next/link";

type PortfolioView = {
  recordId?: string;
  portfolio_item_id?: string;
  student_name?: string;
  title: string;
  public_description?: string;
  summary?: string;
  skills?: string;
  github_url?: string;
  demo_url?: string;
};

async function getPortfolio() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/portfolio`, { cache: "no-store" });
  return response.json();
}

export default async function PortfolioPage() {
  const result = await getPortfolio().catch((error) => ({ ok: false, error: error.message, items: [] }));
  const items: PortfolioView[] = result.items || [];

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
        <div className="userPill">成果展示</div>
      </header>
      <div className="shell">
      <section className="sectionHead">
        <div>
          <p className="eyebrow">学习成果</p>
          <h1>课程作品集</h1>
          <p>这里展示飞书 PortfolioItems 表中允许公开的成果，用于 Showcase 和阶段汇报。</p>
        </div>
      </section>
      {!result.ok && <div className="notice">读取失败：{result.error}</div>}
      <section className="cards">
        {items.map((item) => (
          <article className="panel" key={item.portfolio_item_id || item.recordId}>
            <p className="eyebrow">{item.student_name || "Unknown Student"}</p>
            <h2>{item.title}</h2>
            <p>{item.public_description || item.summary || "暂无作品描述"}</p>
            <p className="muted">{item.skills}</p>
            <div className="actions">
              {item.github_url && <a href={item.github_url} target="_blank">GitHub</a>}
              {item.demo_url && <a href={item.demo_url} target="_blank">Demo</a>}
            </div>
          </article>
        ))}
        {items.length === 0 && <div className="empty">暂无公开作品。</div>}
      </section>
      </div>
    </main>
  );
}
