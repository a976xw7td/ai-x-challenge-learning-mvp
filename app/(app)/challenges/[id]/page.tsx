"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Target,
  CheckCircle2,
  ChevronRight,
  FileText,
  BookOpen,
  ExternalLink,
  Award,
  Clock,
} from "lucide-react";
import { fetchChallenges } from "@/lib/api";

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [challenge, setChallenge] = useState<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    team: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges().then((r) => {
      const found = r.items.find((c) => c.id === id);
      setChallenge(found || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Clock className="mb-2 h-8 w-8 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    );
  }

  if (!challenge) {
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
        <span className="text-gray-900">{challenge.title}</span>
      </nav>

      {/* 标题区 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                challenge.status === "已完成" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
              }`}>
                {challenge.status}
              </span>
            </div>
            <p className="mt-2 text-gray-600">{challenge.description}</p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            提交 Challenge <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 简介区 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Target className="h-5 w-5 text-primary-600" /> Challenge 目标
            </h2>
            <p className="mt-4 text-sm text-gray-700 leading-relaxed">
              {challenge.description}
            </p>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">状态信息</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">状态</dt>
                <dd className="text-gray-900">{challenge.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">难度</dt>
                <dd className="text-gray-900">{challenge.difficulty}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Link href="/submit" className="btn-primary flex w-full items-center justify-center gap-2 text-sm">
              提交作品 <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
