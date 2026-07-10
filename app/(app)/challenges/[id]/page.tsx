"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  FileText,
  BookOpen,
  ExternalLink,
  Award,
  Users,
} from "lucide-react";
import { challenges, challengeDetails } from "@/lib/data";

const difficultyColors: Record<string, string> = {
  入门: "bg-green-100 text-green-700",
  进阶: "bg-amber-100 text-amber-700",
  挑战: "bg-red-100 text-red-700",
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const detail = challengeDetails.find((c) => c.id === id);
  const challenge = challenges.find((c) => c.id === id);

  if (!detail || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileText className="mb-2 h-8 w-8" />
        <p className="text-sm">Challenge 未找到</p>
        <Link href="/lms" className="mt-4 text-sm text-primary-600 hover:underline">返回课程</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/lms" className="hover:text-gray-700">LMS</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{challenge.number}</span>
      </nav>

      {/* 标题区 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[challenge.difficulty] || "bg-gray-100 text-gray-600"}`}>
                {challenge.difficulty}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                challenge.status === "已完成" ? "bg-green-50 text-green-700" :
                challenge.status === "进行中" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {challenge.status}
              </span>
            </div>
            <p className="mt-2 text-gray-600">{challenge.description}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 截止 {detail.deadline}</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {challenge.team}</span>
            </div>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            提交 Challenge <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 主要内容区 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 交付物 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Target className="h-5 w-5 text-primary-600" /> 交付物要求
            </h2>
            <ul className="mt-4 space-y-2">
              {detail.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 技术要求 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <BookOpen className="h-5 w-5 text-primary-600" /> 技术要求
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {skill}
                </span>
              ))}
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">验收标准</h3>
            <ul className="mt-2 space-y-1.5">
              {detail.requirements.map((req) => (
                <li key={req} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Rubric */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Award className="h-5 w-5 text-primary-600" /> 评分标准 (Rubric)
            </h2>
            <p className="mt-1 text-xs text-gray-400">总分 100 分 · 各项权重不同</p>
            <div className="mt-4 space-y-4">
              {detail.rubric.map((item) => (
                <div key={item.criterion} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">{item.criterion}</h3>
                    <span className="text-xs font-medium text-primary-600">{item.weight}%</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {item.levels.map((level) => (
                      <div key={level.label} className="rounded-md border border-gray-200 bg-white p-2 text-center">
                        <span className={`text-xs font-bold ${
                          level.label === "优秀" ? "text-green-600" : level.label === "良好" ? "text-amber-600" : "text-gray-500"
                        }`}>{level.label}</span>
                        <span className="ml-1 text-xs text-gray-400">({level.points}分)</span>
                        <p className="mt-0.5 text-xs text-gray-500">{level.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">相关资源</h3>
            <ul className="mt-3 space-y-2">
              {detail.resources.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">团队信息</h3>
            <p className="mt-2 text-sm text-gray-600">{challenge.team}</p>
            <div className="mt-4">
              <Link href="/submit" className="btn-primary flex w-full items-center justify-center gap-2 text-sm">
                提交 <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

