# ArenaQA — AI 问答竞技场 🏟️
此项目为 纯AI项目 全部东西都是AI做的
> 开源、自托管的个人 AI 问答工作台。并发对比多个大模型，AI 裁判自动评分，融合引擎提取共识与分歧。

---

## 功能特性

- **多模型并发问答** — 同时向 DeepSeek、Qwen、Claude、Gemini 等模型提问，并排查看回答
- **AI 裁判评分** — GPT-4o 自动对每个模型的回答进行 4 维评分（准确性、完整性、可操作性、安全性）
- **融合引擎** — 提取所有模型的共识与分歧，自动生成综合答案
- **SSE 实时流式** — 回答逐 token 推送，实时查看各个模型的生成过程
- **三栏可拖拽布局** — 灵活调整输入区/回答区/结果区的宽度比例
- **深色模式** — 支持明暗主题切换，localStorage 持久化偏好
- **现代化 UI** — 采用现代化设计原则，提供美观直观的用户体验
- **响应式设计** — 精心优化的响应式布局，适配各种设备

## 现代化 UI 设计亮点

### 视觉设计
- **现代化配色** — 采用紫色/靛蓝色渐变主题，提升视觉吸引力
- **精致卡片组件** — 使用现代化卡片设计，增强内容层次感
- **优雅动画效果** — 流畅的过渡动画，提升交互体验
- **统一图标系统** — 一致的 SVG 图标，提升界面一致性

### 用户体验
- **直观信息架构** — 清晰的信息层级和组织结构
- **实时反馈** — 进度条和状态指示器提供即时反馈
- **无障碍设计** — 支持键盘导航和屏幕阅读器
- **响应式布局** — 在各种设备上提供一致体验

### 交互优化
- **悬停效果** — 平滑的悬停过渡效果
- **圆角设计** — 现代化的圆角和边框半径
- **深度阴影** — 适度的阴影效果，增加界面深度
- **清晰焦点状态** — 明确的焦点指示器

## 快速开始

### 前置要求

- Node.js >= 18
- 一个或多个 AI 模型的 API Key

### 安装

```bash
# 克隆仓库
git clone https://github.com/yihefeikong-rgb/arenaqa.git
cd arenaqa

# 安装依赖
npm install

# 生成 Prisma 客户端
npm run db:generate
```

### 配置

复制 `.env.example` 为 `.env`，填入你的 API Key：

```env
# === 问答模型（至少配置一个即可使用） ===
DEEPSEEK_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx

# === 裁判模型（用于评分 + 融合，推荐 GPT-4o） ===
OPENAI_API_KEY=sk-xxx
# JUDGE_MODEL=gpt-4o        # 可选，默认 gpt-4o
# OPENAI_BASE_URL=           # 可选，兼容 OpenAI 格式的第三方地址

# === 数据库 ===
DATABASE_URL=file:./dev.db   # SQLite，文件路径相对于 prisma/
```

### 启动

```bash
# 开发模式
npm run dev

# 浏览器打开 http://localhost:3000
```

或直接双击项目根目录的 `ArenaQA-启动.bat`（自动检查端口、安装依赖、启动服务）。

## 支持的模型

| 模型 | 接入方式 | 环境变量 |
|------|---------|---------|
| DeepSeek V3 | OpenAI 兼容 | `DEEPSEEK_API_KEY` |
| 通义千问 Qwen3 | OpenAI 兼容 | `QWEN_API_KEY` |
| Claude Sonnet 4 | Anthropic SDK | `ANTHROPIC_API_KEY` |
| Gemini 2.5 Pro | Google SDK | `GEMINI_API_KEY` |

裁判模型默认使用 GPT-4o（通过 `OPENAI_API_KEY` 配置），也支持配置为其他兼容 OpenAI 格式的模型。

## 项目架构

```
src/
├── app/
│   ├── page.tsx               # 主工作台：三栏可拖拽布局
│   ├── layout.tsx              # 根布局 + NavBar + Provider 初始化
│   ├── globals.css             # 设计令牌系统（rem 单位，CSS Variables）
│   └── api/
│       ├── chat/send/          # 发送消息 API
│       ├── chat/stream/[id]/   # SSE 流式 API
│       ├── chat/abort/[id]/    # 中止 API
│       ├── config/             # 运行时配置 API
│       └── models/             # 模型列表 API
├── components/
│   ├── shared/NavBar.tsx       # 玻璃态导航栏
│   ├── InputPanel/             # 输入面板（模型选择 + 提问）
│   ├── AnswerColumns/          # 多列回答区
│   ├── SidePanel/              # 结果面板（评分 + 融合 + 置信度）
│   └── ui/                     # 基础 UI 组件
├── lib/
│   ├── provider-registry.ts    # Provider 注册中心
│   ├── task-manager.ts         # 任务管理器
│   ├── sse-manager.ts          # SSE 事件流
│   ├── judge.ts                # AI 裁判评分
│   ├── fusion.ts               # 融合引擎
│   └── providers/              # 各模型接入层
├── stores/
│   └── chat-store.ts           # Zustand 状态管理
└── types/
    └── index.ts                # 核心类型定义

prisma/
└── schema.prisma               # 数据库 Schema（待对接）
```

### 数据流

```
用户提问 → 并发请求多个模型 → SSE 流式返回各模型回答
                                     ↓
                    AI 裁判对每个模型进行 4 维评分
                                     ↓
                    融合引擎提取共识与分歧 → 生成综合答案
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (React 19) |
| 样式 | Tailwind CSS 4 + CSS Variables |
| 流式 | Server-Sent Events (SSE) |
| 状态 | Zustand |
| 组件 | Radix UI |
| 图标 | Lucide React |
| 数据库 | SQLite (Prisma) |
| AI SDK | Vercel AI SDK |

## 开发

```bash
# 开发服务器
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 数据库操作
npm run db:studio   # 打开 Prisma Studio
npm run db:push     # 同步 Schema 到数据库
```

## 路线图

- [ ] 数据持久化 — Prisma Schema 已定义，待对接 API 路由
- [ ] 历史记录 — 历史问答查询与删除
- [ ] Playwright 集成 — 动态内容抓取能力
- [ ] 测试覆盖 — 单元测试 + E2E 测试
- [ ] CI/CD — 自动构建与部署

## 安全

- 所有 API Key 通过环境变量配置，不提交到仓库
- `.env` 已在 `.gitignore` 中
- 代码中无硬编码密钥

## 许可证

MIT
