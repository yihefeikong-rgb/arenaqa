# ArenaQA — AI 问答竞技场 · 智能体交接文档

> **最后更新：** 2026-06-08  
> **版本：** 0.1.2  
> **当前分支：** `master`  
> **远程仓库：** `https://github.com/yihefeikong-rgb/arenaqa.git`  
> **最近提交：** `85664a1`

---

## 项目简介

开源、自托管的个人 AI 问答工作台。并发对比多个大模型（DeepSeek / Qwen / Claude / Gemini），AI 裁判自动对回答进行 5 维评分（准确/完整/可操作/安全），并通过融合引擎提取共识与分歧，生成综合答案。

---

## 快速启动

### 方式一：双击脚本
直接双击项目根目录的 `ArenaQA-启动.bat`，脚本会：
1. 检查端口 3000 占用并杀掉旧进程
2. 检查 node_modules 依赖
3. 清理缓存并后台启动 `npm run dev`
4. 轮询等待服务器就绪（最多 60 秒）

### 方式二：手动启动
```bash
cd /d "D:\claude code xiangmu\并发AI问答"
npm run dev
# 浏览器打开 http://localhost:3000
```

---

## 项目架构

```
src/
  app/
    page.tsx              # 主工作台：三栏可拖拽布局
    layout.tsx             # 根布局 + NavBar + Provider 初始化
    globals.css            # 设计令牌系统 v2.1（rem 单位，CSS Variables）
    api/chat/send/         # 发送消息 API
    api/chat/stream/[id]/  # SSE 流式 API
    api/chat/abort/[id]/   # 中止 API
    api/config/            # 配置 API
    api/models/            # 模型列表 API
  components/
    shared/NavBar.tsx      # 玻璃态导航栏
    InputPanel/index.tsx   # 输入面板（模型选择 + 提问）
    AnswerColumns/         # 多列回答区
      AnswerColumn.tsx     # 单列回答（Markdown + 代码块 + 点赞/踩）
      ColumnLayout.tsx     # 多列布局
    SidePanel/index.tsx    # 结果面板（评分 + 融合 + 置信度）
    ui/
      Button.tsx           # 按钮组件
      EmptyState.tsx       # 空状态组件
  lib/
    provider-registry.ts   # Provider 注册中心
    task-manager.ts        # 任务管理器
    sse-manager.ts         # SSE 事件流
    judge.ts               # AI 裁判评分
    fusion.ts              # 融合引擎
    providers/             # 各模型接入层
  stores/
    chat-store.ts          # Zustand 状态机
  types/
    index.ts               # 核心类型定义
prisma/
  schema.prisma            # 数据库 Schema（待对接）
```

---

## 当前状态

### ✅ 已完成

| 模块 | 状态 | 说明 |
|------|------|------|
| Provider 注册中心 | ✅ | 从环境变量自动读取 Key |
| SSE 全链路 | ✅ | send → stream → abort |
| AI 裁判评分 | ✅ | 5 维评分，无 Key 降级 |
| 融合引擎 | ✅ | 共识提取 + 分歧标注 + 综合答案 |
| 三栏拖拽布局 | ✅ | 左 22% / 中 53% / 右 25% |
| 深色模式 | ✅ | CSS 变量 + localStorage 持久化 |
| 玻璃态导航栏 | ✅ | backdrop-filter blur |
| 设计令牌系统 | ✅ | rem 单位、4px 粒度、CSS Variables |
| 可访问性 | ✅ | aria-label、focus-ring、focus-visible |
| 启动脚本 | ✅ | 四步流程 |

### 🟡 待办（按优先级）

1. **数据持久化** — `prisma/schema.prisma` 已定义 Conversation / Answer / Judge / Fusion 表，API 路由尚未对接 Prisma
2. **历史记录** — 无历史查询/删除 UI
3. **Playwright 集成** — `src/lib/providers/playwright.ts` 文件已存在但未接入
4. **测试** — 零测试文件，无 CI/CD
5. **README** — 缺少项目说明文档

---

## 关键注意事项

### ⚠️ write_file 工具路径问题
`write_file` 用绝对路径（如 `/d/claude code xiangmu/...`）时会写入**嵌套目录**：
```
D:\...\d\claude code xiangmu\并发AI问答\src\...  ← 错误！
```
必须使用**相对路径**才能写入真实源代码位置：
```
src/components/InputPanel/index.tsx               ← 正确！
```

### 环境变量
- `.env` 文件在 `.gitignore` 中，不提交到仓库
- 所有 API Key 值为空，需要用户手动配置：
  - `DEEPSEEK_API_KEY` — DeepSeek
  - `QWEN_API_KEY` — 通义千问
  - `ANTHROPIC_API_KEY` — Claude
  - `GEMINI_API_KEY` — Gemini
  - `OPENAI_API_KEY` — 裁判模型（GPT-4o）

### 设计规范参考
UI 设计规范文件位于：
```
C:\Users\huangxinyang\Desktop\frontend-ui-design-system.md
```
包含：色彩系统、间距系统（4px 粒度）、字体（rem）、阴影层级、组件规范、响应式断点、可访问性、动效规范。

### 安全
- 代码中无硬编码 API Key
- git 历史无 Key 泄露
- `.env` 不跟踪

---

## Git 提交历史

```
85664a1 fix: ArenaQA-启动.bat UTF-8 编码修复 + docs: 项目状态文档
a22c9a4 style: 前端 UI 全面升级至 v2.1 — 对齐生产级设计系统规范
0292e04 docs: 添加 UI 设计参考文档
665e914 chore: 添加 ArenaQA 启动脚本
9e96cd8 🎨 前端设计系统对齐 frontend-ui-design-system.md v1.0
3f66dee 💄 全面优化前端 UI
91ee9c2 🏗️ Phase 2: 实现 Provider 注册 + 裁判评分 + 融合引擎
91684ed 🎉 初始化 ArenaQA 项目骨架
```
