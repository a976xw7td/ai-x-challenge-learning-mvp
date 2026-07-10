import Link from "next/link";
import {
  Sparkles,
  GraduationCap,
  Bot,
  GitBranch,
  BookOpen,
  Library,
  ChevronRight,
  Users,
  Target,
  Cpu,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Native 架构",
    description: "基于认知细胞（Cognitive Cell）架构，一切皆 Agent。支持静态与进化两种认知细胞类型。",
  },
  {
    icon: Target,
    title: "PBL 挑战驱动",
    description: "10 个渐进式 Builder Challenge，从入门到企业级部署，每个挑战产出可交付的系统模块。",
  },
  {
    icon: Cpu,
    title: "KSTAR 进化循环",
    description: "每个 Agent 遵循 Learn→Execute→Evaluate→Reflect 进化循环，持续学习与自我优化。",
  },
  {
    icon: GitBranch,
    title: "开源协作",
    description: "7 个 Builder Team 并行推进，GitHub 协作 + AI 辅助开发 + Peer Review 工作流。",
  },
  {
    icon: BookOpen,
    title: "完整课程体系",
    description: "10 周课程涵盖 Vibe Coding、AI Agent、Ontology、知识图谱、企业部署全栈技能。",
  },
  {
    icon: Library,
    title: "统一知识库",
    description: "课程资料、FAQ、Prompt 库、最佳实践、视频教程全部可检索可问答。",
  },
];

const teams = [
  { name: "课程组", role: "Curriculum", desc: "设计 Syllabus、Lecture、Slides" },
  { name: "挑战组", role: "Challenge", desc: "设计 PBL Challenge 和评估标准" },
  { name: "Agent 组", role: "Agent", desc: "开发课程 Agent 和智能助手" },
  { name: "本体组", role: "Ontology", desc: "构建技能本体论和知识图谱" },
  { name: "平台组", role: "Platform", desc: "GitHub、Website、LMS、部署" },
  { name: "知识组", role: "Knowledge", desc: "文档、教程、Prompt 库、视频" },
  { name: "Demo 组", role: "Demo", desc: "演示、宣传、产品化" },
];

const stats = [
  { label: "Builder 团队", value: "7" },
  { label: "课程模块", value: "10" },
  { label: "PBL 挑战", value: "10" },
  { label: "Agent 类型", value: "7+" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">NSEAP</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">特性</a>
            <a href="#course" className="text-sm text-gray-600 hover:text-gray-900">课程</a>
            <a href="#teams" className="text-sm text-gray-600 hover:text-gray-900">团队</a>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              进入平台
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
              <Sparkles className="h-4 w-4" />
              Elite20 Builder Program
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              NSEAP{" "}
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                智能教育平台
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
              基于认知细胞架构的 AI Native 教育操作系统。
              一切皆 Agent，从课程设计到企业部署，重新定义下一代智能教育。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
              >
                进入平台 <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-300 transition-colors"
              >
                了解更多
              </a>
            </div>
          </div>

          {/* 统计条 */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特性 */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">平台核心能力</h2>
            <p className="mt-4 text-lg text-gray-600">
              基于 IEEE 标准架构，构建可演化的智能教育基础设施
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 课程概览 */}
      <section id="course" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">10 周课程体系</h2>
            <p className="mt-4 text-lg text-gray-600">
              从 Vibe Coding 入门到企业级部署，覆盖全栈 AI 开发技能
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { week: "W1", title: "Vibe Coding 入门", color: "bg-primary-500" },
              { week: "W2", title: "AI 辅助编程", color: "bg-blue-500" },
              { week: "W3", title: "首个 AI Agent", color: "bg-emerald-500" },
              { week: "W4", title: "Multi-Agent", color: "bg-amber-500" },
              { week: "W5", title: "Ontology", color: "bg-purple-500" },
              { week: "W6", title: "Evaluation Agent", color: "bg-rose-500" },
              { week: "W7", title: "知识库构建", color: "bg-cyan-500" },
              { week: "W8", title: "平台工程", color: "bg-indigo-500" },
              { week: "W9", title: "产品化", color: "bg-teal-500" },
              { week: "W10", title: "V1.0 发布", color: "bg-primary-700" },
            ].map((item) => (
              <div
                key={item.week}
                className="rounded-xl border border-gray-200 bg-white p-5 text-center hover:shadow-sm transition-shadow"
              >
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold ${item.color}`}>
                  {item.week}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">{item.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/lms"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              查看完整课程大纲 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 团队 */}
      <section id="teams" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">7 个 Builder 团队</h2>
            <p className="mt-4 text-lg text-gray-600">
              开放源代码社区协作，并行推进，AI 辅助开发
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <div
                key={team.name}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold text-sm">
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    <p className="text-xs text-primary-600">{team.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">{team.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-primary-600 to-primary-800 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">一起构建下一代智能教育基础设施</h2>
          <p className="mt-4 text-lg text-primary-100">
            这不是一门普通课程，这是一套 AI Native Learning Operating System 的参考实现
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-primary-700 hover:bg-primary-50 transition-colors shadow-lg"
            >
              进入平台 <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              阅读架构文档
            </a>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-bold text-gray-900">NSEAP</span>
            </div>
            <p className="text-sm text-gray-400">
              NSEAP v1.0 · Elite20 Builder Program · Open Source
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
