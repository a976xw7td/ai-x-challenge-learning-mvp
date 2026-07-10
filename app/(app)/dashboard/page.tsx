import {
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { courses, challenges } from "@/lib/data";

export default function DashboardPage() {
  const completedChallenges = challenges.filter((c) => c.status === "已完成").length;
  const inProgressChallenges = challenges.filter((c) => c.status === "进行中").length;
  const totalChallenges = challenges.length;
  const overallProgress = Math.round((completedChallenges / totalChallenges) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">课程总数</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
            <div className="rounded-lg bg-primary-50 p-2">
              <GraduationCap className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">3 门课程可用</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总进度</p>
              <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成挑战</p>
              <p className="text-2xl font-bold text-gray-900">{completedChallenges}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            共 {totalChallenges} 个挑战，{inProgressChallenges} 个进行中
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Builder 团队</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">课程·挑战·Agent·本体·平台·知识·Demo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">我的课程</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {courses.map((course) => (
              <div key={course.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{course.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.status === "进行中"
                        ? "bg-blue-50 text-blue-700"
                        : course.status === "已完成"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>进度 {course.progress}%</span>
                    <span>
                      {course.completedModules}/{course.modules} 模块
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-primary-500 transition-all"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">Builder 挑战进度</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {challenges.slice(0, 5).map((challenge) => (
              <div key={challenge.id} className="flex items-center gap-4 px-6 py-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    challenge.status === "已完成"
                      ? "bg-green-100 text-green-700"
                      : challenge.status === "进行中"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {challenge.status === "已完成" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : challenge.status === "进行中" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{challenge.title}</p>
                  <p className="text-xs text-gray-500">
                    {challenge.number} · {challenge.team}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    challenge.status === "已完成"
                      ? "bg-green-50 text-green-700"
                      : challenge.status === "进行中"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {challenge.status}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-400">
              共 {totalChallenges} 个挑战 · 已完成 {completedChallenges} 个
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="/lms"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="rounded-lg bg-primary-50 p-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">进入 LMS</p>
            <p className="text-xs text-gray-500">管理课程和学习进度</p>
          </div>
        </a>
        <a
          href="/docs"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="rounded-lg bg-amber-50 p-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">查看文档</p>
            <p className="text-xs text-gray-500">阅读架构与开发指南</p>
          </div>
        </a>
        <a
          href="/knowledge"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <div className="rounded-lg bg-purple-50 p-2">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">搜索知识库</p>
            <p className="text-xs text-gray-500">FAQ · Prompt · 最佳实践</p>
          </div>
        </a>
      </div>
    </div>
  );
}
