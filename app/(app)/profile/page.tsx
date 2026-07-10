"use client";

import { useState } from "react";
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
  Edit3,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { students, submissions, getPortfolioByStudent } from "@/lib/data";

export default function ProfilePage() {
  // 用 s01 作为当前登录学生示例
  const student = students[0];
  const studentSubmissions = submissions.filter((s) => s.studentId === student.id);
  const studentPortfolio = getPortfolioByStudent(student.id);
  const [editing, setEditing] = useState(false);
  const [githubHandle, setGithubHandle] = useState(student.github);

  const avgAiScore = studentSubmissions.length > 0
    ? Math.round(studentSubmissions.reduce((a, s) => a + s.aiReview.score, 0) / studentSubmissions.length)
    : 0;

  const reviewedCount = studentSubmissions.filter((s) => s.status === "已评分").length;

  return (
    <div className="space-y-6">
      {/* 个人信息卡片 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
            {student.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {student.studentClass}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Github className="h-4 w-4" />
                {editing ? (
                  <input type="text" value={githubHandle} onChange={(e) => setGithubHandle(e.target.value)}
                    className="w-40 rounded border border-gray-200 px-2 py-0.5 text-sm focus:border-primary-500 focus:outline-none" />
                ) : (
                  <span>{githubHandle}</span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {student.email}
              </span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Edit3 className="h-3 w-3" /> {editing ? "保存" : "编辑"}
          </button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已挑战</p>
              <p className="text-2xl font-bold text-gray-900">{student.completedChallenges}/{student.totalChallenges}</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-2"><BookOpen className="h-5 w-5 text-primary-600" /></div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.round((student.completedChallenges / student.totalChallenges) * 100)}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已提交</p>
              <p className="text-2xl font-bold text-gray-900">{studentSubmissions.length}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2"><Clock className="h-5 w-5 text-blue-600" /></div>
          </div>
          <p className="mt-2 text-xs text-gray-400">{reviewedCount} 个已评分</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均 AI 评分</p>
              <p className="text-2xl font-bold text-gray-900">{avgAiScore}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">作品集</p>
              <p className="text-2xl font-bold text-gray-900">{studentPortfolio.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2"><Award className="h-5 w-5 text-green-600" /></div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {studentPortfolio.filter((p) => p.isPublic).length} 个公开
          </p>
        </div>
      </div>

      {/* 技能标签 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">技能标签</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {student.skills.map((skill) => (
            <span key={skill} className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              {skill}
            </span>
          ))}
          <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-600">
            + 添加
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 提交历史 */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">提交历史</h2>
            <Link href="/portfolio" className="text-xs font-medium text-primary-600 hover:text-primary-700">查看全部</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {studentSubmissions.slice(0, 5).map((sub) => (
              <Link key={sub.id} href={`/submissions/${sub.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  sub.status === "已评分" ? "bg-green-100 text-green-700" :
                  sub.status === "待评审" ? "bg-purple-100 text-purple-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {sub.status === "已评分" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{sub.challengeTitle}</p>
                  <p className="text-xs text-gray-500">{sub.submittedAt} · {sub.githubRepo}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    sub.status === "已评分" ? "bg-green-50 text-green-700" :
                    sub.status === "待评审" ? "bg-purple-50 text-purple-700" :
                    sub.status === "检查失败" ? "bg-red-50 text-red-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>{sub.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 作品集 */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">我的作品</h2>
            <Link href="/portfolio" className="text-xs font-medium text-primary-600 hover:text-primary-700">查看全部</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {studentPortfolio.map((item) => (
              <div key={item.id} className="px-5 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.challengeTitle}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.summary.slice(0, 60)}...</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.isPublic ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>{item.isPublic ? "公开" : "内部"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
