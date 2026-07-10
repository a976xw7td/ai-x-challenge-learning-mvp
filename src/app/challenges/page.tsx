import Link from "next/link";

type ChallengeView = {
  challenge_id: string;
  title: string;
  brief?: string;
  objective?: string;
  deadline?: string;
  status?: string;
};

async function getChallenges() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/challenges`, { cache: "no-store" });
  return response.json();
}

export default async function ChallengesPage() {
  const result = await getChallenges().catch((error) => ({ ok: false, error: error.message, challenges: [] }));
  const challenges: ChallengeView[] = result.challenges || [];

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
        <div className="userPill">课程任务</div>
      </header>
      <div className="shell">
      <section className="sectionHead">
        <div>
          <p className="eyebrow">课程任务</p>
          <h1>待完成 Challenge</h1>
          <p>这里直接读取飞书 Challenges 表中 status = published 的任务，学生从这里进入提交。</p>
        </div>
      </section>
      {!result.ok && <div className="notice">读取失败：{result.error}</div>}
      <section className="list">
        {challenges.map((challenge) => (
          <article className="panel" key={challenge.challenge_id}>
            <div className="row">
              <h2>{challenge.title}</h2>
              <span className="tag">{challenge.challenge_id}</span>
            </div>
            <p>{challenge.brief || challenge.objective || "暂无任务说明"}</p>
            <dl className="meta">
              <div><dt>截止时间</dt><dd>{challenge.deadline || "未设置"}</dd></div>
              <div><dt>状态</dt><dd>{challenge.status}</dd></div>
            </dl>
            <div className="actions">
              <Link href="/submit">去提交</Link>
            </div>
          </article>
        ))}
        {challenges.length === 0 && <div className="empty">暂无可展示 Challenge。</div>}
      </section>
      </div>
    </main>
  );
}
