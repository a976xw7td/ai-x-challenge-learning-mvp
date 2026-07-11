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
  Github,
  User,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
} from "lucide-react";
import { fetchSubmissionById, type SubmissionListItem } from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "已提交": { label: "已提交", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  "检查中": { label: "检查中", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Loader2 },
  "检查失败": { label: "检查失败", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  "待评审": { label: "待评审", color: "bg-purple-50 text-purple-700 border-purple-200", icon: AlertTriangle },
  "已评分": { label: "已评分", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
};

function mapStatus(s: SubmissionListItem): string {
  const st = s.status || "";
  if (st === "accepted" || st === "reviewed") return "已评分";
  if (st === "pending_review" || st === "under_review" || st === "pending_teacher_review") return "待评审";
  if (st === "needs_revision" || st === "needs_teacher_revision") return "检查失败";
  if (st === "checking" || st === "validating") return "检查中";
  return "已提交";
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [realSub, setRealSub] = useState<SubmissionListItem | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSubmissionById(id).then((r) => {
      setRealSub(r.ok && r.submission ? r.submission : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="mb-2 h-8 w-8 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    );
  }

  if (!realSub) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <XCircle className="mb-2 h-8 w-8" />
        <p className="text-sm">提交记录未找到</p>
        <Link href="/portfolio" className="mt-4 text-sm text-primary-600 hover:underline">返回作品集</Link>
      </div>
    );
  }

  const status = statusConfig[mapStatus(realSub)] || statusConfig["已提交"];
  const StatusIcon = status.icon;
  const githubRepo = realSub.github_repo_url?.replace(/^https?:\/\/github\.com\//, "") || "";

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/portfolio" className="hover:text-gray-700">作品集</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{realSub.project_title}</span>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{realSub.project_title}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                <StatusIcon className={`h-3.5 w-3.5 ${mapStatus(realSub) === "检查中" ? "animate-spin" : ""}`} />
                {status.label}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {realSub.student_name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {realSub.submitted_at || "-"}</span>
              {githubRepo && (
                <span className="flex items-center gap-1"><Github className="h-3.5 w-3.5" /> {githubRepo}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Task 状态时间线 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-primary-600" /> 任务进度
            </h2>
            <div className="mt-4 space-y-0">
              {[
                { key: "submitted", label: "已提交", done: true },
                { key: "validating", label: "校验中", done: !!realSub.status && realSub.status !== "submitted" },
                { key: "ai_reviewing", label: "AI 初评", done: (realSub.score_total || 0) > 0 },
                { key: "teacher_reviewing", label: "教师评审", done: realSub.status === "accepted" || realSub.task_state === "COMPLETED" || realSub.status === "reviewed" },
                { key: "completed", label: "完成", done: realSub.status === "accepted" || realSub.task_state === "COMPLETED" },
              ].map((step, i, arr) => (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div className={`mt-0.5 h-6 w-0.5 ${step.done ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              提交时间：{realSub.submitted_at || "—"}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-primary-600" /> AI 初评
            </h2>
            {(realSub.score_total || 0) > 0 ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                  <span className="text-2xl font-bold text-primary-600">{realSub.score_total}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI 评分</p>
                  <p className="text-xs text-gray-500">基于 Rubric 自动生成</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> AI 初评生成中...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MessageSquare className="h-4 w-4 text-primary-600" /> 教师反馈
            </h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" /> 待教师评审
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">提交信息</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">状态</dt>
                <dd className="text-gray-900">{realSub.status || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">提交时间</dt>
                <dd className="text-gray-900">{realSub.submitted_at || "-"}</dd>
              </div>
            </dl>
            {githubRepo && (
              <a href={`https://github.com/${githubRepo}`} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm">
                <Github className="h-4 w-4" /> 查看仓库
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
