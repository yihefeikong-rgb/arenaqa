# AI 问答竞技场 (ArenaQA) — 产品规格文档

> 基于 DeepSeek 和 Kimi 双模型对话融合而成，采用 SpecForge 工作流格式。

---

## 一、产品概述

### 1.1 产品名称
**ArenaQA**（AI 问答竞技场）

### 1.2 一句话定义
一个开源、自托管的个人 AI 问答工作台，将同一个问题并发发送给多个模型，由 AI 裁判自动评分并融合出最佳答案。

### 1.3 核心价值
| 价值 | 说明 |
|------|------|
| 🧠 **打破信息茧房** | 同一个问题，看不同模型的回答角度和思考方式 |
| ⭐ **质量有保障** | AI 裁判多维度评分 + 纠错融合，不依赖用户主观判断 |
| 💰 **成本可控** | API 调低价模型 + 网页免费蹭高价模型，只付自己的 API 费用 |
| 🔒 **完全自托管** | Docker 一键部署，数据隐私自己掌控 |

### 1.4 目标用户
- **核心**：个人开发者 / 独立开发者
- 次级：AI 爱好者和研究者
- 延伸：需要频繁对比不同模型输出质量的内容创作者

### 1.5 核心板块

```
┌──────────────────────────────────────────────────┐
│  ArenaQA 工作台                                    │
│                                                    │
│  ┌─────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ 输入面板  │  │  多列回答区  │  │ 右侧摘要面板      │ │
│  │         │  │            │  │                  │ │
│  │ 问题输入 │  │ Model A    │  │ 评分表            │ │
│  │ 模型选择 │  │ Model B    │  │ 融合答案          │ │
│  │ 发送按钮 │  │ Model C    │  │ 纠错标注          │ │
│  │         │  │ Model D    │  │                  │ │
│  └─────────┘  └────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 1.6 核心工作流

```
用户输入问题
  │
  ▼
并发请求多个模型 ──────────────────────────────────┐
  ├── API 模型（DeepSeek/Kimi/智谱/通义等）         │ streamText()
  ├── 网页模型（GPT-4/Claude 等 via Playwright）    │ 注入 Cookie → 输入 → 抓取
  └── ...                                           │
  │                                                 │
  ▼                                                 │
全部回答收齐 ←──────────────────────────────────────┘
  │
  ▼
AI 裁判评分（四维度：准确/完整/可操作/安全）
  │
  ▼
纠错融合（标记分歧 → 识别错误 → 生成综合答案）
  │
  ▼
面板展示：原始回答（多列可拖拽） + 评分表 + 融合答案
```

### 1.7 验收标准

#### P0（MVP 必须）
| ID | 验收标准 |
|----|---------|
| AC-001 | Given 用户在工作台页面，When 输入问题并选择至少一个模型后点击发送，Then 各模型的回答以流式方式逐步显示在对应列中 |
| AC-002 | Given 多模型正在流式输出，When 用户滚动查看任意列，Then 内容逐步更新不影响滚动定位 |
| AC-003 | Given 所有选定模型均已完成回答，When 最后一个 done 事件到达，Then 自动触发 AI 裁判评分 |
| AC-004 | Given AI 裁判评分完成，When 评分结果返回，Then 右侧面板显示各模型的维度评分表和总分 |
| AC-005 | Given 评分完成，When 融合结果生成，Then 右侧面板展示综合答案，并标注分歧点和纠错说明 |
| AC-006 | Given 某个模型调用超时或返回错误，When 其他模型正常完成，Then 该模型显示错误状态，不影响其他模型的评分和融合 |

#### P1（完整版）
| ID | 验收标准 |
|----|---------|
| AC-007 | Given 用户使用网页版模型（如 GPT-4），When 首次使用，Then 引导用户完成 Cookie 配置或登录 |
| AC-008 | Given 已完成一轮对话，When 用户点击历史记录，Then 可回溯查看之前的问答、评分和融合结果 |
| AC-009 | Given 用户已完成多轮对话，When 点击"对比模式"，Then 可并排展示多轮对话中同一模型的回答变化 |

#### P2（增强版）
| ID | 验收标准 |
|----|---------|
| AC-010 | Given 用户有多个 API Key 配置，When 在设置页面，Then 可增删改查各模型的 API 配置 |
| AC-011 | Given Docker 部署环境，When 执行 docker-compose up，Then 服务在 30 秒内可用 |

---

## 二、技术栈

### 2.1 推荐方案

| 层级 | 技术 | 角色 |
|------|------|------|
| 全栈框架 | Next.js 14 (App Router) + TypeScript | 前后端一把梭，API 路由处理并发 |
| AI 层 | Vercel AI SDK (`ai` 包) | 统一多厂商流式接口（OpenAI/Anthropic/Google/国内兼容层） |
| 样式 | Tailwind CSS + shadcn/ui | 现成面板/表格/对话框/代码块 |
| 拖拽布局 | react-resizable-panels | 左/中/右三栏可拖拽调宽 |
| 数据库 | SQLite + Prisma | 零配置本地文件 |
| 网页自动化 | Playwright | 免费蹭高价模型网页版 |
| 部署 | Docker (Node 20 Alpine) | 一行命令启动 |

### 2.2 为什么选 Vercel AI SDK

这是最关键的选择。Vercel AI SDK 解决了多模型集成的核心痛点：

| 问题 | 解决方案 |
|------|---------|
| 每个厂商不同 SDK | `streamText()` 统一接口 |
| 流式输出处理复杂 | 内置 ReadableStream，SSE 输出几行搞定 |
| 并发调用麻烦 | `Promise.all()` 同时发起多个 streamText |
| 国内模型兼容 | 只要提供 OpenAI-compatible 接口，直接接入 |

### 2.3 混合接入策略

| 接入方式 | 适用模型 | 技术实现 |
|---------|---------|---------|
| **API 直连** | DeepSeek, Kimi, 智谱, 通义千问 | `streamText()` + OpenAI-compatible |
| **原生 SDK** | Claude 3.5 Sonnet, Gemini 2.0 | Anthropic/Google 原生 SDK |
| **网页自动化** | GPT-4, Claude Opus | Playwright + Cookie 注入 + DOM 抓取 |

### 2.4 架构草图

```
┌──────────────────────────────────────────────────────────┐
│  Next.js API Route (/api/chat/send)                       │
│                                                            │
│  prompt + modelList                                        │
│       │                                                    │
│       ▼                                                    │
│  TaskManager（创建 task_id，管理生命周期）                     │
│       │                                                    │
│       ▼                                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 并发执行器 (Promise.all)                            │   │
│  │                                                     │   │
│  │  Model A ─── streamText() ──────┐                   │   │
│  │  Model B ─── streamText() ──────┤                   │   │
│  │  Model C ─── Playwright ────────┤── SSE 推送到前端  │   │
│  │  Model D ─── streamText() ──────┘                   │   │
│  └────────────────────────────────────────────────────┘   │
│       │                                                    │
│       ▼ (全部 done 或 error)                                │
│  Judge（调用裁判模型评分）                                   │
│       │                                                    │
│       ▼                                                    │
│  Fusion（调用裁判模型做融合）                                 │
│       │                                                    │
│       ▼                                                    │
│  SSE: complete                                             │
└──────────────────────────────────────────────────────────┘
```

---

## 三、项目结构

```
arenaqa/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 主工作台页面
│   │   ├── layout.tsx                # 根布局
│   │   └── api/
│   │       ├── chat/
│   │       │   ├── send/route.ts     # POST: 发起新问答
│   │       │   ├── stream/[taskId]/route.ts  # GET SSE: 流式接收
│   │       │   └── abort/[taskId]/route.ts   # POST: 中断
│   │       ├── models/route.ts       # GET: 可用模型列表
│   │       └── config/route.ts       # GET/PUT: 配置管理
│   ├── components/
│   │   ├── InputPanel/               # 输入区组件
│   │   │   ├── PromptInput.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── SendButton.tsx
│   │   ├── AnswerColumns/            # 多列回答区
│   │   │   ├── AnswerColumn.tsx      # 单模型回答列
│   │   │   ├── StreamingText.tsx     # 流式文本渲染
│   │   │   └── ColumnLayout.tsx      # 可拖拽布局
│   │   ├── SidePanel/                # 右侧摘要面板
│   │   │   ├── ScoreTable.tsx        # 评分表
│   │   │   ├── FusionResult.tsx      # 融合答案
│   │   │   └── DivergenceMarker.tsx  # 分歧标注
│   │   └── shared/                   # 公共组件
│   │       ├── MarkdownRenderer.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── providers/                # AI 模型接入层
│   │   │   ├── base.ts              # BaseProvider 抽象
│   │   │   ├── openai-compat.ts     # OpenAI 兼容接口
│   │   │   ├── anthropic.ts         # Claude 原生 SDK
│   │   │   ├── google.ts            # Gemini 原生 SDK
│   │   │   └── playwright.ts        # 网页自动化
│   │   ├── judge.ts                  # AI 裁判评分
│   │   ├── fusion.ts                 # 纠错融合
│   │   ├── sse-manager.ts           # SSE 事件管理器
│   │   └── task-manager.ts          # 任务生命周期管理
│   ├── stores/
│   │   └── chat-store.ts            # 状态管理（状态机）
│   ├── types/
│   │   └── index.ts                  # 核心类型定义
│   └── hooks/
│       ├── useChatStream.ts          # SSE 连接 Hook
│       └── useResizablePanels.ts     # 拖拽布局 Hook
├── prisma/
│   └── schema.prisma                 # 数据模型
├── specs/                            # 规格文档
│   ├── 产品概述.md
│   ├── 技术栈.md
│   └── 项目结构.md
├── docs/                             # 开发文档
├── docker/
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 四、关键数据模型

```prisma
// prisma/schema.prisma

model Conversation {
  id        String   @id @default(cuid())
  prompt    String
  createdAt DateTime @default(now())

  answers   Answer[]
  judge     Judge?
  fusion    Fusion?
}

model Answer {
  id         String   @id @default(cuid())
  model      String
  content    String
  status     String   // streaming | done | error
  latencyMs  Int?
  error      String?
  conversationId String

  conversation Conversation @relation(fields: [conversationId], references: [id])
}

model Judge {
  id        String   @id @default(cuid())
  scores    String   // JSON: [{model, accuracy, completeness, actionability, safety, total, brief}]
  raw       String   // 裁判模型的原始输出
  conversationId String @unique

  conversation Conversation @relation(fields: [conversationId], references: [id])
}

model Fusion {
  id             String   @id @default(cuid())
  consensus      String   // JSON: string[]
  divergences    String   // JSON: [{topic, positions}]
  synthesized    String   // Markdown 综合答案
  conversationId String @unique

  conversation Conversation @relation(fields: [conversationId], references: [id])
}
```

---

## 五、SSE 事件流设计

### 事件类型

| 事件 | 触发时机 | 数据 |
|------|---------|------|
| `chunk` | 模型输出片段 | `{model, content, index}` |
| `done` | 某模型完成 | `{model, latency_ms, total_chars}` |
| `error` | 某模型失败 | `{model, error, code}` |
| `judge` | 评分完成 | `{scores: [...]}` |
| `judge_error` | 评分失败 | `{error}` |
| `fusion` | 融合完成 | `{consensus, divergences, synthesized}` |
| `complete` | 全部结束 | `{task_id, total_latency_ms, all_failed?}` |

### 前端状态机

```
idle → streaming → judging → fusing → complete
  ↑                                      │
  └────────── (清空/新问题) ───────────────┘
```

| 状态 | 输入框 | 回答区 | 评分区 | 融合区 |
|------|--------|--------|--------|--------|
| idle | 可输入 | 空白/上次结果 | 空白 | 空白 |
| streaming | 禁用 | 流式刷新中 | 加载占位 | 加载占位 |
| judging | 禁用 | 已完成 | 加载中 | 加载占位 |
| fusing | 禁用 | 已完成 | 已展示 | 加载中 |
| complete | 可输入 | 已完成 | 已展示 | 已展示 |

---

## 六、竞品差异定位

| 对比维度 | ArenaQA | OwlBrain | MultipleChat | Suprmind |
|---------|---------|----------|-------------|----------|
| 模式 | 问答并发 | 多角色辩论 | 并排展示 | 决策引擎 |
| 评分机制 | AI 裁判四维评分 | 共识检测 | 无自动评分 | 独立裁决简报 |
| 融合输出 | ✅ 纠错+综合 | ✅ 共识报告 | ❌ | ✅ 决策简报 |
| 开源 | ✅ MIT | ⚠️ BSL | ❌ 收费 | ❌ 收费 |
| 自托管 | ✅ Docker | ✅ | ❌ | ❌ |
| 混合接入 | ✅ API+网页 | ❌ | ❌ | ❌ |

---

## 七、开发路线图

### Milestone 1: MVP
| 阶段 | 内容 | 工时 |
|------|------|------|
| 基础设施 | Next.js 项目初始化 + SQLite + Prisma | 1d |
| API 接入 | DeepSeek + 通义千问（OpenAI-compatible） | 1d |
| 流式输出 | SSE 事件流 + 前端流式渲染 | 2d |
| 面板布局 | 左/中/右三栏可拖拽 | 1d |
| 裁判评分 | GPT-4o 评分 + 融合 | 2d |
| **总计** | | **7d** |

### Milestone 2: 完整版
- Claude/Gemini 原生 SDK 接入
- 网页自动化（Playwright + Cookie 管理）
- 对话历史存储和回溯
- 模型配置管理页面

### Milestone 3: 增强版
- 多轮对话对比模式
- 限流和并发控制优化
- Docker 一键部署
- 更多评分维度
