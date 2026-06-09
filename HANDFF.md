# ArenaQA — AI 问答竞技场 · 移交文档

> **最后更新：** 2026-06-09  
> **最近提交：** `2ee3504` (master)  
> **远程仓库：** `https://github.com/yihefeikong-rgb/arenaqa.git`

---

## 一、项目总览

开源、自托管的个人 AI 问答工作台。并发对比多个大模型，AI 裁判自动评分（4 维），融合引擎提取共识与分歧生成综合答案。

**一句话：** 多模型并发问答 + AI 评分 + 融合分析 + 历史记录 + 自定义/免费模型。

### 目标用户
- 自己有 AI API Key 但想对比不同模型效果的技术用户
- 需要多模型答案融合分析的场景

---

## 二、技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (React 19, App Router) |
| 语言 | TypeScript 5.8 |
| 样式 | Tailwind CSS 4 + `@tailwindcss/typography` |
| 状态管理 | Zustand 5 |
| 数据库 | Prisma 6 + SQLite |
| AI SDK | Vercel AI SDK 4 (openai/anthropic/google) |
| 流式 | Server-Sent Events (SSE) |
| 代码高亮 | rehype-highlight |
| 容器化 | Docker + docker-compose |

---

## 三、当前进度

### Kimi 计划 10/10 任务 — 全部完成 ✅

#### Phase 1 — 核心体验
- ✅ **Markdown 渲染：** react-markdown + rehype-highlight，支持 GFM + 代码高亮
- ✅ **流式缓冲：** `useStreamBuffer` hook，按句末（。！？\n）或 300ms 超时刷新，减少频繁重渲染
- ✅ **停止/重试：** 每个 AnswerCard 在 streaming 时显示停止按钮，stopped/error 时显示重试按钮
- ✅ **模型选择器：** ModelCard 组件 + 付费/免费分组标签，上限 6 个

#### Phase 2 — 功能增强
- ✅ **输入框增强：** 斜杠指令（/compare /explain /code）+ 图片粘贴/拖拽上传（最多 3 张）
- ✅ **历史记录：** HistorySidebar + REST API + Prisma 持久化 + 自动保存 + 搜索 + 删除
- ✅ **反馈收集：** 点赞/踩按钮 + 踩时弹窗（标签 + 文本）+ 后端 Feedback 表
- ✅ **成本看板：** CostSummary 组件，基于字数估算各模型成本

#### Phase 3 — 扩展接入
- ✅ **免费模型：** docker-compose.free.yml（7 服务）+ FreeApiProvider + 前端分组显示
- ✅ **可访问性：** PWA manifest、触摸优化 44x44、prefers-reduced-motion、focus-visible

### 额外完成功能
- ✅ **设置面板三个标签：** 内置 Key / 裁判模型 / 自定义模型
- ✅ **内置模型可自定义：** 每个模型可配 Base URL + Model ID（防止误用高价版本）
- ✅ **自定义裁判模型：** 任意 OpenAI 兼容 API 当裁判（如 DeepSeek-chat）
- ✅ **自定义模型：** 任意 OpenAI 兼容 API 动态添加（如 Ollama 本地模型、第三方中转站）
- ✅ **Key 贯通：** .env + 前端设置面板 localStorage + 自定义模型，三种途径的 Key 均生效
- ✅ **取消模型不影响已生成回答：** 改为显示所有有回答数据的模型

### 模型选择上限
- 6 个（从 4 改为 6，store/ModelCard/UI 同步）

---

## 四、架构要点

### 数据流
```
用户输入 → POST /api/chat/send → 并行多模型 API → SSE /api/chat/stream/{taskId}
→ chunk(逐字推送) → done(完成) → judge(AI评分) → fusion(融合) → complete
```

### 三栏布局
```
[ 左侧: HistorySidebar | InputPanel ] [ 中间: AnswerColumns 2列网格 ] [ 右侧: ScoreCard + FusionBox + CostSummary ]
```

### 模型配置三级来源（优先级从高到低）
1. **请求时传入（最高）：** 前端 SettingsModal 配置的 Key → localStorage → ChatRequest.apiKeys
2. **.env 环境变量：** DEEPSEEK_API_KEY / QWEN_API_KEY 等（仅在 `/api/models` 显示状态）
3. **免费模型：** Docker 本地部署的免费 API

### 状态机
```
idle → streaming → judging → fusing → complete
                ↓ → stopped → idle (单模型)
                ↓ → error   → idle (单模型)
```

---

## 五、文件索引

### 前端组件
| 文件 | 说明 |
|------|------|
| `src/app/page.tsx` | 主页面 — 三栏布局 + Header + 主题/设置/历史栏 |
| `src/app/layout.tsx` | 根布局 — PWA meta + Provider 初始化 |
| `src/components/InputPanel/index.tsx` | 输入面板 — 模型选择 + 输入框 + 斜杠指令 + 图片 |
| `src/components/InputPanel/ModelCard.tsx` | 模型卡片 — 选中态/禁用/免费标识 |
| `src/components/InputPanel/ImageUploader.tsx` | 图片上传组件 |
| `src/components/AnswerColumns/AnswerColumn.tsx` | 回答列 — 流式/停止/重试/反馈/复制 |
| `src/components/SidePanel/ScoreCard.tsx` | 评分卡片 — 四维条状图 |
| `src/components/SidePanel/FusionBox.tsx` | 融合分析 — 共识/分歧/综合 |
| `src/components/SidePanel/CostSummary.tsx` | 成本估算面板 |
| `src/components/shared/SettingsModal.tsx` | 设置面板 — 内置Key/裁判/自定义三标签 |
| `src/components/shared/HistorySidebar.tsx` | 历史记录侧栏 — 分组/搜索/删除 |
| `src/components/ui/MarkdownRenderer.tsx` | Markdown 渲染 — react-markdown + 高亮 |

### 核心引擎
| 文件 | 说明 |
|------|------|
| `src/lib/task-manager.ts` | 任务管理 — 并行多模型 + 自定义模型/裁判支持 |
| `src/lib/judge.ts` | AI 裁判评分 — 支持自定义裁判配置 |
| `src/lib/fusion.ts` | 融合引擎 — 共识提取 + 分歧标注 |
| `src/lib/sse-manager.ts` | SSE 事件流管理 |
| `src/lib/provider-registry.ts` | Provider 注册 — 付费 + 免费模型 |
| `src/lib/db.ts` | Prisma 客户端单例 |
| `src/lib/providers/` | 模型适配器 (openai-compat/anthropic/google/playwright) |
| `src/lib/providers/free-api.ts` | 免费模型 Provider 注册 |

### 状态 & 类型
| 文件 | 说明 |
|------|------|
| `src/stores/chat-store.ts` | Zustand 状态机 — answers/scores/fusion/stopModel |
| `src/hooks/useChat.ts` | SSE 连接 + 缓冲 + 停止/重试 + 自定义配置 |
| `src/hooks/useStreamBuffer.ts` | 流式缓冲 hook |
| `src/types/index.ts` | 核心类型定义 |

### API 路由
| 端点 | 说明 |
|------|------|
| `POST /api/chat/send` | 发起问答 |
| `GET /api/chat/stream/[taskId]` | SSE 流式 |
| `POST /api/chat/abort/[taskId]` | 中断任务 |
| `GET /api/models` | 模型列表 |
| `POST /api/history` | 保存历史 |
| `GET /api/history` | 历史列表 + 搜索 |
| `GET /api/history/[id]` | 历史详情 |
| `DELETE /api/history/[id]` | 删除单条 |
| `DELETE /api/history` | 清空全部 |
| `POST /api/feedback` | 提交反馈 |
| `GET /api/feedback?stats=true` | 反馈统计 |
| `GET /api/config` | 运行时配置 |

### 基础配置
| 文件 | 说明 |
|------|------|
| `prisma/schema.prisma` | 5 张表：Conversation / Answer / Judge / Fusion / Feedback |
| `src/config/freeModels.ts` | 免费模型定义（7 个，含阶跃星辰） |
| `docker-compose.free.yml` | 免费模型 Docker Compose（含 TOKEN 注入） |
| `./cookies.json` | 网页版 Cookie（已 gitignore） |
| `public/manifest.json` | PWA 配置 |

---

## 六、快速启动

### 前置条件
- Node.js >= 18
- npm install
- 至少一个模型的 API Key

### 启动
```bash
npm install
npx prisma generate
npm run dev
# → http://localhost:3000
```

### 免费模型（Docker，可选）
```bash
docker compose -f docker-compose.free.yml up -d
```

---

## 七、配置指南

### .env 文件（已 gitignore）
```env
# 付费模型 API Key
DEEPSEEK_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx

# 裁判模型（默认 .env 读取）
OPENAI_API_KEY=sk-xxx
JUDGE_MODEL=gpt-4o

# 免费模型 Token
FREE_KIMI_FREE_TOKEN=...
FREE_QWEN_FREE_TOKEN=...
```

### 前端设置面板（SettingsModal）
- **内置 Key 标签：** 每个模型的 API Key + Base URL + Model ID 均可自定义
- **裁判模型标签：** 可配任意 OpenAI 兼容 API 作评分裁判
- **自定义模型标签：** 添加任意 OpenAI 兼容 API（如 Ollama: `http://localhost:11434/v1`）

---

## 八、已知问题

### 🔴 Docker 免费模型 Cookie 已全部过期
- 千问、豆包、智谱、星火、阶跃星辰的 Cookie 均已过期
- 阶跃星辰还有 SSL 证书过期问题
- 需重新登录并从浏览器 DevTools → Application → Cookies 提取新 Cookie
- 更新到 `.env` 后 `docker compose -f docker-compose.free.yml up -d --force-recreate`

### ✅ 测试覆盖已完成（2026-06-09）
- **10 个测试文件，125 个测试用例，全部通过**
- **覆盖率 Lines 97.71% | Branches 81.53% | Functions 98.18%**
- 覆盖模块：config(100%) / stores(100%) / sse-manager(100%) / judge(100%) / fusion(100%) / provider-registry(85.71%) / useStreamBuffer(100%) / UI 组件(100%)
- 运行命令：`npm run test`（`vitest run --coverage`）
- API 路由、task-manager、useChat、大型组件、providers 目录未覆盖（需 mock 真实服务）

### 🟡 代码 Highlighter 潜在兼容风险
- 使用 rehype-highlight（非 react-syntax-highlighter）
- react-syntax-highlighter + Next.js Webpack 有兼容问题

### 🟡 PlaywrightProvider 未实现
- `src/lib/providers/playwright.ts` 是空壳，浏览器自动化接入未完成
- 可用于接入无 Docker 镜像的平台（如元宝）

### 🟡 GitHub 推送需要代理
- 当前网络环境需开启代理（127.0.0.1:7897）才能推送

---

## 九、待办事项（优先级排序）

### P1 — PlaywrightProvider 实现
- 浏览器自动化接入网页版模型
- 利用 cookies.json 中的登录 Cookie

### P2 — 测试补充
- API 路由测试（需 mock Prisma 和 NextRequest）
- task-manager 编排集成测试
- useChat hook 测试（需 mock EventSource）
- Playwright E2E 用户流程测试

### P3 — 代码清理 & CI/CD
- `docs/` 目录中过时文件可以清理
- `.codegraph/` `.reasonix/` 目录中的 IDE 元数据可确认是否要 gitignore
- 接入 GitHub Actions 或类似 CI

---

## 十、项目规范

详见 `.claude/CLAUDE.md`：
- 目录所有权：api/ → coder, components/hooks/stores → coder(frontend), lib/ → coder(backend)
- 进度同步：TASKS.md
- 跨 Agent 通过 TASKS.md 沟通
