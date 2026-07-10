"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  FileText,
  Code2,
  Users,
  ChevronDown,
  Search,
} from "lucide-react";
import { courses } from "@/lib/data";

interface Module {
  week: string;
  title: string;
  description: string;
  status: "已完成" | "进行中" | "未开始";
  type: "lecture" | "lab" | "project";
  content?: string;
}

const defaultModules: Module[] = [
  {
    week: "第 1 周",
    title: "Vibe Coding 入门与环境搭建",
    description: "了解 AI Native 开发范式，配置 Cursor/VS Code + AI 开发环境",
    status: "已完成",
    type: "lecture",
    content: "## 学习目标\n\n了解 Vibe Coding 理念，掌握 AI 辅助编程的核心工作流。\n\n## 内容要点\n- AI Native 开发范式概述\n- Cursor / VS Code + AI 插件配置\n- 第一个 AI 辅助编程实践\n- Prompt Engineering 基础\n\n## 课后练习\n完成环境搭建，使用 AI 助手完成一个简单的 HTML 页面。",
  },
  {
    week: "第 2 周",
    title: "AI 辅助编程实战",
    description: "掌握 Prompt Engineering，实现 AI Pair Programming 工作流",
    status: "已完成",
    type: "lecture",
    content: "## 学习目标\n\n掌握 Prompt Engineering 核心技巧，实现高效的 AI Pair Programming。\n\n## 内容要点\n- Prompt 设计模式\n- 上下文管理与约束\n- 代码生成最佳实践\n- AI Code Review 工作流\n\n## 课后练习\n使用 AI 重构一个现有项目模块，提交 PR 并记录优化过程。",
  },
  {
    week: "第 3 周",
    title: "构建你的第一个 AI Agent",
    description: "学习 Agent 架构设计，完成 Student Companion Agent 开发",
    status: "已完成",
    type: "lab",
    content: "## 学习目标\n\n理解 Agent 架构设计，开发首个教育 AI Agent。\n\n## 内容要点\n- Agent 架构模式\n- MCP (Model Context Protocol) 入门\n- Student Companion Agent 设计\n- Agent 接口与消息格式\n\n## 课后练习\n实现一个简单的 Student Companion Agent，支持问答和提示功能。",
  },
  {
    week: "第 4 周",
    title: "Multi-Agent 系统设计",
    description: "多 Agent 协作模式、通信协议、任务编排",
    status: "进行中",
    type: "lecture",
    content: "## 学习目标\n\n掌握多 Agent 系统的设计与实现方法。\n\n## 内容要点\n- Multi-Agent 协作模式\n- Agent 间通信协议\n- 任务编排与调度\n- 认知细胞（Cognitive Cell）架构\n\n## 课后练习\n设计一个 Multi-Agent 协作系统，至少包含 3 个不同类型的 Agent。",
  },
  {
    week: "第 5 周",
    title: "Ontology 与知识图谱",
    description: "设计课程本体论，构建技能知识图谱的 JSON Schema",
    status: "未开始",
    type: "lecture",
    content: "## 学习目标\n\n理解本体论（Ontology）概念，掌握知识图谱在课程中的应用。\n\n## 内容要点\n- Ontology 基础概念\n- 课程本体论设计\n- 技能本体论 JSON Schema\n- RDF/OWL 基础\n\n## 课后练习\n设计一个课程本体论 Schema，包含概念、关系、属性约束。",
  },
  {
    week: "第 6 周",
    title: "Evaluation Agent 开发",
    description: "实现自动化代码评估系统，集成评分规则和反馈机制",
    status: "未开始",
    type: "lab",
    content: "## 学习目标\n\n开发自动化的代码评估 Agent，实现智能评分与反馈。\n\n## 内容要点\n- 评估系统架构\n- Rubrics 设计模式\n- 自动化评分逻辑\n- 反馈生成机制\n\n## 课后练习\n实现一个 Evaluation Agent，支持代码提交、自动评分、生成反馈报告。",
  },
  {
    week: "第 7 周",
    title: "Knowledge Base 构建",
    description: "构建可检索、可问答的全课程统一知识库",
    status: "未开始",
    type: "project",
    content: "## 学习目标\n\n构建统一的课程知识库，支持全文检索和智能问答。\n\n## 内容要点\n- 知识库架构设计\n- 文档索引与检索\n- 语义搜索实现\n- AI 问答集成\n\n## 课后练习\n构建一个可检索的知识库原型，支持至少 3 种文档类型的索引和检索。",
  },
  {
    week: "第 8 周",
    title: "平台工程与部署",
    description: "容器化部署、CI/CD 流水线、生产环境运维",
    status: "未开始",
    type: "lecture",
    content: "## 学习目标\n\n掌握容器化部署和 CI/CD 流水线的最佳实践。\n\n## 内容要点\n- Docker 容器化\n- Docker Compose 编排\n- CI/CD 流水线设计\n- 生产环境运维\n\n## 课后练习\n完成平台的 Docker 容器化部署，配置 GitHub Actions CI/CD。",
  },
  {
    week: "第 9 周",
    title: "课程产品化",
    description: "打包测试、文档编写、License 和发布准备",
    status: "未开始",
    type: "project",
    content: "## 学习目标\n\n完成课程产品化流程，包含打包、测试、文档、License。\n\n## 内容要点\n- 产品打包策略\n- 测试框架选择\n- 文档生成自动化\n- License 选择与合规\n\n## 课后练习\n完成课程产品化 Checklist，准备 V1.0 发布。",
  },
  {
    week: "第 10 周",
    title: "NSEAP AI Learning OS V1.0 发布",
    description: "完整系统集成测试，一键部署到目标环境",
    status: "未开始",
    type: "project",
    content: "## 学习目标\n\n完成 NSEAP V1.0 的集成测试和正式发布。\n\n## 内容要点\n- 系统集成测试\n- 性能优化\n- 部署演练\n- 发布 Checklist\n\n## 课后练习\n完成 V1.0 发布流程，确保系统可一键部署到大学或企业环境。",
  },
];

const statusIcon = (status: string) => {
  switch (status) {
    case "已完成":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "进行中":
      return <PlayCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case "lecture":
      return { label: "讲座", color: "bg-purple-50 text-purple-700" };
    case "lab":
      return { label: "实验", color: "bg-amber-50 text-amber-700" };
    case "project":
      return { label: "项目", color: "bg-cyan-50 text-cyan-700" };
    default:
      return { label: "其他", color: "bg-gray-50 text-gray-700" };
  }
};

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-gray-900 first:mt-0">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-5 text-sm text-gray-600 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-gray-600">
        {line}
      </p>
    );
  });
}

export default function LMSPage() {
  const [search, setSearch] = useState("");
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [modules, setModules] = useState<Module[]>(defaultModules);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("nseap-lms-progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setModules(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const updateModuleStatus = (idx: number, newStatus: Module["status"]) => {
    const updated = modules.map((m, i) => (i === idx ? { ...m, status: newStatus } : m));
    setModules(updated);
    if (isClient) {
      localStorage.setItem("nseap-lms-progress", JSON.stringify(updated));
    }
  };

  const filtered = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = modules.filter((m) => m.status === "已完成").length;
  const inProgressCount = modules.filter((m) => m.status === "进行中").length;
  const progress = Math.round((completedCount / modules.length) * 100);

  return (
    <div className="space-y-6">
      {/* 课程概览横幅 */}
      <div className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Elite20 AI Native 课程</h2>
            <p className="mt-1 text-sm text-primary-100">
              10 周 · {completedCount} 模块已完成 · {progress}% 总体进度
            </p>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm">
                <BookOpen className="h-4 w-4" />
                5 次讲座
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm">
                <Code2 className="h-4 w-4" />
                2 次实验
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm">
                <FileText className="h-4 w-4" />
                3 个项目
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm">
                <Users className="h-4 w-4" />
                7 个团队
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{progress}%</p>
            <p className="text-sm text-primary-100">完成度</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索模块..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 模块列表 */}
      <div className="space-y-3">
        {filtered.map((mod, idx) => {
          const typeInfo = typeLabel(mod.type);
          const isExpanded = expandedModule === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
            >
              <div
                className="flex cursor-pointer items-center gap-4 px-5 py-4"
                onClick={() => setExpandedModule(isExpanded ? null : idx)}
              >
                {statusIcon(mod.status)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary-600">{mod.week}</span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>
                  </div>
                  <h3 className="mt-1 font-medium text-gray-900">{mod.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{mod.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      mod.status === "已完成"
                        ? "bg-green-50 text-green-700"
                        : mod.status === "进行中"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {mod.status}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  {mod.content && (
                    <div className="mb-4 rounded-lg bg-white p-4 text-sm leading-relaxed">
                      {renderContent(mod.content)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {mod.status === "未开始" && (
                      <button
                        onClick={() => updateModuleStatus(idx, "进行中")}
                        className="btn-primary text-xs"
                      >
                        开始学习
                      </button>
                    )}
                    {mod.status === "进行中" && (
                      <button
                        onClick={() => updateModuleStatus(idx, "已完成")}
                        className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        标记完成
                      </button>
                    )}
                    {mod.status === "已完成" && (
                      <button
                        onClick={() => updateModuleStatus(idx, "进行中")}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        重新学习
                      </button>
                    )}
                    <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      下载讲义
                    </button>
                    <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      查看 Challenge
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
