"use client";

import { useState, useEffect } from "react";
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
import { students } from "@/lib/data";
import { fetchSubmissions, type SubmissionListItem } from "@/lib/api";

// Type for mapped submission rows
interface SubmissionRow {
  id: string;
  studentName: string;
  studentId: string;
  challengeTitle: string;
  githubRepo: string;
  submittedAt: string;
  aiReview: { score: number; feedback: string };
  status: string;
}

export default function TeacherPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // T5: Publish Challenge form state
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubBrief, setPubBrief] = useState("");
  const [pubObjective, setPubObjective] = useState("");
  const [pubDeliverables, setPubDeliverables] = useState("");
  const [pubRubric, setPubRubric] = useState("");
  const [pubDeadline, setPubDeadline] = useState("");
  const [pubLoading, setPubLoading] = useState(false);
  const [pubResult, setPubResult] = useState<{ ok: boolean; message: string } | null>(null);

  // T11: Teacher review state
  const [reviewTarget, setReviewTarget] = useState<{ id: string; studentName: string; challengeTitle: string } | null>(null);
  const [reviewScore, setReviewScore] = useState(80);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleReview = async (action: "accept" | "return") => {
    if (!reviewTarget) return;
    setReviewLoading(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: reviewTarget.id,
          action,
          score: reviewScore,
          feedback: reviewFeedback || (action === "accept" ? "通过" : "需要修改"),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setReviewResult({ ok: true, message: `${action === "accept" ? "确认通过" : "打回修改"}成功` });
        setReviewTarget(null);
        setReviewFeedback("");
        // Refresh submissions list
        fetchSubmissions().then((r) => {
          if (r.ok && r.submissions) setRealSubmissions(r.submissions);
        });
      } else {
        setReviewResult({ ok: false, message: data.error || "操作失败" });
      }
    } catch {
      setReviewResult({ ok: false, message: "网络错误" });
    }
    setReviewLoading(false);
  };

  // T14: Real submissions only (no mock fallback)
  const [realSubmissions, setRealSubmissions] = useState<SubmissionListItem[] | null>(null);
  const [subsLoading, setSubsLoading] = useState(true);
  useEffect(() => {
    fetchSubmissions().then((r) => {
      if (r.ok && r.submissions) setRealSubmissions(r.submissions);
      setSubsLoading(false);
    });
  }, []);

  const submissions: SubmissionRow[] = (realSubmissions || []).map((s) => ({
    id: s.submission_id,
    studentName: s.student_name,
    studentId: s.student_id,
    challengeTitle: s.project_title,
    githubRepo: s.github_repo_url?.replace(/^https?:\/\/github\.com\//, "") || "",
    submittedAt: s.submitted_at || "",
    aiReview: { score: s.score_total || 0, feedback: "" },
    status: (() => {
      const st = s.status || "";
      if (st === "accepted" || st === "reviewed") return "已评分";
      if (st === "pending_review" || st === "under_review" || st === "pending_teacher_review") return "待评审";
      if (st === "needs_revision" || st === "needs_teacher_revision") return "检查失败";
      if (st === "checking" || st === "validating") return "检查中";
      return "已提交";
    })(),
  }));

  const handlePublish = async () => {
    setPubLoading(true);
    setPubResult(null);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pubTitle,
          brief: pubBrief,
          objective: pubObjective,
          deliverables: pubDeliverables,
          rubric: pubRubric,
          deadline: pubDeadline,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPubResult({ ok: true, message: `Challenge 发布成功！ID: ${data.challengeId}` });
        setPubTitle(""); setPubBrief(""); setPubObjective("");
        setPubDeliverables(""); setPubRubric(""); setPubDeadline("");
      } else {
        const errMsg = data.missingFields
          ? `缺少：${data.missingFields.join("、")}`
          : data.error || "发布失败";
        setPubResult({ ok: false, message: errMsg });
      }
    } catch {
      setPubResult({ ok: false, message: "网络错误，请重试" });
    }
    setPubLoading(false);
  };

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

      {/* T5: 发布 Challenge 表单 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">发布新 Challenge</h3>
            <p className="mt-1 text-sm text-gray-500">创建一个新的挑战任务，发布后学生即可开始提交</p>
          </div>
          <button
            onClick={() => { setShowPublishForm(!showPublishForm); setPubResult(null); }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {showPublishForm ? "收起" : "发布新 Challenge"}
          </button>
        </div>

        {showPublishForm && (
          <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">标题 *</label>
              <input type="text" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)}
                placeholder="例如：构建一个 AI 客服机器人" className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">简介</label>
              <textarea value={pubBrief} onChange={(e) => setPubBrief(e.target.value)} rows={2}
                placeholder="一两句话介绍这个 Challenge 是做什么的" className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">目标</label>
              <textarea value={pubObjective} onChange={(e) => setPubObjective(e.target.value)} rows={2}
                placeholder="学生完成这个 Challenge 后能学到什么" className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">交付物 *</label>
              <textarea value={pubDeliverables} onChange={(e) => setPubDeliverables(e.target.value)} rows={2}
                placeholder="需要提交什么：如 GitHub 仓库、Demo 链接、复盘文档等" className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">评分标准 *</label>
              <textarea value={pubRubric} onChange={(e) => setPubRubric(e.target.value)} rows={3}
                placeholder="按什么标准评分：如代码质量（30%）、AI 使用（20%）、文档（20%）、演示（15%）、复盘（15%）" className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">截止时间 *</label>
              <input type="datetime-local" value={pubDeadline} onChange={(e) => setPubDeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            {pubResult && (
              <div className={`rounded-lg p-3 text-sm ${pubResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {pubResult.message}
              </div>
            )}
            <button onClick={handlePublish} disabled={pubLoading} className="btn-primary">
              {pubLoading ? "发布中..." : "发布 Challenge"}
            </button>
          </div>
        )}
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
                    <div className="flex items-center justify-end gap-2">
                      {sub.status === "待评审" && (
                        <>
                          <button
                            onClick={() => setReviewTarget({ id: sub.id, studentName: sub.studentName, challengeTitle: sub.challengeTitle })}
                            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setReviewTarget({ id: sub.id, studentName: sub.studentName, challengeTitle: sub.challengeTitle })}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                          >
                            打回
                          </button>
                        </>
                      )}
                      <Link href={`/submissions/${sub.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                        详情 <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subsLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">暂无提交记录</div>
        ) : null}
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

      {/* T11: Review modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-gray-900">
              评审: {reviewTarget.studentName} — {reviewTarget.challengeTitle}
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">分数</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">评语</label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows={3}
                  placeholder="对学生作品的评价..."
                  className="mt-1 w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                />
              </div>
              {reviewResult && (
                <div className={`rounded-lg p-3 text-sm ${reviewResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {reviewResult.message}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview("accept")}
                  disabled={reviewLoading}
                  className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {reviewLoading ? "提交中..." : "确认通过"}
                </button>
                <button
                  onClick={() => handleReview("return")}
                  disabled={reviewLoading}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {reviewLoading ? "提交中..." : "打回修改"}
                </button>
              </div>
              <button
                onClick={() => { setReviewTarget(null); setReviewResult(null); }}
                className="w-full rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
