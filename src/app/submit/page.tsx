"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Student = { student_id: string; name: string };
type Challenge = { challenge_id: string; title: string };
type SubmitResult = {
  ok: boolean;
  [key: string]: unknown;
};

export default function SubmitPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then((r) => r.json()).catch(() => ({ students: [] })),
      fetch("/api/challenges").then((r) => r.json()).catch(() => ({ challenges: [] })),
    ]).then(([studentsResult, challengesResult]) => {
      setStudents(studentsResult.students || []);
      setChallenges(challengesResult.challenges || []);
    });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      studentId: String(form.get("studentId") || ""),
      challengeId: String(form.get("challengeId") || ""),
      projectTitle: String(form.get("projectTitle") || ""),
      projectSummary: String(form.get("projectSummary") || ""),
      githubRepoUrl: String(form.get("githubRepoUrl") || ""),
      readmeUrl: String(form.get("readmeUrl") || ""),
      demoUrl: String(form.get("demoUrl") || ""),
      aarText: String(form.get("aarText") || ""),
      selfEvaluationText: String(form.get("selfEvaluationText") || ""),
      isPublic: form.get("isPublic") === "on",
    };

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setResult(await response.json());
    setLoading(false);
  }

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
        <div className="userPill">作业提交</div>
      </header>
      <div className="shell">
      <section className="sectionHead">
        <div>
          <p className="eyebrow">作业提交</p>
          <h1>提交 Challenge 项目</h1>
          <p>提交后会依次执行：GitHub 检查、AI 初评、写入飞书、生成作品集记录。</p>
        </div>
      </section>

      <section className="submitLayout">
        <aside className="panel assignmentCard">
          <p className="eyebrow">提交说明</p>
          <h2>AI+X Mini Product</h2>
          <ul>
            <li>填写真实 GitHub 仓库链接</li>
            <li>补充 Demo 或 README 链接</li>
            <li>完成 AAR 复盘和自评</li>
            <li>系统会写回飞书并生成作品集记录</li>
          </ul>
        </aside>

        <form className="form panel" onSubmit={onSubmit}>
          <div className="formSectionTitle">基本信息</div>
          <label>
            学生
            <select name="studentId" required>
              <option value="">选择学生</option>
              {students.map((student) => (
                <option value={student.student_id} key={student.student_id}>{student.name}</option>
              ))}
            </select>
          </label>
          <label>
            Challenge
            <select name="challengeId" required>
              <option value="">选择 Challenge</option>
              {challenges.map((challenge) => (
                <option value={challenge.challenge_id} key={challenge.challenge_id}>{challenge.title}</option>
              ))}
            </select>
          </label>
          <label>
            项目名称
            <input name="projectTitle" required placeholder="Campus Guide AI" />
          </label>
          <label>
            项目简介
            <textarea name="projectSummary" required placeholder="用 1-3 句话说明项目解决什么问题。" />
          </label>

          <div className="formSectionTitle">作品链接</div>
          <label>
            GitHub Repo URL
            <input name="githubRepoUrl" required placeholder="https://github.com/user/repo" />
          </label>
          <label>
            README URL
            <input name="readmeUrl" placeholder="https://github.com/user/repo#readme" />
          </label>
          <label>
            Demo URL
            <input name="demoUrl" placeholder="https://example.com" />
          </label>

          <div className="formSectionTitle">复盘与自评</div>
          <label>
            AAR 复盘
            <textarea name="aarText" required placeholder="任务是什么、怎么做的、结果如何、学到了什么。" />
          </label>
          <label>
            自评
            <textarea name="selfEvaluationText" required placeholder="按问题理解、AI 使用、产物完整性、技术实现、复盘质量自评。" />
          </label>
          <label className="check">
            <input name="isPublic" type="checkbox" defaultChecked />
            允许进入公开作品集
          </label>
          <button disabled={loading}>{loading ? "提交中..." : "提交并运行完整流程"}</button>
        </form>
      </section>

      {result && (
        <section className={result.ok ? "result okBox" : "result badBox"}>
          <h2>{result.ok ? "提交完成" : "提交失败"}</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}
      </div>
    </main>
  );
}
