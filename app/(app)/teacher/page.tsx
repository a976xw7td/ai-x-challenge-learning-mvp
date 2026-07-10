"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronRight,
  Filter,
  Download,
  MessageSquare,
  Star,
} from "lucide-react";
import { submissions, students, challenges } from "@/lib/data";

export default function TeacherPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const totalStudents = students.length;
  const totalSubmissions = submissions.length;
  const reviewedCount = submissions.filter((s) => s.status === "已评分").length;
  const pendingCount = submissions.filter((s) => s.status === "待评审").length;

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.studentName.includes(search) ||
      s.challengeTitle.includes(search) ||
      s.githubRepo.includes(search);
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">教师控制台</h1>
        <p className="mt-1 text-sm text-gray-500">查看全班提交进度，管理评审流程</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">学生总数</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2"><Users className="h-5 w-5 text-blue-600" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总提交数</p>
              <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-2"><CheckCircle2 className="h-5 w-5 text-primary-600" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待评审</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已评分</p>
              <p className="text-2xl font-bold text-green-600">{reviewedCount}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2"><Star className="h-5 w-5 text-green-600" /></div>
          </div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="搜索学生、挑战、仓库..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <div className="flex gap-2">
          {[null, "已提交", "检查中", "检查失败", "待评审", "已评分"].map((s) => (
            <button key={s || "all"} onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? "border-primary-300 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}>{s || "全部"}</button>
          ))}
        </div>
      </div>

      {/* 提交表格 */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challenge</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">仓库</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI 评分</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {sub.studentName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{sub.studentName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{sub.challengeTitle}</td>
                  <td className="px-5 py-4">
                    <a href={`https://github.com/${sub.githubRepo}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">
                      {sub.githubRepo}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{sub.submittedAt}</td>
                  <td className="px-5 py-4">
                    {sub.aiReview.score > 0 ? (
                      <span className={`font-medium ${sub.aiReview.score >= 80 ? "text-green-600" : sub.aiReview.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {sub.aiReview.score}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "已评分" ? "bg-green-50 text-green-700" :
                      sub.status === "待评审" ? "bg-purple-50 text-purple-700" :
                      sub.status === "检查失败" ? "bg-red-50 text-red-700" :
                      sub.status === "检查中" ? "bg-amber-50 text-amber-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>{sub.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/submissions/${sub.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                      详情 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">暂无匹配的提交记录</div>
        )}
      </div>

      {/* 班级概览 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">班级提交概览</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const studentSubs = submissions.filter((s) => s.studentId === student.id);
            const doneCount = studentSubs.filter((s) => s.status === "已评分").length;
            const progress = student.totalChallenges > 0 ? Math.round((student.completedChallenges / student.totalChallenges) * 100) : 0;
            return (
              <div key={student.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {student.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{doneCount} 已评分 · {studentSubs.length} 提交</p>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400">{progress}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
