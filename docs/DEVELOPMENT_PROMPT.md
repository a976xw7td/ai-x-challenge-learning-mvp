# Development Prompt: AI+X Challenge Learning MVP

You are a senior full-stack engineer and product-minded architect. Build the first real MVP for the AI+X Challenge Learning system according to `AI-X-Challenge-Learning-MVP-Architecture.md`.

## Mission

Create a real, runnable MVP that connects:

- Feishu Bitable as the primary database
- GitHub API as the project artifact checker
- OpenAI API as the AI review and portfolio-description assistant
- A Next.js Web App as the user interface

The core workflow must be:

```text
Student
→ Challenge
→ Submission
→ GitHub Check
→ AI Evaluation
→ Portfolio
```

In plain language:

```text
学生接任务
→ 做项目
→ 交 GitHub
→ 系统检查
→ AI 初评
→ 变成作品集
```

## Scope

Implement only the real MVP. Do not build:

- WeChat integration
- admissions workflows
- certificate workflows
- employment recommendation workflows
- complex login/permission systems
- GitHub repo creation
- Feishu approval flows
- mobile apps
- multi-course complexity
- an ontology editor

## Required Pages

Build four pages:

1. `/` Dashboard
2. `/challenges` Challenge list from Feishu
3. `/submit` Student submission form
4. `/portfolio` Public portfolio gallery from Feishu

Use a simple role/student selector instead of authentication.

## Required Feishu Tables

Assume Feishu Bitable contains these tables:

1. `Students`
2. `Challenges`
3. `Submissions`
4. `Evaluations`
5. `PortfolioItems`

Read table IDs from environment variables.

## Required Environment Variables

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

## Implementation Requirements

Use:

- Next.js
- React
- TypeScript
- API Routes or Server Actions
- Feishu REST API
- GitHub REST API
- OpenAI API

Do not introduce a local business database in v1. Feishu is the source of truth.

Create these service modules:

```text
src/lib/feishu.ts
src/lib/github.ts
src/lib/ai.ts
src/lib/workflow.ts
src/lib/ids.ts
```

## Feishu Service

Implement:

```ts
getStudents()
getStudentById(studentId)
getPublishedChallenges()
getChallengeById(challengeId)
createSubmission(data)
createEvaluation(data)
createPortfolioItem(data)
```

Handle Feishu access token acquisition internally.

## GitHub Service

Implement:

```ts
parseGitHubUrl(url)
getRepoInfo(owner, repo)
getReadme(owner, repo)
getLatestCommit(owner, repo)
checkRepoHealth(repoUrl)
```

The first version only checks:

- GitHub URL format
- repo exists
- repo is accessible
- README exists
- latest commit can be read

## AI Service

Implement:

```ts
evaluateSubmission(input)
generatePortfolioDescription(input)
```

AI evaluation must return structured JSON:

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
  "strengths": "...",
  "weaknesses": "...",
  "suggestions": "...",
  "feedback": "..."
}
```

If `OPENAI_API_KEY` is missing, return a deterministic fallback draft and mark it as fallback, so local development remains usable.

## Workflow Service

Implement:

```ts
submitChallengeProject(input)
```

The workflow must:

1. Validate input
2. Read student from Feishu
3. Read Challenge from Feishu
4. Check GitHub repo
5. Generate AI evaluation
6. Write `Submissions`
7. Write `Evaluations`
8. Generate portfolio description
9. Write `PortfolioItems`
10. Return a full result object

## API Endpoints

Implement:

```text
GET /api/students
GET /api/challenges
GET /api/portfolio
POST /api/submit
```

## Development Strategy

Build in this order:

1. Project scaffold
2. Types and service modules
3. Feishu connectivity
4. GitHub check
5. AI fallback/evaluation
6. Workflow
7. Pages
8. Manual verification

## Acceptance Criteria

The MVP is complete when:

1. The app starts locally.
2. `/api/students` reads from Feishu or returns clear configuration errors.
3. `/api/challenges` reads published Challenges or returns clear configuration errors.
4. `/submit` can submit a real GitHub repo URL.
5. GitHub repo health is checked.
6. AI evaluation is generated or fallback evaluation is returned.
7. Submission is written to Feishu.
8. Evaluation is written to Feishu.
9. Portfolio item is written to Feishu.
10. `/portfolio` displays public portfolio items from Feishu.

## Engineering Rules

- Keep the MVP small and real.
- Prefer clear errors over silent failures.
- Do not hard-code secrets.
- Keep business data in Feishu.
- Do not over-abstract.
- Build the smallest useful version first.

