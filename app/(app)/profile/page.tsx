"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Github,
  Mail,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  fetchCurrentUser,
  fetchSubmissions,
  fetchPortfolio,
  type SubmissionListItem,
} from "@/lib/api";
import type { PortfolioItem } from "@/lib/data";

export default function ProfilePage() {
  const [user, setUser] = useState<{ person: string; role: string; name?: string } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCurrentUser(),
      fetchSubmissions(),
      fetchPortfolio(),
    ]).then(([userRes, subsRes, portRes]) => {
      if (userRes.ok && userRes.person) {
        setUser({ person: userRes.person, role: userRes.role || "student", name: userRes.name });
      }
      if (subsRes.ok && subsRes.submissions) {
        const mine = userRes.person
          ? subsRes.submissions.filter((s) => s.student_id === userRes.person)
          : subsRes.submissions;
        setSubmissions(mine);
      }
      if (portRes.live) setPortfolio(portRes.items);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-sm text-gray-500">加载中...</p>
      </div>
    );
  }

  const completedCount = submissions.filter(
    (s) => s.status === "accepted" || s.task_state === "COMPLETED"
  ).length;
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((a, s) => a + (s.score_total || 0), 0) / submissions.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* 个人信息卡片 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {(user?.name || "?").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {user?.name || "未登录"}
              </h1>
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {user?.role === "teacher" ? "教师" : "学生"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {user?.person || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-gray-500">提交数</p>
          <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">平均分</p>
          <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
        </div>
      </div>

      {/* 提交记录 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">提交记录</h2>
        {submissions.length === 0 ? (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            暂无提交，<Link href="/submit" className="text-primary-600 hover:underline">去提交</Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {submissions.slice(0, 10).map((s) => (
              <Link
                key={s.submission_id}
                href={`/submissions/${s.submission_id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.project_title}</p>
                  <p className="text-xs text-gray-500">{s.submitted_at || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.score_total != null && (
                    <span className="text-sm font-medium text-gray-700">{s.score_total}分</span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "accepted" || s.task_state === "COMPLETED"
                      ? "bg-green-50 text-green-700"
                      : s.status === "needs_revision"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {s.task_state || s.status || "处理中"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 作品集 */}
      {portfolio.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">作品集</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {portfolio.slice(0, 4).map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="font-medium text-gray-900">{p.challengeTitle}</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{p.summary}</p>
                {p.githubRepo && (
                  <a href={`https://github.com/${p.githubRepo}`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> 仓库
                  </a>
                )}
              </div>
            ))}
          </div>
          <Link href="/portfolio" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
            查看全部 →
          </Link>
        </div>
      )}
    </div>
  );
}
