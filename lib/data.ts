// ===== 现有类型 =====

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "进行中" | "已完成" | "未开始";
  modules: number;
  completedModules: number;
}

export interface Challenge {
  id: string;
  number: string;
  title: string;
  description: string;
  difficulty: "入门" | "进阶" | "挑战";
  status: "待完成" | "进行中" | "已完成";
  team: string;
}

export interface DocSection {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  author: string;
  content: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: "FAQ" | "教材" | "Prompt" | "最佳实践" | "视频";
  tags: string[];
  summary: string;
  lastUpdated: string;
}

// ===== 新增类型 =====

export interface RubricLevel {
  label: string;
  points: number;
  description: string;
}

export interface RubricItem {
  criterion: string;
  weight: number;
  description: string;
  levels: RubricLevel[];
}

export interface ChallengeDetail extends Challenge {
  deliverables: string[];
  deadline: string;
  skills: string[];
  requirements: string[];
  rubric: RubricItem[];
  resources: string[];
}

export interface CheckResult {
  readme: boolean;
  commits: boolean;
  demo: boolean;
  reflection: boolean;
}

export interface AiReview {
  summary: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

export type SubmissionStatus = "已提交" | "检查中" | "检查失败" | "待评审" | "已评分";

export interface Submission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  studentId: string;
  studentName: string;
  githubRepo: string;
  githubBranch: string;
  status: SubmissionStatus;
  checkResults: CheckResult;
  aiReview: AiReview;
  teacherFeedback?: string;
  teacherScore?: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface PortfolioItem {
  id: string;
  studentName: string;
  studentId: string;
  challengeTitle: string;
  challengeId: string;
  summary: string;
  techStack: string[];
  demoUrl?: string;
  githubRepo: string;
  aiScore: number;
  teacherScore?: number;
  isPublic: boolean;
  submittedAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  github: string;
  email: string;
  studentClass: string;
  completedChallenges: number;
  totalChallenges: number;
  skills: string[];
}

// ===== 现有数据 =====

export const courses: Course[] = [
  { id: "elite20", title: "Elite20 AI Native 课程", description: "基于 SIAS University Vibe Coding 的全栈 AI 开发课程", progress: 35, status: "进行中", modules: 10, completedModules: 3 },
  { id: "agents", title: "AI Agent 开发实战", description: "学习如何构建和部署 AI Agent 系统", progress: 60, status: "进行中", modules: 8, completedModules: 5 },
  { id: "ontology", title: "教育本体论与知识图谱", description: "构建课程本体论和技能本体论", progress: 0, status: "未开始", modules: 6, completedModules: 0 },
];

export const challenges: Challenge[] = [
  { id: "c01", number: "Challenge 01", title: "构建课程首页", description: "使用 Next.js + Tailwind 构建课程 Landing Page", difficulty: "入门", status: "已完成", team: "平台组" },
  { id: "c02", number: "Challenge 02", title: "构建第一周课程", description: "按模板完成 Week 1 课程内容", difficulty: "入门", status: "已完成", team: "课程组" },
  { id: "c03", number: "Challenge 03", title: "构建 Challenge 模板", description: "创建标准化的 PBL 挑战模板系统", difficulty: "进阶", status: "已完成", team: "挑战组" },
  { id: "c04", number: "Challenge 04", title: "构建 Skill Ontology", description: "设计技能本体论的数据模型和 JSON Schema", difficulty: "进阶", status: "进行中", team: "本体组" },
  { id: "c05", number: "Challenge 05", title: "构建 Coding Coach", description: "开发能够指导完成 Challenge 的 AI 编程教练", difficulty: "挑战", status: "待完成", team: "Agent 组" },
  { id: "c06", number: "Challenge 06", title: "构建 Evaluation Agent", description: "实现自动化评分和评估系统", difficulty: "挑战", status: "待完成", team: "Agent 组" },
  { id: "c07", number: "Challenge 07", title: "构建 Knowledge Base", description: "课程知识全部可检索、可问答", difficulty: "进阶", status: "待完成", team: "知识组" },
  { id: "c08", number: "Challenge 08", title: "企业部署版本", description: "完整的部署指南和管理手册", difficulty: "挑战", status: "待完成", team: "平台组" },
  { id: "c09", number: "Challenge 09", title: "课程产品化", description: "打包、测试、文档、License 全部就绪", difficulty: "进阶", status: "待完成", team: "Demo 组" },
  { id: "c10", number: "Challenge 10", title: "发布 NSEAP AI Learning OS V1.0", description: "一键部署完整系统到大学和企业环境", difficulty: "挑战", status: "待完成", team: "全员" },
];
// ===== 新增：Challenge 详情数据 =====

export const challengeDetails: ChallengeDetail[] = [
  {
    ...challenges.find((c) => c.id === "c01")!,
    deliverables: ["Landing Page 首页", "README.md", "项目部署链接"],
    deadline: "2026-07-15",
    skills: ["Next.js", "TailwindCSS", "UI 设计"],
    requirements: ["响应式布局", "支持移动端", "页面加载速度 < 2s"],
    rubric: [
      { criterion: "页面完整度", weight: 30, description: "首页是否包含完整的课程介绍、团队信息、CTA", levels: [
        { label: "优秀", points: 30, description: "包含全部要素，设计精美" },
        { label: "良好", points: 20, description: "包含主要要素，略有缺失" },
        { label: "待改进", points: 10, description: "缺少多个关键要素" }]},
      { criterion: "代码质量", weight: 25, description: "代码结构清晰，TypeScript 类型完整", levels: [
        { label: "优秀", points: 25, description: "代码整洁，类型完整，组件合理拆分" },
        { label: "良好", points: 18, description: "代码可读，类型基本完整" },
        { label: "待改进", points: 8, description: "代码混乱，缺少类型定义" }]},
      { criterion: "UI/UX", weight: 25, description: "视觉设计和用户体验", levels: [
        { label: "优秀", points: 25, description: "设计一致，交互流畅，适配移动端" },
        { label: "良好", points: 18, description: "设计基本一致，可用性良好" },
        { label: "待改进", points: 8, description: "设计不一致，存在可用性问题" }]},
      { criterion: "文档", weight: 20, description: "README、部署说明、项目结构", levels: [
        { label: "优秀", points: 20, description: "文档完整，含部署指引和截图" },
        { label: "良好", points: 14, description: "文档基本完整" },
        { label: "待改进", points: 6, description: "文档缺失或过于简单" }]},
    ],
    resources: ["Next.js 官方文档", "TailwindCSS 组件库", "项目模板仓库"],
  },
  {
    ...challenges.find((c) => c.id === "c05")!,
    deliverables: ["Coding Coach Agent", "Agent 配置文件", "使用文档"],
    deadline: "2026-08-01",
    skills: ["AI Agent", "Prompt Engineering", "MCP"],
    requirements: ["支持多语言编程问题解答", "能够理解项目上下文", "提供代码示例和解释"],
    rubric: [
      { criterion: "功能性", weight: 35, description: "Agent 能否正确回答编程问题", levels: [
        { label: "优秀", points: 35, description: "准确理解问题，提供可运行代码" },
        { label: "良好", points: 25, description: "基本正确，偶有小错误" },
        { label: "待改进", points: 12, description: "经常答非所问" }]},
      { criterion: "架构设计", weight: 25, description: "Agent 架构是否符合规范", levels: [
        { label: "优秀", points: 25, description: "符合 MCP 规范，模块化设计" },
        { label: "良好", points: 18, description: "基本符合规范" },
        { label: "待改进", points: 8, description: "架构混乱" }]},
      { criterion: "Prompt 质量", weight: 20, description: "Prompt 设计的合理性和有效性", levels: [
        { label: "优秀", points: 20, description: "Prompt 结构化，有上下文管理" },
        { label: "良好", points: 14, description: "Prompt 基本有效" },
        { label: "待改进", points: 6, description: "Prompt 过于简单" }]},
      { criterion: "文档与测试", weight: 20, description: "使用文档和测试用例", levels: [
        { label: "优秀", points: 20, description: "文档完整，有测试用例" },
        { label: "良好", points: 14, description: "有基本使用说明" },
        { label: "待改进", points: 6, description: "缺少文档" }]},
    ],
    resources: ["MCP 协议文档", "OpenAI API 文档", "Agent 设计模式"],
  },
];

export function getChallengeDetail(id: string): ChallengeDetail | undefined {
  return challengeDetails.find((c) => c.id === id);
}

// ===== 新增：学生数据 =====

export const students: StudentProfile[] = [
  { id: "s01", name: "张三", github: "zhangsan-dev", email: "zhangsan@example.com", studentClass: "Elite20", completedChallenges: 3, totalChallenges: 10, skills: ["Next.js", "React", "TypeScript", "TailwindCSS"] },
  { id: "s02", name: "李四", github: "lisi-dev", email: "lisi@example.com", studentClass: "Elite20", completedChallenges: 2, totalChallenges: 10, skills: ["Python", "FastAPI", "PostgreSQL"] },
  { id: "s03", name: "王五", github: "wangwu-dev", email: "wangwu@example.com", studentClass: "Elite20", completedChallenges: 1, totalChallenges: 10, skills: ["Vue.js", "JavaScript"] },
  { id: "s04", name: "赵六", github: "zhaoliu-dev", email: "zhaoliu@example.com", studentClass: "Elite20", completedChallenges: 3, totalChallenges: 10, skills: ["Rust", "WebAssembly", "TypeScript"] },
  { id: "s05", name: "陈七", github: "chenqi-dev", email: "chenqi@example.com", studentClass: "Elite20", completedChallenges: 0, totalChallenges: 10, skills: ["Java", "Spring Boot"] },
];

// ===== 新增：提交数据 =====

export const submissions: Submission[] = [
  { id: "sub-001", challengeId: "c01", challengeTitle: "构建课程首页", studentId: "s01", studentName: "张三", githubRepo: "zhangsan-dev/nseap-landing", githubBranch: "main", status: "已评分", checkResults: { readme: true, commits: true, demo: true, reflection: true }, aiReview: { summary: "项目结构清晰，Landing Page 包含完整的 Hero、特性、课程概览和团队展示区块。响应式布局适配良好。README 文档详细。", score: 88, strengths: ["响应式设计优秀", "组件拆分合理", "文档完整", "TypeScript 类型完善"], improvements: ["页面加载性能可进一步优化", "缺少单元测试"] }, teacherFeedback: "整体完成度很高，UI 设计精美。建议补充单元测试和性能优化。", teacherScore: 90, submittedAt: "2026-07-05", reviewedAt: "2026-07-07" },
  { id: "sub-002", challengeId: "c01", challengeTitle: "构建课程首页", studentId: "s02", studentName: "李四", githubRepo: "lisi-dev/elite20-homepage", githubBranch: "main", status: "待评审", checkResults: { readme: true, commits: true, demo: false, reflection: true }, aiReview: { summary: "页面结构完整，包含所需模块。但缺少 Demo 部署链接。代码基本规范。", score: 72, strengths: ["代码结构规范", "包含 AAR 复盘"], improvements: ["缺少 Demo 链接", "README 内容可以更丰富", "部分组件缺少类型定义"] }, submittedAt: "2026-07-06" },
  { id: "sub-003", challengeId: "c02", challengeTitle: "构建第一周课程", studentId: "s01", studentName: "张三", githubRepo: "zhangsan-dev/week1-course", githubBranch: "main", status: "已评分", checkResults: { readme: true, commits: true, demo: true, reflection: true }, aiReview: { summary: "第一周课程内容完整，包含教学大纲、Lecture Notes 和 Lab 实验指导。", score: 92, strengths: ["内容完整详实", "结构清晰", "Lab 设计有实操性"], improvements: ["可增加视频讲解链接"] }, teacherFeedback: "课程质量很高，可以直接用于教学。", teacherScore: 93, submittedAt: "2026-07-03", reviewedAt: "2026-07-05" },
  { id: "sub-004", challengeId: "c03", challengeTitle: "构建 Challenge 模板", studentId: "s04", studentName: "赵六", githubRepo: "zhaoliu-dev/challenge-template", githubBranch: "main", status: "检查失败", checkResults: { readme: false, commits: true, demo: false, reflection: false }, aiReview: { summary: "仓库已创建但缺少关键文件。README 为空，无 Demo 和复盘文档。", score: 30, strengths: ["仓库结构基本正确"], improvements: ["需要补充 README", "需要添加使用说明", "需要提交 Demo 链接"] }, submittedAt: "2026-07-04" },
  { id: "sub-005", challengeId: "c02", challengeTitle: "构建第一周课程", studentId: "s02", studentName: "李四", githubRepo: "lisi-dev/week1-material", githubBranch: "main", status: "检查中", checkResults: { readme: true, commits: true, demo: false, reflection: false }, aiReview: { summary: "正在检查仓库内容...", score: 0, strengths: [], improvements: [] }, submittedAt: "2026-07-08" },
];

export function getSubmissionsByStudent(studentId: string): Submission[] {
  return submissions.filter((s) => s.studentId === studentId);
}

export function getSubmissionById(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id);
}

// ===== 新增：作品集数据 =====

export const portfolioItems: PortfolioItem[] = [
  { id: "pf-001", studentName: "张三", studentId: "s01", challengeTitle: "构建课程首页", challengeId: "c01", summary: "使用 Next.js + TailwindCSS 构建了完整的课程 Landing Page，包含 Hero、特性、课程概览、团队展示和 CTA 区块。响应式设计，代码类型完整。", techStack: ["Next.js", "TailwindCSS", "TypeScript", "Lucide"], demoUrl: "https://nseap-landing.vercel.app", githubRepo: "zhangsan-dev/nseap-landing", aiScore: 88, teacherScore: 90, isPublic: true, submittedAt: "2026-07-05" },
  { id: "pf-002", studentName: "赵六", studentId: "s04", challengeTitle: "构建 Challenge 模板", challengeId: "c03", summary: "设计了一套标准化的 PBL Challenge 模板系统，包含任务描述、交付物清单、Rubric 评分标准和资源引用。模板支持 Markdown 和 JSON 两种格式。", techStack: ["Markdown", "JSON Schema", "YAML"], githubRepo: "zhaoliu-dev/challenge-template", aiScore: 30, isPublic: false, submittedAt: "2026-07-04" },
  { id: "pf-003", studentName: "张三", studentId: "s01", challengeTitle: "构建第一周课程", challengeId: "c02", summary: "完成了 Elite20 第一周的完整课程设计，包含 Syllabus、Lecture Notes、Lab 实验指导和课后作业。内容覆盖 Vibe Coding 入门和 AI 开发环境搭建。", techStack: ["Markdown", "Next.js", "MDX"], githubRepo: "zhangsan-dev/week1-course", aiScore: 92, teacherScore: 93, isPublic: true, submittedAt: "2026-07-03" },
  { id: "pf-004", studentName: "李四", studentId: "s02", challengeTitle: "构建课程首页", challengeId: "c01", summary: "实现了课程首页的基本布局，包含导航栏、课程介绍和团队信息。目前缺少 Demo 部署链接。", techStack: ["Next.js", "TailwindCSS", "TypeScript"], githubRepo: "lisi-dev/elite20-homepage", aiScore: 72, isPublic: false, submittedAt: "2026-07-06" },
];

export function getPortfolioByStudent(studentId: string): PortfolioItem[] {
  return portfolioItems.filter((p) => p.studentId === studentId);
}
// ===== 原有数据（补充） =====

export const docSections: DocSection[] = [
  { id: "d1", title: "NSEAP 架构概述", category: "架构设计", lastUpdated: "2026-06-28", author: "架构组", content: "NSEAP 基于认知细胞（Cognitive Cell）架构，一切皆 Agent。系统由静态认知细胞和进化认知细胞组成，通过 KSTAR 进化循环实现持续学习与优化。" },
  { id: "d2", title: "Builder 工作流程", category: "开发指南", lastUpdated: "2026-06-27", author: "平台组", content: "Builder 遵循统一流程：认领任务 → 分析需求 → AI 辅助开发 → GitHub 提交 → Peer Review → Agent Review → Merge → 文档 → 发布。" },
  { id: "d3", title: "Challenge 设计规范", category: "课程设计", lastUpdated: "2026-06-26", author: "挑战组", content: "每个 Challenge 都必须是可交付、可使用的产品功能。不是作业，是系统能力模块。需包含：目标、验收标准、难度等级、关联技能。" },
  { id: "d4", title: "Agent 接口规范 (MCP)", category: "开发指南", lastUpdated: "2026-06-25", author: "Agent 组", content: "所有 Agent 遵循统一接口规范：Identity（身份）、Capability（能力）、Interface（标准 API/MCP）。Agent 之间通过 Ontology + Context 动态解析关系。" },
  { id: "d5", title: "Ontology 设计指南", category: "架构设计", lastUpdated: "2026-06-24", author: "本体组", content: "本体设计包含：概念、实体、属性、关系、行为约束。包括课程本体论、技能本体论、挑战本体论、项目本体论、评估本体论五大体系。" },
  { id: "d6", title: "部署运维手册", category: "运维指南", lastUpdated: "2026-06-23", author: "平台组", content: "支持一键部署到大学和企业环境。包含 Docker 容器化部署、Kubernetes 编排、监控告警、自动扩缩容等完整运维方案。" },
];

export const knowledgeItems: KnowledgeItem[] = [
  { id: "k1", title: "什么是 NSEAP？", type: "FAQ", tags: ["入门", "概念"], summary: "NSEAP（智能教育平台）是一个 AI Native 教育操作系统，基于认知细胞架构，旨在让任何学校或企业一键部署完整 AI 课程体系。", lastUpdated: "2026-06-28" },
  { id: "k2", title: "Vibe Coding 入门指南", type: "教材", tags: ["Vibe Coding", "AI 编程", "Cursor"], summary: "Vibe Coding 是一种 AI 辅助编程方法论，开发者描述意图，AI 生成代码。本指南覆盖从环境搭建到高级工作流的完整流程。", lastUpdated: "2026-06-27" },
  { id: "k3", title: "如何写好 Prompt", type: "Prompt", tags: ["Prompt Engineering", "最佳实践"], summary: "精心设计的 Prompt 模板集合，涵盖代码生成、代码审查、课程设计、文档编写等常见场景。包含提示词工程最佳实践。", lastUpdated: "2026-06-26" },
  { id: "k4", title: "认知细胞架构最佳实践", type: "最佳实践", tags: ["架构", "Cognitive Cell", "设计模式"], summary: "如何设计可复用的认知细胞，KSTAR 进化循环的实现模式，Agent 间动态关系解析的推荐方案。", lastUpdated: "2026-06-25" },
  { id: "k5", title: "Multi-Agent 协作开发", type: "视频", tags: ["Agent", "协作", "工作流"], summary: "30 分钟视频教程，演示如何使用多个 AI Agent 协作完成一个完整的 Challenge 开发流程。", lastUpdated: "2026-06-24" },
  { id: "k6", title: "企业部署常见问题", type: "FAQ", tags: ["部署", "运维", "企业版"], summary: "校园网环境部署、私有化数据安全、与企业现有 LMS 系统集成、单点登录配置等常见问题的解决方案。", lastUpdated: "2026-06-23" },
  { id: "k7", title: "TypeScript + React 开发规范", type: "最佳实践", tags: ["TypeScript", "React", "代码规范"], summary: "项目统一的代码风格和开发规范，包括组件设计模式、状态管理、文件命名、Git 提交信息格式等。", lastUpdated: "2026-06-22" },
  { id: "k8", title: "课程 Syllabus 完整版", type: "教材", tags: ["课程", "教学大纲", "学习路径"], summary: "10 周完整教学计划，包含每周学习目标、Lecture 大纲、Lab 实验、Challenge 挑战和评估标准。", lastUpdated: "2026-06-21" },
];
