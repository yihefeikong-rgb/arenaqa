# ArenaQA 全面审查计划 (P0)

> 在空会话中 load 此文件，逐项审查。
> 备份仓库已在：`D:\claude code xiangmu\并发AI问答-BACKUP-2026-06-10`

---

## P0 — 评分不显示（历史会话评分）

**现象：** `/api/judge` 返回了 6 个评分，`[judge] parsed 6 scores` 日志确认，但前端右侧面板不显示。

**审查链路：**
- [ ] `page.tsx:30` `const scores = useChatStore((s) => s.scores)` — Zustand selector 是否能响应 setState
- [ ] `page.tsx:62` `const hasResults = scores.length > 0` — 是否存在 stale closure
- [ ] `HistoryList.tsx:80` `useChatStore.setState({ scores: data.scores || [] })` — 历史加载时 scores 是否真的被设置
- [ ] `page.tsx:230` `useChatStore.setState({ scores: data.scores, fusion: data.fusion })` — 重新评分后 scores 是否设置成功
- [ ] Zustand `setState` 在 async callback 中调用，React 是否 batch 更新
- [ ] 浏览器 Network tab 看 `/api/judge` 的 response body 到底返回了什么
- [ ] 如果 `data.scores` 长度为 0，检查 `runJudge` 返回了什么
- [ ] 如果 scores 有值但 ScoreCard 不渲染 → 检查 `ScoreCard` 组件的 key 和 props

---

## P0 — 计划与架构审计

### 1. 项目结构
- [ ] `src/app/` 路由是否合理（API 和页面是否清晰分离）
- [ ] `src/lib/` 模块边界是否清晰（judge / fusion / sse-manager / task-manager）
- [ ] `src/stores/` 该不该拆成多个 store
- [ ] 类型定义 `src/types/index.ts` 是否集中、完整

### 2. 数据流
- [ ] SSE 事件 → Zustand → React 渲染链路是否完整、无中断
- [ ] 历史加载：`HistoryList.loadDetail()` → `store.reset()` → `setState()` 是否有竞态
- [ ] `scores`、`fusion` 是否在 `reset()` 中被正确清除
- [ ] `currentHistoryId` 的读写是否安全

### 3. 状态管理
- [ ] Zustand 的 `setState` 和 `set()` 混用是否有意外覆盖
- [ ] 哪些 selector 订阅了太多 state，导致不必要的 re-render
- [ ] `useChatStore` 是不是该拆成 `chatStore` + `uiStore`

---

## P1 — 错误处理审计

### 1. 静默 catch
- [ ] `useChat.ts:248` `catch { // ignore }` — abort 失败不应该忽略
- [ ] `useChat.ts:199` `.catch(() => {})` — history save 失败应该有 log
- [ ] `HistoryList.tsx:87` `catch { // ignore }`
- [ ] `page.tsx` 重新评分按钮的 catch
- [ ] 所有 `fetch().catch(() => {})` — 至少应该有 console.warn

### 2. API 参数验证
- [ ] `POST /api/chat/send` — 检查 prompt 长度、模型数量限制
- [ ] `POST /api/history` — 检查 answers 完整性
- [ ] `POST /api/judge` — 检查 prompt 和 answers
- [ ] `POST /api/chat/stop/[taskId]` — 检查 model 参数

### 3. 超时
- [ ] `runFusion` 没有超时保护（目前 `/api/judge` 给了 30s 但 `task-manager.ts` 里没有）
- [ ] `runJudge` 调用外部 API 没有超时
- [ ] 流式响应如果中途断连，任务是否正确清理

---

## P1 — API 端点审计

### 1. 端点清单
- [ ] `GET /api/models` — 模型列表
- [ ] `POST /api/chat/send` — 发消息
- [ ] `GET /api/chat/stream/[taskId]` — SSE 流式
- [ ] `POST /api/chat/abort/[taskId]` — 全停
- [ ] `POST /api/chat/stop/[taskId]` — 单模型停
- [ ] `GET/POST/PATCH/DELETE /api/history` — 历史 CRUD
- [ ] `GET /api/history/[id]` — 历史详情
- [ ] `POST /api/feedback` — 反馈
- [ ] `POST /api/judge` — 重新评分
- [ ] `GET/PUT /api/config` — 配置

### 2. 数据库操作
- [ ] Prisma create/update 是否做了错误处理
- [ ] judge/fusion upsert 逻辑是否正确（消除重复评分）
- [ ] 历史删除是否级联删除了 answers / judge / fusion

---

## P2 — 性能审计

### 1. 组件渲染
- [ ] `AnswerColumn` 使用 `useChatStore((s) => s.answers[model])` — selector 粒度
- [ ] `page.tsx` 的 `scores` 和 `fusion` selector 如果变化频繁
- [ ] `React.memo` 在 MarkdownRenderer 上的效果（content 字符串比较）

### 2. 网络
- [ ] 6 个模型并发流式时的带宽和连接数
- [ ] SSE disconnect/reconnect 是否做了退避
- [ ] `/api/judge` 调用 DeepSeek 的响应时间

---

## P2 — UI/UX 审计

- [ ] 移动端 `MobileNav` 的 tab 切换是否丢失滚动位置
- [ ] 暗色模式的对比度是否足够（文本 vs 背景）
- [ ] `max-h-[400px]` 在小屏上是否太大
- [ ] 停止按钮在小尺寸窗口上是否可点击
- [ ] 历史详情加载的 loading 状态
- [ ] 空状态提示

---

## P2 — 安全审计

- [ ] `.env` 在 `.gitignore` 中 — ✅ 已确认
- [ ] API Key 通过 localStorage 管理，XSS 风险
- [ ] NIM_API_KEY 在 `.env` 中明文存储
- [ ] API 没有认证/鉴权（作为本地工具是可接受的风险）
- [ ] CPU/GPU 注入点（`require`、`eval`、`exec`）— 搜索整个项目

---

## 审查方法

```
1. 打开项目仓库 D:\claude code xiangmu\并发AI问答
2. 新建空会话
3. 逐项检查每个文件的对应行号
4. 高严重性问题修完一个标记一个
5. 修完后提交，确保备份可用
```

## 紧急修复（先做）

1. P0 评分不显示 — 加浏览器 console.log + 检查 Zustand state 变更
2. P1 所有静默 catch 加 console.warn / console.error
3. P2 ScoreCard 加 fallback UI
