# ArenaQA — AI 问答竞技场 🏟️

> 开源、自托管的 AI 模型比武场。并发对比多个大模型，AI 裁判自动评分，融合引擎提取共识与分歧。**支持多轮连续对话。**

---

## 功能特性

- **多模型并发问答** — 同时向 DeepSeek、Qwen、Claude、Gemini、NVIDIA NIM 等模型提问，并排查看回答
- **多轮连续对话** — 基于当前对话继续追问，模型自动继承历史上下文
- **AI 裁判评分** — 每轮对话独立评分（准确性、完整性、可操作性、安全性）
- **融合引擎** — 提取各模型共识与分歧，自动生成综合答案
- **SSE 实时流式** — 回答逐 token 推送，实时查看各模型生成过程
- **三栏布局** — 左侧模型/历史、中间回答区、右侧评分与融合
- **深色模式** — 支持明暗主题切换
- **API 连接测试** — 设置面板内置测试按钮，验证 API Key 是否可用
- **NVIDIA NIM 免费模型** — 内置 20+ 免费模型，零成本开箱即用

## 快速开始

### 前置要求

- Node.js >= 18
- 一个或多个 AI 模型的 API Key

### 安装

```bash
git clone https://github.com/yihefeikong-rgb/arenaqa.git
cd arenaqa
npm install
npm run db:generate
```

### 配置

复制 `.env.example` 为 `.env`，填入 API Key。也可在浏览器设置面板中配置。

### 启动

```bash
npm run dev
# 浏览器打开 http://localhost:3000
```

或双击 `ArenaQA-启动.bat`（自动检查端口、安装依赖、启动服务）。

## 支持的模型

| 模型 | 接入方式 | 环境变量 |
|------|---------|---------|
| DeepSeek V3 | OpenAI 兼容 | `DEEPSEEK_API_KEY` |
| 通义千问 Qwen3 | OpenAI 兼容 | `QWEN_API_KEY` |
| Claude Sonnet 4 | Anthropic SDK | `ANTHROPIC_API_KEY` |
| Gemini 2.5 Pro | Google SDK | `GEMINI_API_KEY` |
| NVIDIA NIM (20+ 免费模型) | NIM API | `NIM_API_KEY` |

裁判模型默认使用 DeepSeek Chat（优先）→ GPT-4o → NIM，也支持在设置面板自定义。

## 多轮对话

ArenaQA 支持在一个对话线程内连续追问：

```
Round 1: 用户提问 → 多模型并发回答 → Judge 评分 → Fusion 融合
Round 2: 继续追问 → 加载上一轮 Fusion 作为上下文 → 再次竞技 → 独立评分融合
Round 3: ...
```

- 每轮的评分和融合结果**独立保存**，不会覆盖上一轮
- RoundTimeline 组件支持点击切换查看任意轮次
- 历史列表显示对话轮数，支持继续追问

## 项目架构

```
src/
├── app/
│   ├── page.tsx                       # 主页面：三栏布局
│   └── api/
│       ├── chat/send/                 # 发送消息 API（支持 conversationId + round）
│       ├── chat/stream/[taskId]/      # SSE 流式 API
│       ├── chat/abort/[taskId]/       # 中止 API
│       ├── history/                   # 历史会话 CRUD（按 round 分组）
│       ├── test-model/                # API 连接测试
│       └── ...
├── components/
│   ├── arenaqa/RoundTimeline.tsx      # 多轮切换组件
│   ├── AnswerColumns/                 # 模型回答对比网格
│   ├── PromptInputBar.tsx             # 追问输入框
│   ├── InputPanel/                    # 模型选择面板
│   ├── SidePanel/                     # 评分/融合展示
│   └── shared/                        # 设置面板/历史列表
├── lib/
│   ├── task-manager.ts                # 任务调度器（P6: 最近3轮上下文）
│   ├── sse-manager.ts                 # SSE 事件管理器
│   ├── judge.ts                       # AI 裁判评分引擎
│   ├── fusion.ts                      # 融合引擎
│   ├── summarizer.ts                  # P8: 长对话摘要生成
│   ├── model-selector.ts              # 共用模型选择器
│   ├── model-registry.ts              # 内置模型注册表
│   └── providers/                     # 各模型 Provider（支持 messages[] 输入）
├── stores/
│   └── chat-store.ts                  # Zustand 状态管理（支持多轮状态）
└── types/
    └── index.ts                       # 核心类型定义

prisma/
└── schema.prisma                      # 数据库 Schema（Conversation/Answer/Judge/Fusion/Message/Feedback）
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (React 19) |
| 样式 | Tailwind CSS 4 |
| 流式 | Server-Sent Events (SSE) |
| 状态 | Zustand |
| 数据库 | SQLite (Prisma ORM) |
| AI SDK | Vercel AI SDK |
| 部署 | Docker / Railway |

## 开发

```bash
npm run dev        # 开发服务器
npm run build      # 构建
npm run lint       # 代码检查
npm run db:studio  # 数据库管理
npm run db:push    # 同步 Schema
```

## 安全

- 所有 API Key 通过环境变量或浏览器 localStorage 配置，不提交到仓库
- `.env`、`*.db`、`*.db.backup` 已在 `.gitignore` 中
- 代码中无硬编码密钥
- 测试模型连接走服务端路由，避免跨域泄露

## 许可证

MIT
