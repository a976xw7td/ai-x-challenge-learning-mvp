"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Github,
  User,
  Calendar,
  MessageSquare,
  Star,
  Award,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { getSubmissionById as getMockSubmissionById } from "@/lib/data";
import { fetchSubmissionById, type SubmissionListItem } from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "已提交": { label: "已提交", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  "检查中": { label: "检查中", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Loader2 },
  "检查失败": { label: "检查失败", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  "待评审": { label: "待评审", color: "bg-purple-50 text-purple-700 border-purple-200", icon: AlertTriangle },
  "已评分": { label: "已评分", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [realSub, setRealSub] = useState<SubmissionListItem | null | undefined>(undefined);
  useEffect(() => {
    fetchSubmissionById(id).then((r) => {
      setRealSub(r.ok && r.submission ? r.submission : null);
    });
  }, [id]);

  // Fallback: real API → mock data
  const submission = (() => {
    if (realSub) {
      return {
        id: realSub.submission_id,
        studentName: realSub.student_name,
        studentId: realSub.student_id,
        challengeTitle: realSub.project_title,
        githubRepo: realSub.github_repo_url?.replace(/^https?:\/\/github\.com\//, "") || "",
        challengeId: realSub.challenge_id,
        githubBranch: "",
        submittedAt: realSub.submitted_at || "",
        reviewedAt: "",
        aiReview: { score: realSub.score_total || 0, feedback: "", summary: "", strengths: [] as string[], improvements: [] as string[] },
        status: (() => {
          const st = realSub.status || "";
          if (st === "accepted" || st === "reviewed") return "已评分";
          if (st === "pending_review" || st === "under_review" || st === "pending_teacher_review") return "待评审";
          if (st === "needs_revision" || st === "needs_teacher_revision") return "检查失败";
          if (st === "checking" || st === "validating") return "检查中";
          return "已提交";
        })(),
        checkResults: { readme: true, commits: true, demo: true, reflection: true },
        teacherFeedback: "",
        teacherScore: 0,
      };
    }
    if (realSub === null) {
      // API returned no result, fall through to mock
    }
    return getMockSubmissionById(id);
  })() as ReturnType<typeof getMockSubmissionById>;

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <XCircle className="mb-2 h-8 w-8" />
        <p className="text-sm">提交记录未找到</p>
        <Link href="/portfolio" className="mt-4 text-sm text-primary-600 hover:underline">返回作品集</Link>
      </div>
    );
  }

  const status = statusConfig[submission.status] || statusConfig["已提交"];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/portfolio" className="hover:text-gray-700">作品集</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{submission.challengeTitle}</span>
      </nav>

      {/* 提交概览 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{submission.challengeTitle}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${submission.status === "检查中" ? "animate-spin" : ""}`} />
                {status.label}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {submission.studentName}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {submission.submittedAt}</span>
              <span className="flex items-center gap-1"><Github className="h-3.5 w-3.5" /> {submission.githubRepo}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 检查结果 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">GitHub 检查结果</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "README", key: submission.checkResults.readme },
                { label: "提交历史", key: submission.checkResults.commits },
                { label: "Demo 链接", key: submission.checkResults.demo },
                { label: "复盘文档", key: submission.checkResults.reflection },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 rounded-lg border p-3 ${item.key ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  {item.key ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium" style={{ color: item.key ? "rgb(21,128,61)" : "rgb(185,28,28)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI 初评 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-primary-600" /> AI 初评
            </h2>
            {submission.aiReview.score > 0 ? (
              <>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                    <span className="text-2xl font-bold text-primary-600">{submission.aiReview.score}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">AI 评分</p>
                    <p className="text-xs text-gray-500">基于 Rubric 自动生成</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-700">{submission.aiReview.summary}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <h3 className="flex items-center gap-1 text-sm font-medium text-green-800">
                      <Lightbulb className="h-4 w-4" /> 亮点
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {submission.aiReview.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-1.5 text-xs text-green-700">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-green-500" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h3 className="flex items-center gap-1 text-sm font-medium text-amber-800">
                      <AlertTriangle className="h-4 w-4" /> 改进建议
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {submission.aiReview.improvements.map((s) => (
                        <li key={s} className="flex items-start gap-1.5 text-xs text-amber-700">
                          <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> AI 初评生成中...
              </div>
            )}
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          {/* 老师反馈 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MessageSquare className="h-4 w-4 text-primary-600" /> 教师反馈
            </h3>
            {submission.teacherFeedback ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-lg font-bold text-gray-900">{submission.teacherScore}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{submission.teacherFeedback}</p>
                {submission.reviewedAt && (
                  <p className="mt-2 text-xs text-gray-400">评审时间: {submission.reviewedAt}</p>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" /> 待教师评审
              </div>
            )}
          </div>

          {/* 提交信息 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">提交信息</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">分支</dt>
                <dd className="text-gray-900">{submission.githubBranch}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">提交时间</dt>
                <dd className="text-gray-900">{submission.submittedAt}</dd>
              </div>
              {submission.reviewedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">评审时间</dt>
                  <dd className="text-gray-900">{submission.reviewedAt}</dd>
                </div>
              )}
            </dl>
            <a href={`https://github.com/${submission.githubRepo}`} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm">
              <Github className="h-4 w-4" /> 查看仓库
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
