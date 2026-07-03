# AI+X Challenge Learning MVP

真实接入飞书和 GitHub 的 AI+X 项目课最小闭环系统。

## 核心流程

```text
学生接任务
→ 做项目
→ 交 GitHub
→ 系统检查
→ AI 初评
→ 变成作品集
```

## 页面

- `/` Dashboard
- `/challenges` 已发布 Challenge
- `/submit` 学生提交项目
- `/portfolio` 公开作品集

## API

- `GET /api/health`
- `GET /api/students`
- `GET /api/challenges`
- `GET /api/portfolio`
- `POST /api/submit`
- `POST /api/github/check`

## 配置

复制 `.env.example` 为 `.env.local`，填入真实配置：

```bash
cp .env.example .env.local
```

飞书是主数据库，需要先创建 5 张多维表：

- `Students`
- `Challenges`
- `Submissions`
- `Evaluations`
- `PortfolioItems`

字段设计见上级目录的架构文档：

```text
../AI-X-Challenge-Learning-MVP-Architecture.md
```

## 开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm run lint
npm run build
```

当前实现支持：

- 飞书 access token 获取
- 飞书表读取和写入
- GitHub 仓库健康检查
- OpenAI 初评
- 缺少 `OPENAI_API_KEY` 时返回 fallback 初评，便于本地开发

