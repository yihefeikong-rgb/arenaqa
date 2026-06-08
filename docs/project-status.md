# ArenaQA — AI 问答竞技场 项目状态

**最后更新：** 2026-06-08  
**版本：** 0.1.2  
**当前分支：** `master`  
**远程仓库：** `https://github.com/yihefeikong-rgb/arenaqa.git`  
**最近提交：** `a22c9a4` — style: 前端 UI 全面升级至 v2.1

---

## 技术栈

- **框架：** Next.js 15 (App Router) + React 19
- **语言：** TypeScript 5.8 + Tailwind CSS 4
- **状态管理：** Zustand 5
- **数据库：** Prisma 6 + SQLite（Schema 就绪，API 未对接）
- **AI 接入：** Vercel AI SDK 4 (openai/anthropic/google/deepseek)
- **部署：** Docker + docker-compose

---

## 已实现功能

### 核心引擎
- ✅ **Provider 注册中心** — 自动从环境变量读取 Key，支持 DeepSeek / Qwen / Anthropic / Gemini
- ✅ **SSE 流式全链路** — send → stream → abort，TaskManager + SSEManager
- ✅ **AI 裁判评分** — 5 维评分（准确/完整/可操作/安全/总分），无 Key 时优雅降级
- ✅ **融合引擎** — 共识提取 + 分歧标注 + 综合答案，多级降级策略

### 前端 UI (v2.1 — 对齐生产级设计系统)
- ✅ **三栏可拖拽布局** — 左(输入)/中(回答)/右(摘要)，带 border 分隔线
- ✅ **深色模式** — CSS 变量 + localStorage 持久化，精细色板层次
- ✅ **玻璃态导航栏** — `backdrop-filter: blur(12px)` 半透明毛玻璃
- ✅ **模型选择** — 渐变色卡片选中态 + 对勾，SVG 图标
- ✅ **流式回答** — 打字机效果 + 代码块(code-block-dark) + 内联代码(inline-code)
- ✅ **点赞/踩按钮** — 带计数，选中态变色
- ✅ **复制功能** — 一键复制回答内容
- ✅ **置信度条** — 颜色逻辑（≥80% 绿 / ≥50% 琥珀 / <50% 红）
- ✅ **评分展示** — 四维评分条 + 最佳模型标识 + 图标容器
- ✅ **融合展示** — 共识卡片(绿) + 分歧卡片(琥珀) + 综合答案
- ✅ **状态机** — idle→streaming→judging→fusing→complete
- ✅ **进度条条纹动画** — progress-animated 动画效果
- ✅ **设计令牌系统** — rem 单位、4px 粒度、CSS Variables
- ✅ **组件状态完整性** — Hover/Active/Focus/Disabled/Loading
- ✅ **可访问性** — `aria-label`、`focus-visible`、`focus-ring` 类
- ✅ **动效** — 尊重 `prefers-reduced-motion: reduce`

### 启动脚本
- ✅ `ArenaQA-启动.bat` — 四步流程：杀旧进程 → 检查依赖 → 后台启动 → 轮询确认就绪

---

## 待办事项

| 优先级 | 事项 | 备注 |
|--------|------|------|
| 🟡 | **数据持久化** | Schema 已定义 Conversation/Answer/Judge/Fusion 表，API 路由尚未对接 Prisma |
| 🟡 | **历史记录** | 无历史查询/删除 UI |
| 🟡 | **Playwright 集成** | 文件已存在但未接入 |
| 🟢 | **测试** | 零测试文件，无 CI/CD |
| 🟢 | **README** | 缺少项目说明文档 |

---

## 文件索引

| 区域 | 文件 | 说明 |
|------|------|------|
| 设计令牌 | `src/app/globals.css` | CSS Variables 系统 v2.1（rem 单位、玻璃态、focus-ring、动画） |
| 布局 | `src/app/page.tsx` | 三栏布局（border 分隔线） |
| 布局 | `src/app/layout.tsx` | 根布局 + NavBar |
| 导航 | `src/components/shared/NavBar.tsx` | 玻璃态导航栏 v2.1 |
| 输入 | `src/components/InputPanel/index.tsx` | 输入面板 v2.1（间距 + 进度条动画） |
| 回答 | `src/components/AnswerColumns/AnswerColumn.tsx` | 回答列 v2.1（Markdown + 代码块） |
| 回答 | `src/components/AnswerColumns/ColumnLayout.tsx` | 多列布局 |
| 结果 | `src/components/SidePanel/index.tsx` | 结果面板 v2.1（评分 + 融合 + 置信度） |
| 基础 | `src/components/ui/Button.tsx` | 按钮组件 v2.1 |
| 基础 | `src/components/ui/EmptyState.tsx` | 空状态组件 v2.1 |
| 引擎 | `src/lib/task-manager.ts` | 任务管理器 |
| 引擎 | `src/lib/sse-manager.ts` | SSE 事件流 |
| 引擎 | `src/lib/judge.ts` | AI 裁判评分 |
| 引擎 | `src/lib/fusion.ts` | 融合引擎 |
| 引擎 | `src/lib/provider-registry.ts` | Provider 注册中心 |
| 引擎 | `src/lib/providers/` | 各模型接入层 |
| 状态 | `src/stores/chat-store.ts` | Zustand 状态机 |
| 类型 | `src/types/index.ts` | 核心类型定义 |
| 数据 | `prisma/schema.prisma` | 数据库 Schema |
| 脚本 | `ArenaQA-启动.bat` | 四步启动脚本 |

---

## 敏感信息备注

- `.env` 在 `.gitignore` 中，不提交到仓库
- 所有 API Key 值为空，需用户自行配置
- 代码中无硬编码 Key
- 示例文件 `.env.example` 使用 `sk-xxxx` 占位符
