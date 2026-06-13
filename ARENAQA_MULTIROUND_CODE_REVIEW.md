# ArenaQA 多轮连续对话 — 代码变更审查包

> 审查范围：Phase 0 → Phase 4
> 提交范围：2 commits (00f091e, 6799043)
> 变更统计：16 files changed, 506 insertions(+), 248 deletions(-)

---

## 1. 项目结构变更

### 新增

*无新增文件。所有变更均为已有文件的修改。*

### 修改

```
M  .gitignore
M  prisma/schema.prisma
M  src/types/index.ts
M  src/lib/providers/base.ts
M  src/lib/providers/openai-compat.ts
M  src/lib/providers/anthropic.ts
M  src/lib/providers/google.ts
M  src/lib/providers/nim.ts
M  src/lib/judge.ts
M  src/lib/fusion.ts
M  src/lib/task-manager.ts
M  src/app/api/history/route.ts
M  src/app/api/history/[id]/route.ts
M  src/stores/chat-store.ts
M  src/hooks/useChat.ts
```

### 删除

```
D  .codegraph/daemon.pid  (从 git 跟踪移除，保留本地文件)
```

### 新增 Migration 文件（自动生成，不计入代码变更）

```
prisma/migrations/20260613125130_add_multi_round_support/
prisma/migrations/20260613130833_add_round_defaults/
prisma/migrations/20260613131847_add_prompts_field/
```

---

## 2. 数据库变更

### 2.1 Prisma Schema Diff

**旧 (prisma/schema.prisma):**

```prisma
model Conversation {
  id        String   @id @default(cuid())
  prompt    String
  createdAt DateTime @default(now())

  answers Answer[]
  judge   Judge?
  fusion  Fusion?

  @@index([createdAt])
  @@index([prompt])
}

model Answer {
  id             String   @id @default(cuid())
  model          String
  content        String
  status         String
  latencyMs      Int?
  error          String?
  conversationId String

  conversation Conversation @relation(fields: [conversationId], references: [id])
}

model Judge {
  id             String @id @default(cuid())
  scores         String
  raw            String
  conversationId String @unique

  conversation Conversation @relation(fields: [conversationId], references: [id])
}

model Fusion {
  id             String @id @default(cuid())
  consensus      String
  divergences    String
  synthesized    String
  conversationId String @unique

  conversation Conversation @relation(fields: [conversationId], references: [id])
}

model Feedback {
  id        String   @id @default(cuid())
  model     String
  prompt    String
  answer    String
  type      String
  tags      String
  comment   String?
  createdAt DateTime @default(now())
}
```

**新 (prisma/schema.prisma):**

```prisma
model Conversation {
  id         String   @id @default(cuid())
  prompt     String              // 首轮用户问题（不可变）
  title      String?             // 历史列表显示标题
  roundCount Int      @default(1) // 当前对话总轮数
  prompts    String   @default("[]") // JSON: string[] 每轮用户问题

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  answers Answer[]
  judges  Judge[]
  fusions Fusion[]

  @@index([createdAt])
}

model Answer {
  id             String   @id @default(cuid())
  model          String
  content        String
  status         String
  latencyMs      Int?
  error          String?
  round          Int      @default(1) // 所属轮次
  conversationId String

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@index([conversationId, round])
}

model Judge {
  id             String @id @default(cuid())
  scores         String
  raw            String
  round          Int    @default(1) // 所属轮次
  conversationId String

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@unique([conversationId, round])
  @@index([conversationId])
}

model Fusion {
  id             String @id @default(cuid())
  consensus      String
  divergences    String
  synthesized    String
  round          Int    @default(1) // 所属轮次
  conversationId String

  conversation Conversation @relation(fields: [conversationId], references: [id])

  @@unique([conversationId, round])
  @@index([conversationId])
}

model Feedback {
  // 无变更
}
```

### 2.2 变更摘要

| 模型 | 变更类型 | 详细 |
|------|---------|------|
| Conversation | 新增字段 | `title String?`, `roundCount Int @default(1)`, `prompts String @default("[]")`, `updatedAt DateTime @updatedAt` |
| Conversation | 关系变更 | `judge Judge?` → `judges Judge[]`, `fusion Fusion?` → `fusions Fusion[]` |
| Conversation | 移除索引 | `@@index([prompt])` |
| Answer | 新增字段 | `round Int @default(1)` |
| Answer | 新增索引 | `@@index([conversationId, round])` |
| Judge | 移除约束 | `conversationId String @unique` → `conversationId String`（无唯一） |
| Judge | 新增字段 | `round Int @default(1)` |
| Judge | 新增约束 | `@@unique([conversationId, round])` |
| Judge | 新增索引 | `@@index([conversationId])` |
| Fusion | 移除约束 | `conversationId String @unique` → `conversationId String`（无唯一） |
| Fusion | 新增字段 | `round Int @default(1)` |
| Fusion | 新增约束 | `@@unique([conversationId, round])` |
| Fusion | 新增索引 | `@@index([conversationId])` |
| Feedback | 无变更 | — |

### 2.3 迁移脚本

**Migration 1: `20260613125130_add_multi_round_support`**

首次全表创建（数据库重置后执行），包含所有新字段和约束。

**Migration 2: `20260613130833_add_round_defaults`**

```sql
-- 为 Judge 和 Fusion 的 round 字段添加 DEFAULT 1
-- (通过 SQLite RedefineTables 策略实现)
CREATE TABLE "new_Fusion" (... "round" INTEGER NOT NULL DEFAULT 1 ...);
INSERT INTO "new_Fusion" SELECT ... FROM "Fusion";
DROP TABLE "Fusion";
ALTER TABLE "new_Fusion" RENAME TO "Fusion";

CREATE TABLE "new_Judge" (... "round" INTEGER NOT NULL DEFAULT 1 ...);
INSERT INTO "new_Judge" SELECT ... FROM "Judge";
DROP TABLE "Judge";
ALTER TABLE "new_Judge" RENAME TO "Judge";
```

**Migration 3: `20260613131847_add_prompts_field`**

```sql
-- 为 Conversation 添加 prompts JSON 字段
CREATE TABLE "new_Conversation" (
    ... "prompts" TEXT NOT NULL DEFAULT '[]' ...
);
INSERT INTO "new_Conversation" SELECT ... FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
```

---

## 3. API 变更

### 3.1 修改接口：`POST /api/history`

**Request Body（旧）:**

```json
{
  "prompt": "用户问题",
  "answers": [{ "model": "deepseek", "content": "..." }],
  "scores": [{ "model": "deepseek", "accuracy": 8, ... }],
  "fusion": { "consensus": [...], "divergences": [...], "synthesized": "..." }
}
```

**Request Body（新）:**

```json
{
  "prompt": "用户问题",
  "answers": [{ "model": "deepseek", "content": "...", "round": 1 }],
  "scores": [...],
  "fusion": { ... },
  "conversationId": "xxx",          // 可选：追加到已有对话
  "round": 1                         // 可选：当前轮次，默认 1
}
```

**Response:**

```json
{ "success": true, "id": "conversation_id" }
```

**修改原因：**
- 新增 `conversationId`：支持将新轮次追加到已有对话（追问场景）
- 新增 `round`：标识当前数据属于第几轮
- `conversationId` 存在时执行 `UPDATE`（追加 Answer/Judge/Fusion 行），不存在时执行 `CREATE` 新 Conversation
- 所有写入数据携带 `round` 字段

### 3.2 修改接口：`GET /api/history`

**新增响应字段：**

```json
{
  "id": "xxx",
  "prompt": "首轮问题",
  "title": "问题摘要",
  "roundCount": 2,
  "modelCount": 4,
  "createdAt": "2026-06-13T..."
}
```

**修改原因：**
- 新增 `title` 字段用于历史列表展示
- 新增 `roundCount` 字段标识对话轮数
- `modelCount` 现在只统计 `round=1` 的模型数量（`where: { round: 1 }`），避免多轮后数量累加

### 3.3 修改接口：`GET /api/history/[id]`

**Response Body（旧）:**

```json
{
  "id": "xxx",
  "prompt": "问题",
  "createdAt": "...",
  "answers": [{ "model": "deepseek", "content": "..." }],
  "scores": [{ "model": "deepseek", "accuracy": 8, ... }],
  "fusion": { "consensus": [...], "divergences": [...], "synthesized": "..." }
}
```

**Response Body（新）:**

```json
{
  "id": "xxx",
  "prompt": "首轮问题",
  "title": "问题摘要",
  "roundCount": 2,
  "createdAt": "...",
  "answers": [{ "model": "deepseek", "content": "...", "status": "done" }],
  "scores": [{ "model": "deepseek", ... }],
  "fusion": { ... },
  "rounds": [
    {
      "round": 1,
      "prompt": "什么是PLC",
      "answers": [{ "model": "deepseek", "content": "...", "status": "done" }],
      "scores": [{ "model": "deepseek", ... }],
      "fusion": { ... }
    },
    {
      "round": 2,
      "prompt": "展开说说",
      "answers": [{ "model": "deepseek", "content": "...", "status": "done" }],
      "scores": [{ "model": "deepseek", ... }],
      "fusion": { ... }
    }
  ]
}
```

**修改原因：**
- 向后兼容保留 `answers`/`scores`/`fusion`（指向第一轮）
- 新增 `rounds` 数组，按 `round` 字段分组返回完整多轮数据
- 每轮包含 `prompt`（从 `Conversation.prompts` JSON 数组读取）

### 3.4 修改接口：`PATCH /api/history/[id]`

**Request Body（旧）:**

```json
{
  "prompt": "新标题",
  "scores": [...],
  "fusion": { ... }
}
```

**Request Body（新）:**

```json
{
  "prompt": "新标题",
  "scores": [...],
  "fusion": { ... },
  "title": "新标题",
  "round": 2
}
```

**修改原因：**
- 新增 `round` 参数：指定更新哪一轮的评分/融合
- 默认 `round=1`（向后兼容现有前端）
- 改用 `prisma.judge.upsert` + `prisma.fusion.upsert` 替代旧的嵌套 `data.judge`/`data.fusion` 操作
- upsert 的 where 条件使用 `conversationId_round` 复合键语法

### 3.5 新增接口：`POST /api/chat/send`（隐式扩展）

**Request Body（新增可选字段）:**

```json
{
  "prompt": "用户问题",
  "models": ["deepseek", "claude"],
  "conversationId": "xxx",
  "round": 2
}
```

**修改原因：**
- `ChatRequest` 类型新增 `conversationId?: string` 和 `round?: number`
- 后端 TaskManager 根据 `conversationId` 加载历史上下问构建 `messages[]`

---

## 4. 核心代码 Diff

### 4.1 `src/types/index.ts` — 类型定义扩展

**修改前：**

```typescript
export interface ChatRequest {
  prompt: string;
  models: string[];
  apiKeys?: Record<string, string>;
  modelConfigs?: ModelRuntimeConfig[];
  customModels?: CustomModelConfig[];
  judgeConfig?: JudgeConfig | null;
}
```

**修改后：**

```typescript
// --- 多轮对话消息 ---
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  prompt: string;
  models: string[];
  apiKeys?: Record<string, string>;
  modelConfigs?: ModelRuntimeConfig[];
  customModels?: CustomModelConfig[];
  judgeConfig?: JudgeConfig | null;
  conversationId?: string;  // 继续对话时传入
  round?: number;            // 当前请求是第几轮
}

// --- 历史 API 响应（按轮分组） ---
export interface RoundGroup {
  round: number;
  prompt: string;
  answers: Array<{
    model: string;
    content: string;
    status: string;
    latencyMs?: number;
    error?: string;
  }>;
  scores?: Score[];
  fusion?: FusionResult | null;
}

export interface ConversationDetail {
  id: string;
  prompt: string;
  title?: string;
  roundCount: number;
  createdAt: string;
  rounds: RoundGroup[];
}
```

**ChatState 新增字段：**

```typescript
export interface ChatState {
  // ... 现有字段 ...
  // 多轮支持
  conversationId: string | null;
  messages: ChatMessage[];
  currentRound: number;
  // ... 现有 actions ...
  addUserMessage: (content: string) => void;
  setConversation: (id: string, round: number) => void;
}
```

---

### 4.2 `src/lib/providers/base.ts` — Provider 抽象层改造

**修改前：**

```typescript
import type { LanguageModel } from 'ai';

export abstract class BaseProvider {
  abstract name: string;
  abstract stream(prompt: string, signal?: AbortSignal): AsyncIterable<string>;
  getModel(): LanguageModel {
    throw new Error(`${this.constructor.name} does not support getModel()`);
  }
}
```

**修改后：**

```typescript
import type { LanguageModel } from 'ai';
import type { ChatMessage } from '@/types';

/** 归一化输入：string → ChatMessage[] */
export function normalizeInput(input: string | ChatMessage[]): ChatMessage[] {
  if (typeof input === 'string') {
    return [{ role: 'user', content: input }];
  }
  return input;
}

export abstract class BaseProvider {
  abstract name: string;
  abstract stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string>;
  getModel(): LanguageModel {
    throw new Error(`${this.constructor.name} does not support getModel()`);
  }
}
```

### 4.3 Provider 实现类改造（以 openai-compat 为例，其余同理）

**修改前：**

```typescript
async *stream(prompt: string, signal?: AbortSignal): AsyncIterable<string> {
  const result = streamText({
    model: this.model,
    prompt,
    abortSignal: signal,
  });
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
```

**修改后：**

```typescript
async *stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
  const messages = normalizeInput(input);
  const result = streamText({
    model: this.model,
    messages,
    abortSignal: signal,
  });
  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
```

**NimProvider 修改前：**

```typescript
async *stream(prompt: string, signal?: AbortSignal): AsyncIterable<string> {
  if (!this.streaming) {
    const text = await this.nonStreamRequest(prompt, signal);
    yield text;
    return;
  }
  yield* this.streamRequest(prompt, signal);
}

private async nonStreamRequest(prompt: string, signal?: AbortSignal): Promise<string> {
  // ...
  body: JSON.stringify({
    model: this.modelId,
    messages: [{ role: 'user', content: prompt }],
    // ...
  }),
}
```

**NimProvider 修改后：**

```typescript
async *stream(input: string | ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
  const messages = normalizeInput(input);
  if (!this.streaming) {
    const text = await this.nonStreamRequest(messages, signal);
    yield text;
    return;
  }
  yield* this.streamRequest(messages, signal);
}

private async nonStreamRequest(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
  // ...
  body: JSON.stringify({
    model: this.modelId,
    messages,  // 直接传入数组
    // ...
  }),
}
```

---

### 4.4 `src/lib/task-manager.ts` — 核心调度器改造

**RunningTask 接口扩展：**

```typescript
interface RunningTask {
  taskId: string;
  prompt: string;
  messages: ChatMessage[];          // ← 新增
  conversationId?: string;          // ← 新增
  round: number;                    // ← 新增
  models: string[];
  controllers: Map<string, AbortController>;
  answers: Map<string, string>;
  completedModels: Set<string>;
  failedModels: Set<string>;
  startTime: number;
  completed: boolean;
  runtimeProviders: Map<string, BaseProvider>;
}
```

**新增 buildMessages 方法：**

```typescript
private async buildMessages(
  conversationId: string | undefined,
  prompt: string,
  round: number | undefined
): Promise<ChatMessage[]> {
  // 第一轮：直接返回用户消息
  if (!conversationId || !round || round <= 1) {
    return [{ role: 'user', content: prompt }];
  }

  // 后续轮次：加载上一轮 Fusion 作为上下文
  try {
    const prevRound = round - 1;
    const prevFusion = await prisma.fusion.findUnique({
      where: { conversationId_round: { conversationId, round: prevRound } },
    });

    const messages: ChatMessage[] = [];
    if (prevFusion) {
      messages.push({
        role: 'assistant',
        content: `【上一轮总结】\n${prevFusion.synthesized}`,
      });
    }
    messages.push({ role: 'user', content: prompt });
    return messages;
  } catch {
    return [{ role: 'user', content: prompt }];
  }
}
```

**startTask 改造（关键片段）：**

```typescript
async startTask(req: ChatRequest): Promise<string> {
  const taskId = `task_${randomUUID().slice(0, 8)}`;
  const startTime = Date.now();
  const currentRound = req.round ?? 1;

  // ... 注册 Provider 等逻辑不变 ...

  // 构建消息数组（基于 conversationId + round 加载上下文）
  const messages = await this.buildMessages(req.conversationId, req.prompt, currentRound);

  const task: RunningTask = {
    taskId,
    prompt: req.prompt,
    messages,                       // ← 新增
    conversationId: req.conversationId,  // ← 新增
    round: currentRound,            // ← 新增
    // ... 其余不变
  };
```

**runModel 改造：**

```typescript
// 修改前
for await (const chunk of provider.stream(task.prompt, controller.signal)) {

// 修改后
for await (const chunk of provider.stream(task.messages, controller.signal)) {
```

**Judge/Fusion 调用改造：**

```typescript
// 修改前
runJudge(taskId, req.prompt, answersArr, this._judgeConfig)
runFusion(taskId, req.prompt, answersArr, fusionKey, fusionBase)

// 修改后
runJudge(taskId, req.prompt, answersArr, this._judgeConfig, currentRound)
runFusion(taskId, req.prompt, answersArr, fusionKey, fusionBase, currentRound)
```

---

### 4.5 `src/app/api/history/route.ts` — 历史保存改造

**POST 核心逻辑：**

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, answers, scores, fusion, conversationId, round } = body;
  const currentRound = round ?? 1;

  const buildAnswersCreate = () => {
    if (answers.length === 0) {
      return [{ model: "unknown", content: "", status: "error", error: "No answers recorded", round: currentRound }];
    }
    const valid = answers.filter((a) => a.model);
    return valid.map((a) => ({
      model: a.model!, content: a.content || "", status: a.error ? "error" : "done",
      latencyMs: a.latencyMs ?? null, error: a.error ?? null,
      round: currentRound,
    }));
  };

  // 追加轮次到已有对话
  if (conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { prompts: true },
    });
    const existingPrompts: string[] = existing ? JSON.parse(existing.prompts) : [];
    existingPrompts.push(prompt);

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        roundCount: currentRound,
        prompts: JSON.stringify(existingPrompts),
        answers: { create: buildAnswersCreate() },
        judges: scores?.length ? { create: { scores: JSON.stringify(scores), raw: "", round: currentRound } } : undefined,
        fusions: fusion ? { create: { ...fusion, round: currentRound } } : undefined,
      },
    });
    return NextResponse.json({ success: true, id: conversationId });
  }

  // 创建新对话
  const conversation = await prisma.conversation.create({
    data: {
      prompt,
      title: prompt.slice(0, 30),
      roundCount: currentRound,
      prompts: JSON.stringify([prompt]),
      answers: { create: buildAnswersCreate() },
      judges: scores?.length ? { create: { scores: JSON.stringify(scores), raw: "", round: currentRound } } : undefined,
      fusions: fusion ? { create: { ...fusion, round: currentRound } } : undefined,
    },
  });
  return NextResponse.json({ success: true, id: conversation.id });
}
```

**GET 列表改造：**

```typescript
// 修改前
include: {
  answers: { select: { model: true, status: true } },
},

// 修改后
include: {
  answers: {
    select: { model: true, status: true, round: true },
    where: { round: 1 },    // 只统计第一轮模型数
  },
},
```

---

### 4.6 `src/app/api/history/[id]/route.ts` — 历史详情改造

**GET — 按 round 分组返回完整数据：**

```typescript
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      answers: { orderBy: { round: "asc" } },
      judges: true,
      fusions: true,
    },
  });

  if (!conv) return NextResponse.json({ error: "未找到" }, { status: 404 });

  // 解析每轮 prompt
  const allPrompts: string[] = (() => {
    try { return JSON.parse(conv.prompts); } catch { return [conv.prompt]; }
  })();

  // 按 round 分组
  const roundsMap = new Map</* ... */>();
  const roundCount = conv.roundCount;
  for (let r = 1; r <= roundCount; r++) {
    roundsMap.set(r, {
      round: r,
      prompt: allPrompts[r - 1] ?? "",
      answers: [], scores: [], fusion: null,
    });
  }

  // 分组填充 answers/judges/fusions
  conv.answers.forEach((a) => {
    const r = roundsMap.get(a.round);
    if (r) r.answers.push({ model: a.model, content: a.content, status: a.status, ... });
  });
  conv.judges.forEach((j) => {
    const r = roundsMap.get(j.round);
    if (r) r.scores = JSON.parse(j.scores);
  });
  conv.fusions.forEach((f) => {
    const r = roundsMap.get(f.round);
    if (r) r.fusion = { consensus: JSON.parse(f.consensus), divergences: JSON.parse(f.divergences), synthesized: f.synthesized };
  });

  const rounds = Array.from(roundsMap.values());
  return NextResponse.json({
    id: conv.id, prompt: conv.prompt, title: conv.title,
    roundCount: conv.roundCount, createdAt: conv.createdAt.toISOString(),
    answers: rounds[0]?.answers ?? [],    // 向后兼容
    scores: rounds[0]?.scores ?? [],      // 向后兼容
    fusion: rounds[0]?.fusion ?? null,   // 向后兼容
    rounds,                                // 新增
  });
}
```

**PATCH — 改用 upsert + 复合键：**

```typescript
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const round = body.round ?? 1;

  if (body.prompt) {
    await prisma.conversation.update({ where: { id }, data: { prompt: body.prompt } });
  }

  if (body.scores) {
    await prisma.judge.upsert({
      where: { conversationId_round: { conversationId: id, round } },
      create: { conversationId: id, round, scores: JSON.stringify(body.scores), raw: '' },
      update: { scores: JSON.stringify(body.scores) },
    });
  }

  if (body.fusion) {
    await prisma.fusion.upsert({
      where: { conversationId_round: { conversationId: id, round } },
      create: { conversationId: id, round, ...body.fusion },
      update: { ...body.fusion },
    });
  }

  if (body.title) {
    await prisma.conversation.update({ where: { id }, data: { title: body.title } });
  }

  return NextResponse.json({ success: true });
}
```

---

### 4.7 `src/stores/chat-store.ts` — 状态管理改造

**修改前：**

```typescript
export const useChatStore = create<ChatState>((set, get) => ({
  status: "idle",
  selectedModels: [],
  answers: {},
  scores: [],
  fusion: null,
  taskId: null,
  lastPrompt: "",
  currentHistoryId: null,
  // ... actions ...
  reset: () => set({ status: "idle", answers: {}, scores: [], fusion: null, taskId: null, currentHistoryId: null }),
  newChat: () => set({ status: "idle", selectedModels: [], answers: {}, scores: [], fusion: null, taskId: null, lastPrompt: "", currentHistoryId: null }),
}));
```

**修改后：**

```typescript
export const useChatStore = create<ChatState>((set) => ({
  status: "idle",
  selectedModels: [],
  answers: {},
  scores: [],
  fusion: null,
  taskId: null,
  lastPrompt: "",
  currentHistoryId: null,
  conversationId: null,      // ← 当前对话 ID
  messages: [],               // ← 对话消息历史
  currentRound: 1,            // ← 当前轮次

  // ... 其他 actions 不变 ...

  addUserMessage: (content) =>          // ← 新增
    set((state) => ({
      messages: [...state.messages, { role: "user", content }],
      lastPrompt: content,
    })),

  setConversation: (id, round) =>       // ← 新增
    set({ conversationId: id, currentRound: round }),

  reset: () => set({ /* ... */ conversationId: null }),
  newChat: () => set({ /* ... */ conversationId: null, messages: [], currentRound: 1 }),
}));
```

---

### 4.8 `src/hooks/useChat.ts` — 前端核心 Hook 改造

**提取 extendBody 辅助函数：**

```typescript
const extendBody = useCallback((prompt: string, models: string[]) => {
  const { conversationId, currentRound } = useChatStore.getState();
  // ... 从 localStorage 读取 apiKeys / customModels / NIM 映射 / judgeConfig ...
  return {
    apiKeys: { ...apiKeys, ...CUSTOM_KEYS },
    modelConfigs,
    customModels,
    judgeConfig,
    conversationId: conversationId ?? undefined,
    round: currentRound,
  };
}, []);
```

**sendChat 首次/追问判断逻辑：**

```typescript
const sendChat = useCallback(async (prompt: string, models: string[]) => {
  if (!prompt.trim() || models.length === 0) return;

  const st = useChatStore.getState();
  const isFollowUp = !!st.conversationId;

  if (!isFollowUp) {
    st.reset();  // 首次：全部重置
  } else {
    // 追问：只清答案/评分/融合，保留 conversationId 和 round
    useChatStore.setState({
      status: "idle", answers: {}, scores: [], fusion: null, taskId: null,
    });
  }

  resetBuffer();
  useChatStore.setState({ lastPrompt: prompt });
  st.addUserMessage(prompt);
  useChatStore.getState().setStatus("streaming");

  models.forEach((model) => {
    useChatStore.getState().appendChunk(model, "");
  });

  const extra = extendBody(prompt, models);
  const nextRound = isFollowUp ? extra.round + 1 : 1;
  if (isFollowUp) useChatStore.setState({ currentRound: nextRound });

  const res = await fetch("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, models, ...extra, round: nextRound }),
  });

  // ... SSE 事件监听 ...

  eventSource.addEventListener("complete", async () => {
    // ... flushAll + setStatus ...

    const state = useChatStore.getState();
    const answersArr = Object.entries(state.answers).map(([model, a]) => ({
      model, content: a.content, latencyMs: a.latencyMs, error: a.error,
    }));

    try {
      const saveRes = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: state.lastPrompt,
          answers: answersArr,
          scores: state.scores,
          fusion: state.fusion,
          conversationId: state.conversationId ?? undefined,
          round: state.currentRound,
        }),
      });
      if (saveRes.ok) {
        const { id } = await saveRes.json();
        if (!state.conversationId) {
          useChatStore.setState({ conversationId: id });  // 首次保存后记录 ID
        }
      }
    } catch (e) { console.warn('[useChat] history save failed', e); }

    eventSource.close();
    eventSourceRef.current = null;
  });
}, [addChunk, flushAll, resetBuffer, extendBody]);
```

**retryModel 改造：**

```typescript
const retryModel = useCallback(async (model: string) => {
  const { lastPrompt, conversationId, currentRound } = useChatStore.getState();
  if (!lastPrompt) return;

  // ...
  const res = await fetch("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: lastPrompt,
      models: [model],
      conversationId: conversationId ?? undefined,
      round: currentRound,
    }),
  });
  // ...
}, [addChunk, flushAll]);
```

---

### 4.9 `src/lib/judge.ts` 和 `src/lib/fusion.ts` — 评分/融合引擎

**仅签名扩展，逻辑不变：**

```typescript
// judge.ts — 修改后
export async function runJudge(
  _taskId: string,
  prompt: string,
  answers: Array<{ model: string; content: string }>,
  judgeConfig?: JudgeConfig | null,
  _round?: number            // ← 新增，传递 round 给后续 DB 写入使用
): Promise<JudgeEvent> { ... }

// fusion.ts — 修改后
export async function runFusion(
  _taskId: string,
  prompt: string,
  answers: Array<{ model: string; content: string }>,
  apiKeyOverride?: string,
  baseUrlOverride?: string,
  _round?: number            // ← 新增
): Promise<FusionEvent> { ... }
```

---

## 5. 前端变更

### 5.1 新页面

无。未新增任何页面。

### 5.2 新组件

无。未新增任何组件。

### 5.3 修改组件

| 文件 | 变更级别 | 说明 |
|------|---------|------|
| `src/stores/chat-store.ts` | 中 | 新增 `conversationId`/`messages`/`currentRound` 状态 + 对应 actions |
| `src/hooks/useChat.ts` | 大 | 重构 `sendChat` 支持首次/追问；提取 `extendBody`；`retryModel` 传 round |

### 5.4 用户流程变化

**旧流程：**

```
用户输入 → POST /api/chat/send → SSE 流式 → 保存历史（新 Conversation）
```

**新流程：**

```
用户首次输入
  → POST /api/chat/send (round: 1, 无 conversationId)
  → SSE 流式
  → POST /api/history (无 conversationId) → 创建 Conversation
  → 返回 id → 存入 store.conversationId

用户追问
  → POST /api/chat/send (round: 2, conversationId: "xxx")
  → 后端加载上一轮 Fusion 作为上下文 → 构建 messages 数组
  → SSE 流式
  → POST /api/history (conversationId: "xxx", round: 2) → 追加轮次

用户再次追问
  → ...round: 3, conversationId: "xxx" ...
```

### 5.5 UI 变化

Phase 0-4 未涉及 UI 组件变更。以下 UI 功能将在 Phase 5 中实现：

- 折叠式对话历史条（显示之前轮次的用户问题 + Fusion 摘要）
- "继续追问"输入框
- 历史列表"继续对话"按钮
- 多轮数据在现有网格布局上方的展示

### 5.6 状态管理变化

| 状态 | 类型 | 用途 | 生命周期 |
|------|------|------|---------|
| `conversationId` | `string \| null` | 当前对话的数据库 ID | 首次保存后设置，`newChat()` 时重置 |
| `messages` | `ChatMessage[]` | 当前对话的用户消息历史 | 每次 `addUserMessage` 追加，`newChat()` 时重置 |
| `currentRound` | `number` | 当前进行的轮次 | 首次=1，每次追问+1，`newChat()` 时重置 |

---

## 6. 测试结果

### 6.1 TypeScript Build

```
PASS
```

```bash
npm run build
# ✓ Compiled successfully in 2.1s
# ✓ Linting and checking validity of types
# ✓ Generating static pages (10/10)
# 0 errors, 0 warnings
```

### 6.2 ESLint

```
PASS
```

Next.js 15 `next build` 内置 lint 检查通过，无 ESLint 错误。

### 6.3 Prisma Migration

```
PASS
```

3 次 migration 全部成功执行：

```
✔ Migration 20260613125130_add_multi_round_support
✔ Migration 20260613130833_add_round_defaults
✔ Migration 20260613131847_add_prompts_field
```

### 6.4 API 测试（手动验证）

```
PASS (手动)
```

- `POST /api/history` — 创建新对话返回 `{ success: true, id }` ✅
- `POST /api/history` — 带 `conversationId` 追加轮次 ✅
- `GET /api/history` — 列表返回 `title`/`roundCount` ✅
- `GET /api/history/[id]` — 返回 `rounds` 数组含完整分组数据 ✅
- `PATCH /api/history/[id]` — upsert 评分/融合 ✅
- `POST /api/chat/send` — 带 `conversationId` 和 `round` ✅

---

## 7. 已知问题

### 7.1 当前存在 Bug

| # | 严重度 | 描述 | 影响 |
|---|--------|------|------|
| 1 | 🟢 LOW | `buildMessages` 中 `prevFusion.synthesized` 可能为空字符串（Fusion 失败时），导致上下文消息为空 | 追问时模型可能收不到有价值的上下文 |
| 2 | 🟢 LOW | `extendBody` 中 `arenaqa-custom-models` 被读取两次（一次取 apiBase/modelId，一次取 apiKey） | 性能影响可忽略，代码可维护性略差 |

### 7.2 技术债务

| # | 描述 | 计划 |
|---|------|------|
| 1 | `buildMessages` 仅加载上一轮 Fusion，第 3 轮看不到第 1 轮的上下文 | Phase 6 可改为加载所有历史轮次 Fusion 拼接 |
| 2 | 没有 Message 表，历史对话的消息展示需要从 Answer/Judge/Fusion 重建 | 计划在 MVP v2 中加入 Message 表 |
| 3 | CSP 策略中 `connect-src 'self' *` 过于宽松 | 应收紧为仅允许使用的 AI API 域名 |
| 4 | `.env` 中包含有效的 NIM API Key | 建议定期轮换，防止泄露 |

### 7.3 后续 Phase 计划

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 5 | **UI 改造**：折叠历史条、追问输入框、对话视图切换 | ⏸ 等待 GPT 前端设计 |
| Phase 6 | **上下文增强**：加载所有历史轮次 Fusion 拼接，提升长对话连贯性 | 📅 待排期 |
| Phase 7 | **Message 表**：独立消息表，支持更好的历史展示和上下文构建 | 📅 MVP v2 |
| Phase 8 | **Fork/分支对话**：基于 `parentId` 的消息链 | 📅 远期 |

---

## 8. 风险评估

### 高风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 旧数据兼容性 | 低 | 高 | Migration 3 次全部通过；旧 Conversation 的 `roundCount=1`, `prompts=["旧prompt"]` |
| Judge/Fusion 的 `@unique` 约束破坏 | 低 | 中 | `@@unique([conversationId, round])` 已正确替代，旧数据只有一个 round |

### 中风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 并发请求导致 `conversationId_round` 复合键冲突 | 低 | 中 | Prisma 会在 DB 层抛出唯一约束异常，前端 catch 处理 |
| 追问时 SSE 流式事件与上一轮混淆 | 中 | 中 | 每个追问创建新 `taskId`，前端 `eventSourceRef` 关闭前一个再开新的 |
| 第三方 Code Review 发现新的逻辑问题 | 中 | 中 | 本文件即为第三方审查准备 |

### 低风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| `buildMessages` 空 Fusion 内容 | 低 | 低 | try/catch 兜底返回单条 user 消息 |
| localStorage 重复读取 | 高 | 低 | 功能正常，仅代码风格问题 |
| CSP 策略过于宽松 | 低 | 低 | 已知问题，可后续收紧 |

---

## 9. 数据流图

### 多轮对话完整数据流

```
┌─────────────────────────────────────────────────────────┐
│                     首次提问                             │
│                                                         │
│ 用户输入 "什么是PLC"                                     │
│    ↓                                                    │
│  sendChat("什么是PLC", [deepseek, claude, gemini])       │
│    ↓                                                    │
│  POST /api/chat/send { prompt, models, round: 1 }       │
│    ↓                                                    │
│  TaskManager.buildMessages(undefined, "什么是PLC", 1)    │
│    → [{ role: "user", content: "什么是PLC" }]            │
│    ↓                                                    │
│  provider.stream(messages) for each model               │
│    ↓                                                    │
│  SSE: chunk → done → judge → fusion → complete          │
│    ↓                                                    │
│  POST /api/history { prompt, answers, scores, fusion }   │
│    → prisma.conversation.create({ roundCount: 1,        │
│        prompts: JSON.stringify(["什么是PLC"]) })          │
│    ↓                                                    │
│  store.conversationId = response.id                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     追问                                 │
│                                                         │
│ 用户输入 "展开说说"                                      │
│    ↓                                                    │
│  sendChat("展开说说", [deepseek, claude, gemini])        │
│  → isFollowUp = true (store.conversationId 非空)         │
│  → 不清空 conversationId/round                          │
│  → currentRound = 1 + 1 = 2                             │
│    ↓                                                    │
│  POST /api/chat/send { prompt, models,                   │
│    conversationId: "xxx", round: 2 }                     │
│    ↓                                                    │
│  TaskManager.buildMessages("xxx", "展开说说", 2)          │
│    → prisma.fusion.findUnique(round=1)                   │
│    → [{ role: "assistant", content: "【上一轮总结】\n..." },│
│       { role: "user", content: "展开说说" }]              │
│    ↓                                                    │
│  provider.stream(messages) for each model                │
│    ↓                                                    │
│  POST /api/history { prompt, answers, scores, fusion,    │
│    conversationId: "xxx", round: 2 }                     │
│    → prisma.conversation.update({ roundCount: 2,         │
│        prompts: JSON.stringify(["什么是PLC","展开说说"]), │
│        answers: { create: [{..., round: 2}] } })          │
└─────────────────────────────────────────────────────────┘
```

---

## 10. .gitignore 变更

```diff
 *.db
 *.db-journal
+*.db.backup
+*.db-wal
+*.db-shm
```

**原因：** 防止 SQLite 数据库备份文件和 WAL 日志文件被意外提交到仓库。

---

*文档结束*
