# AI+X Challenge Learning MVP 架构文档

版本：v1.0  
日期：2026-07-03  
定位：开发推进依据

## 1. 项目目标

本 MVP 要做一个真实可运行的 AI+X 项目课学习闭环系统。

系统要让老师能够发布项目任务，让学生提交真实 GitHub 项目，让系统检查提交内容，并把提交、复盘、AI 初评和作品集记录写回真实飞书多维表。

一句话：

> 飞书当数据库，GitHub 当作品仓库，Web App 当操作入口，AI 当评审和复盘助手。

## 2. MVP 不做什么

第一版必须控制范围，暂时不做：

- 微信/企业微信集成
- 招生筛选系统
- 证书系统
- 就业推荐系统
- 复杂登录和权限
- GitHub 自动建仓库
- 飞书审批流
- 移动端 App
- 多课程复杂管理
- 复杂 Agent 市场

第一版只跑通一个真实闭环：

```text
飞书读取学生和 Challenge
→ 学生提交 GitHub 项目
→ 系统检查 GitHub
→ AI 生成初评
→ 写回飞书 Submission / Evaluation / Portfolio
→ Web App 展示结果
```

## 3. 核心用户

### 3.1 管理员 Admin

负责初始化系统。

功能：

- 配置飞书表
- 导入或维护学生
- 创建课程基础数据
- 查看所有提交和错误

### 3.2 老师 Instructor

负责发布任务和查看结果。

功能：

- 在飞书或 Web App 中创建 Challenge
- 查看学生提交
- 查看 GitHub 检查结果
- 查看 AI 初评
- 确认是否进入作品集

### 3.3 学生 Student

负责完成项目和提交成果。

功能：

- 查看已发布 Challenge
- 提交 GitHub Repo、Demo、AAR、自评
- 查看检查结果和 AI 反馈
- 查看自己的作品集成果

## 4. 系统总架构

```text
用户
  ↓
Next.js Web App
  ↓
API Routes / Backend Workflow
  ├── Feishu Service
  ├── GitHub Service
  ├── AI Service
  └── Workflow Service
  ↓
外部系统
  ├── Feishu Bitable
  ├── GitHub API
  └── OpenAI API
```

### 4.1 架构原则

1. 飞书是主数据库  
   Web App 不维护第二份业务数据，避免数据不一致。

2. GitHub 是作品事实来源  
   系统只检查和记录 GitHub 项目，不在第一版托管代码。

3. AI 只做初评建议  
   AI 生成的是 review draft，不是最终权威评分。

4. 先跑通链路，再做体验优化  
   飞书读写成功优先于页面美观。

## 5. 技术选型

推荐：

```text
Frontend: Next.js + React + TypeScript
Backend: Next.js API Routes
Database: Feishu Bitable as primary database
AI: OpenAI API
GitHub: GitHub REST API
Local storage: none for business data
```

不建议第一版使用 Prisma/SQLite 作为业务数据库。  
如需日志，可用控制台日志或简单本地日志文件，但业务状态以飞书为准。

## 6. 页面设计

MVP 只需要 4 个页面。

### 6.1 Dashboard

路径：

```text
/
```

显示：

- 学生总数
- Challenge 数量
- 已提交数量
- 未提交数量
- AI 初评数量
- 作品集数量
- 最近提交列表

### 6.2 Challenges

路径：

```text
/challenges
```

功能：

- 从飞书读取已发布 Challenge
- 展示任务标题、目标、截止时间、状态
- 点击进入提交页

### 6.3 Submit

路径：

```text
/submit
```

功能：

- 选择学生
- 选择 Challenge
- 填写项目提交信息
- 点击提交后触发完整 workflow

表单字段：

```text
student_id
challenge_id
project_title
project_summary
github_repo_url
demo_url
readme_url
aar_text
self_evaluation_text
is_public
```

### 6.4 Portfolio

路径：

```text
/portfolio
```

功能：

- 从飞书 PortfolioItems 表读取公开作品
- 展示作品卡片
- 支持按学生筛选

作品卡片包含：

- 作品名称
- 学生姓名
- 项目简介
- GitHub 链接
- Demo 链接
- AI 评价摘要
- 技能标签
- 是否公开

## 7. 飞书多维表设计

第一版使用 5 张表。

### 7.1 Students 表

表名建议：

```text
Students
```

字段：

| 字段名 | 类型 | 说明 |
|---|---|---|
| student_id | 文本 | 系统内唯一学生 ID |
| name | 文本 | 学生姓名 |
| email | 文本 | 邮箱 |
| github_username | 文本 | GitHub 用户名 |
| github_profile_url | URL | GitHub 主页 |
| school | 文本 | 学校 |
| major | 文本 | 专业 |
| grade | 文本 | 年级 |
| cohort | 单选/文本 | 班级或批次 |
| ai_x_direction | 文本 | AI+X 方向 |
| status | 单选 | active / inactive |
| portfolio_url | URL | 个人作品集地址 |

### 7.2 Challenges 表

表名建议：

```text
Challenges
```

字段：

| 字段名 | 类型 | 说明 |
|---|---|---|
| challenge_id | 文本 | 唯一任务 ID |
| title | 文本 | Challenge 标题 |
| brief | 多行文本 | 任务说明 |
| objective | 多行文本 | 任务目标 |
| deliverables | 多行文本 | 交付物清单，JSON 或文本 |
| rubric | 多行文本 | 评分标准，JSON 或文本 |
| deadline | 日期 | 截止时间 |
| status | 单选 | draft / published / closed |
| created_by | 文本 | 创建者 |

### 7.3 Submissions 表

表名建议：

```text
Submissions
```

字段：

| 字段名 | 类型 | 说明 |
|---|---|---|
| submission_id | 文本 | 唯一提交 ID |
| student_id | 文本 | 学生 ID |
| student_name | 文本 | 学生姓名 |
| challenge_id | 文本 | Challenge ID |
| project_title | 文本 | 项目名称 |
| project_summary | 多行文本 | 项目简介 |
| github_repo_url | URL | GitHub 仓库 |
| readme_url | URL | README 链接 |
| demo_url | URL | Demo 链接 |
| aar_text | 多行文本 | AAR 复盘 |
| self_evaluation_text | 多行文本 | 学生自评 |
| github_check_result | 多行文本 | GitHub 检查 JSON |
| status | 单选 | submitted / checked / reviewed / accepted / needs_revision |
| is_public | 复选框 | 是否公开 |
| submitted_at | 日期时间 | 提交时间 |

### 7.4 Evaluations 表

表名建议：

```text
Evaluations
```

字段：

| 字段名 | 类型 | 说明 |
|---|---|---|
| evaluation_id | 文本 | 唯一评价 ID |
| submission_id | 文本 | 提交 ID |
| student_id | 文本 | 学生 ID |
| challenge_id | 文本 | Challenge ID |
| evaluator_type | 单选 | ai / instructor / self |
| score_total | 数字 | 总分 |
| scores_json | 多行文本 | 分项得分 JSON |
| strengths | 多行文本 | 优点 |
| weaknesses | 多行文本 | 问题 |
| suggestions | 多行文本 | 修改建议 |
| feedback | 多行文本 | 完整反馈 |
| created_at | 日期时间 | 创建时间 |

### 7.5 PortfolioItems 表

表名建议：

```text
PortfolioItems
```

字段：

| 字段名 | 类型 | 说明 |
|---|---|---|
| portfolio_item_id | 文本 | 唯一作品 ID |
| student_id | 文本 | 学生 ID |
| student_name | 文本 | 学生姓名 |
| submission_id | 文本 | 关联提交 |
| title | 文本 | 作品名称 |
| type | 单选 | project / offer / certificate / competition / internship |
| summary | 多行文本 | 内部简介 |
| public_description | 多行文本 | 对外宣传文案 |
| github_url | URL | GitHub |
| demo_url | URL | Demo |
| cover_image_url | URL | 封面图 |
| skills | 多行文本 | 技能标签 |
| ai_feedback_summary | 多行文本 | AI 评价摘要 |
| is_public | 复选框 | 是否公开 |
| created_at | 日期时间 | 创建时间 |

## 8. 环境变量

项目需要以下环境变量：

```env
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_APP_TOKEN=

FEISHU_STUDENTS_TABLE_ID=
FEISHU_CHALLENGES_TABLE_ID=
FEISHU_SUBMISSIONS_TABLE_ID=
FEISHU_EVALUATIONS_TABLE_ID=
FEISHU_PORTFOLIO_TABLE_ID=

GITHUB_TOKEN=

OPENAI_API_KEY=
```

说明：

- `FEISHU_APP_TOKEN` 是多维表 app token。
- `FEISHU_*_TABLE_ID` 是各表 table id。
- `GITHUB_TOKEN` 用于提高 API 限流额度，也可访问授权仓库。
- 不要把任何密钥写进代码。

## 9. 服务模块设计

### 9.1 Feishu Service

文件：

```text
src/lib/feishu.ts
```

职责：

- 获取飞书 access token
- 读取表记录
- 写入表记录
- 更新表记录

函数：

```ts
getStudents()
getStudentById(studentId)
getPublishedChallenges()
getChallengeById(challengeId)
createSubmission(data)
createEvaluation(data)
createPortfolioItem(data)
```

### 9.2 GitHub Service

文件：

```text
src/lib/github.ts
```

职责：

- 解析 GitHub URL
- 检查仓库是否存在
- 检查 README
- 获取最近 commit
- 输出健康检查结果

函数：

```ts
parseGitHubUrl(url)
getRepoInfo(owner, repo)
getReadme(owner, repo)
getLatestCommit(owner, repo)
checkRepoHealth(repoUrl)
```

`checkRepoHealth` 返回：

```json
{
  "repoExists": true,
  "readmeExists": true,
  "latestCommitAt": "2026-07-03T00:00:00Z",
  "defaultBranch": "main",
  "warnings": [],
  "score": 85
}
```

### 9.3 AI Service

文件：

```text
src/lib/ai.ts
```

职责：

- 生成 AI 初评
- 生成作品集描述

函数：

```ts
evaluateSubmission(input)
generatePortfolioDescription(input)
```

AI 初评必须返回结构化 JSON：

```json
{
  "scoreTotal": 82,
  "scores": {
    "problemUnderstanding": 16,
    "aiUsage": 17,
    "artifactCompleteness": 16,
    "technicalExecution": 15,
    "reflectionQuality": 18
  },
  "strengths": "项目目标清楚，提交材料较完整。",
  "weaknesses": "Demo 说明还可以更详细。",
  "suggestions": "补充技术实现过程和截图。",
  "feedback": "完整反馈文本"
}
```

### 9.4 Workflow Service

文件：

```text
src/lib/workflow.ts
```

职责：

把完整提交流程串起来。

主函数：

```ts
submitChallengeProject(input)
```

流程：

```text
1. 校验输入
2. 从飞书读取学生
3. 从飞书读取 Challenge
4. 调 GitHub 检查 repo
5. 调 AI 生成初评
6. 写入飞书 Submissions
7. 写入飞书 Evaluations
8. 调 AI 生成作品集文案
9. 写入飞书 PortfolioItems
10. 返回结果
```

## 10. API 设计

### 10.1 Students

```text
GET /api/students
```

返回飞书 Students 表中的 active 学生。

### 10.2 Challenges

```text
GET /api/challenges
GET /api/challenges/:id
```

返回飞书 Challenges 表中 `status = published` 的任务。

### 10.3 Submit

```text
POST /api/submit
```

请求体：

```json
{
  "studentId": "stu_zhanghao",
  "challengeId": "ch01",
  "projectTitle": "WhaleTV+ App",
  "projectSummary": "一个 AI 辅助完成的电视内容体验应用原型。",
  "githubRepoUrl": "https://github.com/user/repo",
  "readmeUrl": "https://github.com/user/repo#readme",
  "demoUrl": "https://example.com",
  "aarText": "复盘内容",
  "selfEvaluationText": "自评内容",
  "isPublic": true
}
```

返回：

```json
{
  "ok": true,
  "submissionId": "sub_xxx",
  "githubCheck": {},
  "aiEvaluation": {},
  "portfolioItemId": "pf_xxx"
}
```

### 10.4 Portfolio

```text
GET /api/portfolio
```

返回 `is_public = true` 的作品集记录。

## 11. 提交流程伪代码

```ts
async function submitChallengeProject(input) {
  validateInput(input)

  const student = await feishu.getStudentById(input.studentId)
  const challenge = await feishu.getChallengeById(input.challengeId)

  const githubCheck = await github.checkRepoHealth(input.githubRepoUrl)

  const aiEvaluation = await ai.evaluateSubmission({
    student,
    challenge,
    submission: input,
    githubCheck,
  })

  const submission = await feishu.createSubmission({
    student_id: student.student_id,
    student_name: student.name,
    challenge_id: challenge.challenge_id,
    project_title: input.projectTitle,
    project_summary: input.projectSummary,
    github_repo_url: input.githubRepoUrl,
    readme_url: input.readmeUrl,
    demo_url: input.demoUrl,
    aar_text: input.aarText,
    self_evaluation_text: input.selfEvaluationText,
    github_check_result: JSON.stringify(githubCheck),
    status: githubCheck.repoExists ? "checked" : "needs_revision",
    is_public: input.isPublic,
    submitted_at: new Date().toISOString(),
  })

  const evaluation = await feishu.createEvaluation({
    submission_id: submission.submission_id,
    student_id: student.student_id,
    challenge_id: challenge.challenge_id,
    evaluator_type: "ai",
    score_total: aiEvaluation.scoreTotal,
    scores_json: JSON.stringify(aiEvaluation.scores),
    strengths: aiEvaluation.strengths,
    weaknesses: aiEvaluation.weaknesses,
    suggestions: aiEvaluation.suggestions,
    feedback: aiEvaluation.feedback,
    created_at: new Date().toISOString(),
  })

  const portfolioDescription = await ai.generatePortfolioDescription({
    student,
    challenge,
    submission: input,
    evaluation: aiEvaluation,
  })

  const portfolioItem = await feishu.createPortfolioItem({
    student_id: student.student_id,
    student_name: student.name,
    submission_id: submission.submission_id,
    title: input.projectTitle,
    type: "project",
    summary: input.projectSummary,
    public_description: portfolioDescription.publicDescription,
    github_url: input.githubRepoUrl,
    demo_url: input.demoUrl,
    skills: portfolioDescription.skills.join(", "),
    ai_feedback_summary: aiEvaluation.feedback,
    is_public: input.isPublic,
    created_at: new Date().toISOString(),
  })

  return {
    ok: true,
    submission,
    evaluation,
    portfolioItem,
    githubCheck,
    aiEvaluation,
  }
}
```

## 12. GitHub 检查规则

第一版只做基础检查：

| 检查项 | 说明 |
|---|---|
| repo_url_format | GitHub URL 格式是否正确 |
| repo_exists | 仓库是否存在 |
| repo_accessible | 仓库是否可访问 |
| readme_exists | README 是否存在 |
| latest_commit | 是否能读取最近提交 |
| demo_url_present | 是否填写 Demo |

不要第一版做代码质量分析。

## 13. AI 初评规则

评分维度：

| 维度 | 分值 |
|---|---:|
| 问题理解 | 20 |
| AI 使用质量 | 20 |
| 产物完整性 | 20 |
| 技术实现 | 20 |
| 复盘质量 | 20 |

AI 输出仅为初评建议，老师可后续人工确认。

## 14. 开发顺序

### Step 1：飞书连通性测试

必须先完成：

```text
读取 Students
读取 Challenges
写入一条测试 Submission
```

这一步没跑通，不进入后续开发。

### Step 2：Next.js 页面骨架

完成：

```text
Dashboard
Challenges
Submit
Portfolio
```

### Step 3：学生提交写入飞书

完成：

```text
Submit 表单
POST /api/submit
写入 Submissions
```

### Step 4：GitHub 检查

完成：

```text
checkRepoHealth
把检查结果写入 Submissions.github_check_result
```

### Step 5：AI 初评

完成：

```text
evaluateSubmission
写入 Evaluations
```

### Step 6：作品集生成

完成：

```text
generatePortfolioDescription
写入 PortfolioItems
Portfolio 页面展示
```

### Step 7：Dashboard 汇总

完成：

```text
总学生数
Challenge 数
提交数
作品集数
最近提交
```

## 15. 验收标准

系统完成后，必须满足：

1. 能从真实飞书读取 Students。
2. 能从真实飞书读取 published Challenges。
3. 学生能在 Web App 提交真实 GitHub repo。
4. 系统能调用 GitHub API 检查 repo。
5. 系统能生成 GitHub 检查 JSON。
6. 系统能调用 OpenAI 生成 AI 初评。
7. 系统能把提交写入飞书 Submissions。
8. 系统能把 AI 初评写入飞书 Evaluations。
9. 系统能生成作品集文案。
10. 系统能把作品集记录写入飞书 PortfolioItems。
11. Portfolio 页面能展示飞书中的公开作品。
12. Dashboard 能显示真实统计数据。

## 16. 演示数据建议

学生：

```text
张浩
冯静雯
陈万康
```

Challenge：

```text
Challenge 0：配置个人 AI 学习助手
Challenge 1：完成第一个 AI+X Mini Product
```

示例作品：

```text
Campus Guide AI
Smart Reading Companion
Learning Portfolio Demo
```

第一条完整演示建议使用：

```text
学生：测试学生A
Challenge：完成第一个 AI+X Mini Product
作品：Campus Guide AI
```

## 17. 最终主线

系统所有功能都围绕这条线：

```text
Student
→ Challenge
→ Submission
→ GitHub Check
→ AI Evaluation
→ Portfolio
```

大白话：

```text
学生接任务
→ 做项目
→ 交 GitHub
→ 系统检查
→ AI 初评
→ 变成作品集
```

第一版只要把这条线真实跑通，就是成功。
