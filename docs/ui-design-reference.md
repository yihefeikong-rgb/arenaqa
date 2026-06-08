# ArenaQA — 前端 UI 设计参考文档

> 本文档用于将 ArenaQA 项目的完整 UI 设计系统传达给设计师或 AI 生图工具（如 GPT-4o/DALL·E/Midjourney），以便生成精准的界面参考图。
>
> 每章末尾附有一段 **Prompt，可直接复制给 AI 生图工具**。

---

## 目录

- [一、色彩系统与设计令牌](#一色彩系统与设计令牌)
- [二、整体布局——三栏可拖拽工作台](#二整体布局三栏可拖拽工作台)
- [三、左侧输入面板——InputPanel](#三左侧输入面板inputpanel)
- [四、中间回答列——AnswerColumn × ColumnLayout](#四中间回答列answercolumn--columnlayout)
- [五、右侧结果摘要——SidePanel](#五右侧结果摘要sidepanel)
- [六、标准化基础组件——Button / EmptyState](#六标准化基础组件button--emptystate)
- [七、导航栏与深色模式——NavBar](#七导航栏与深色模式navbar)

---

## 一、色彩系统与设计令牌

### 1.1 主色板

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-primary` | `#2563EB` | 主色蓝，按钮、链接、激活态 |
| `--color-primary-hover` | `#1D4ED8` | 主色 hover 加深 |
| `--color-primary-active` | `#1E40AF` | 主色 active 按压 |
| `--color-primary-light` | `#DBEAFE` | 主色浅色背景，图标容器 |

### 1.2 功能色

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-success` | `#10B981` | 绿色，完成状态 |
| `--color-warning` | `#F59E0B` | 琥珀色，警告 |
| `--color-error` | `#EF4444` | 红色，错误 |
| `--color-info` | `#3B82F6` | 蓝色，信息 |

### 1.3 中性色（浅色模式）

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--color-text-primary` | `#111827` | 主标题文字 |
| `--color-text-body` | `#374151` | 正文 |
| `--color-text-secondary` | `#6B7280` | 次要说明文字 |
| `--color-text-disabled` | `#9CA3AF` | 禁用状态文字 |
| `--color-border` | `#E5E7EB` | 分割线、卡片边框 |
| `--color-bg` | `#F3F4F6` | 页面/面板背景 |
| `--color-surface` | `#FFFFFF` | 卡片/内容区表面 |

### 1.4 中性色（深色模式）

| 令牌 | 浅色值 | 深色值 |
|------|--------|--------|
| `--color-text-primary` | `#111827` | `#F9FAFB` |
| `--color-text-body` | `#374151` | `#E5E7EB` |
| `--color-text-secondary` | `#6B7280` | `#9CA3AF` |
| `--color-text-disabled` | `#9CA3AF` | `#6B7280` |
| `--color-bg` | `#F3F4F6` | `#111827` |
| `--color-surface` | `#FFFFFF` | `#1F2937` |
| `--color-border` | `#E5E7EB` | `#374151` |
| `--color-primary-light` | `#DBEAFE` | `#1E3A5F` |

### 1.5 字体排版

| 令牌 | 字号 | 行高 | 用途 |
|------|------|------|------|
| `--font-display` | 36px | 1.2 | 大标题展示 |
| `--font-h1` | 28px | 1.3 | 一级标题 |
| `--font-h2` | 22px | 1.4 | 二级标题 |
| `--font-h3` | 18px | 1.5 | 卡片标题、面板标题 |
| `--font-body` | 14px | 1.6 | 正文、按钮文字 |
| `--font-small` | 12px | 1.5 | 标签、辅助文字 |
| `--font-caption` | 11px | 1.4 | 极小说明、时间戳 |

字体栈：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`

### 1.6 间距系统（4px 基础单位）

| 令牌 | 值 |
|------|-----|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |

### 1.7 阴影层级

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,0.05)` | 卡片微阴影 |
| `--shadow-2` | `0 4px 6px rgba(0,0,0,0.07)` | 下拉面板 |
| `--shadow-3` | `0 10px 15px rgba(0,0,0,0.1)` | 弹窗 |
| `--shadow-4` | `0 20px 25px rgba(0,0,0,0.15)` | 最高层级 |

### 1.8 圆角

| 令牌 | 值 | 用途 |
|------|-----|------|
| `--radius-sm` | 4px | 按钮、内联代码 |
| `--radius-default` | 8px | 卡片、输入框、面板 |
| `--radius-lg` | 12px | 弹窗、大卡片 |
| `--radius-pill` | 9999px | 标签、徽章 |

### 1.9 动效

- 默认过渡：`150ms ease-out`
- 评分条动画：`500ms ease-out`
- 淡入动画（`animate-fade-in`）：`0.4s ease-out`，从 `opacity:0 translateY(8px)` → `opacity:1 translateY(0)`
- 上滑动画（`animate-slide-up`）：同上
- 尊重 `prefers-reduced-motion: reduce`：所有动画/过渡降为 0.01ms
- `focus-visible` 环：`2px solid #2563EB`，`outline-offset: 2px`
- 滚动条：6px 宽，track 透明，thumb 使用 `--color-border`，hover 变为 `--color-text-disabled`

### 1.10 模型标识色

| 模型 | 标识色 | 渐变背景 |
|------|--------|----------|
| DeepSeek | `#2563EB` 蓝 | `from-blue-600 to-cyan-600` |
| 通义千问 | `#7C3AED` 紫 | `from-purple-600 to-pink-600` |
| Claude | `#F59E0B` 琥珀 | `from-amber-500 to-orange-600` |
| Gemini | `#10B981` 绿 | `from-green-500 to-emerald-600` |

---

> **🎨 Prompt 给 AI 生图（章节一）**
>
> 生成一张 ArenaQA UI 设计系统的色彩令牌和排版展示图。展示以下内容：
> 1. 主色板：主色 #2563EB、hover #1D4ED8、active #1E40AF、浅色背景 #DBEAFE
> 2. 功能色：成功 #10B981、警告 #F59E0B、错误 #EF4444、信息 #3B82F6
> 3. 中性色（浅色）并列深色模式：文字主/正/次/禁用、边框、背景、表面各 7 对
> 4. 字号阶梯：36px Display → 28px H1 → 22px H2 → 18px H3 → 14px Body → 12px Small → 11px Caption，用实际中文示例
> 5. 4 级阴影示例（浅色卡片背景上）
> 6. 4 种模型标识色方块：蓝/紫/琥珀/绿，带标签
> 风格：干净的 Figma 风格设计令牌页，浅色背景，中英双语标签。

---

## 二、整体布局——三栏可拖拽工作台

### 2.1 布局结构

```
┌──────────────────────────────────────────────────────────────────┐
│  NavBar (48px)                                                    │
├────────┬─────────────────────────────────┬───────────────────────┤
│        │                                 │                       │
│  Input │   AnswerColumns                 │   SidePanel           │
│  Panel │   (多列回答，每列可再次拖拽)      │   (评分 + 融合)       │
│        │                                 │                       │
│  20%   │           55%                   │        25%            │
│        │                                 │                       │
│ min15% │         min30%                  │      min15%           │
│ max35% │                                 │      max40%           │
│        │                                 │                       │
└────────┴─────────────────────────────────┴───────────────────────┘
```

### 2.2 关键参数

- **NavBar 高度**：48px（`h-12`）
- **主工作区高度**：`calc(100vh - 48px)`，充满剩余视口
- **三栏比例**：左 20% / 中 55% / 右 25%（默认），均可拖拽调宽
- **分割条**：3px 宽，hover 时背景变蓝半透明（`rgba(37,99,235,0.3)`），active 时加深（`rgba(37,99,235,0.5)`）
- **面板背景**：`--color-surface` (#FFFFFF / 深色 #1F2937)
- **面板边框**：`--color-border` (#E5E7EB / 深色 #374151)

### 2.3 体验要点

- 三栏各自独立滚动（overflow-y-auto）
- 布局通过 `react-resizable-panels` 实现，支持 `autoSaveId` 持久化用户调整
- 所有面板高度撑满容器（`h-full`）
- 中间多列回答区内部再次使用 `PanelGroup` 实现子列拖拽

---

> **🎨 Prompt 给 AI 生图（章节二）**
>
> 生成一张 ArenaQA 三栏布局的整体截图（浅色模式）。展示：
> 1. 顶栏 NavBar 48px 高，含 AQ 渐变标识 + "ArenaQA" 标题 + "AI 问答竞技场" 副标题 + 右侧 SpecForge 链接 + 深色模式按钮
> 2. 三栏可拖拽布局：左栏 20% 宽度含模型选择和问题输入、中栏 55% 显示两个模型答案列（带模型标识色列头 + Markdown 回答内容）、右栏 25% 显示评分卡片和综合答案
> 3. 分割条 3px 细线，hover 时变蓝
> 4. 整体风格干净、现代，使用 #2563EB 为主色，字体使用系统默认无衬线
> 5. 布局已有一个已完成的问答结果展示

---

## 三、左侧输入面板——InputPanel

### 3.1 面板结构（从上到下）

```
┌─────────────────────────┐
│ 标题区                    │
│ ┌─┐                      │
│ │AQ│  AI 问答竞技场       │
│ └─┘  多模型并发对比·AI评分  │
├─────────────────────────┤
│ 模型选择（滚动区）          │
│                          │
│ ┌─ 选择模型 ──── 2/4 ──┐ │
│                          │
│ [✓ DeepSeek V3]  蓝色渐变│  ← 选中态
│ [  通义千问    ]  灰色   │  ← 未选中态
│ [  Claude 4    ]  灰色   │
│ [✓ Gemini 2.5 ]  绿色渐变│  ← 选中态
│                          │
│ ── 你的问题 ──────────── │
│                          │
│ ┌──────────────────────┐ │
│ │ textarea 输入区       │ │
│ │ 5行高, placeholder    │ │
│ │ "输入你的问题…"       │ │
│ └──────────────────────┘ │
│ Enter发送·Shift+Enter换行 │
├─────────────────────────┤
│ 底部固定区                │
│ [═══════════░░░] 2/4    │  ← 进度条（仅流式时显示）
│                          │
│ [ === 发送提问 === ]     │  ← 全宽 Button primary
│                          │
│ ✓ 回答完成，可继续提问    │  ← 完成状态（仅完成时显示）
└─────────────────────────┘
```

### 3.2 标题区

- padding: `px-5 pt-5 pb-3`
- 品牌标识：28×28px（`w-7 h-7`），圆角 `rounded-lg`，背景渐变色 `from-blue-600 to-purple-600`
- 标题文字：`--font-h3`（18px），`font-semibold`，`--color-text-primary`
- 副标题文字：`--font-caption`（11px），`--color-text-secondary`
- 底部分割线：`border-b border-[--color-border]`

### 3.3 模型选择区

- 组容器：`role="group" aria-label="选择模型"`
- 标签行：`--font-small`（12px），`font-semibold`，`uppercase tracking-wider`
- 计数：右侧显示 `selected.size / total`
- 每个模型按钮：
  - 布局：`flex items-center gap-3 px-3 py-2.5`，`rounded-[--radius-default]`
  - **选中态**：`bg-gradient-to-r from-{color}-600 to-{color}-600`（如 DeepSeek 为 `from-blue-600 to-cyan-600`），文字白色，`shadow-[--shadow-1]`，右侧显示勾选图标（`<polyline points="20 6 9 17 4 12" />`）
  - **未选中态**：`bg-[--color-bg]` 灰色背景，`text-[--color-text-secondary]` 灰色文字，hover 时变 `hover:bg-[--color-border]`
  - **禁用态**：`opacity-40 cursor-not-allowed`
  - 过渡：`transition-all duration-150 ease-out`
  - ARIA：`role="checkbox" aria-checked={isOn}`
  - SVG 图标：每个模型 18×18px，颜色使用对应的模型标识色

### 3.4 问题输入区

- textarea：5 行高（`rows={5}`），`resize-none`
- 圆角：`rounded-[--radius-default]`（8px）
- 边框：`border border-[--color-border]`
- 背景：`bg-[--color-bg]` 灰色
- padding：`p-3.5`
- 字号：`--font-body`（14px）
- 文字颜色：`text-[--color-text-primary]`
- placeholder 颜色：`placeholder:text-[--color-text-disabled]`
- **focus 态**：`focus:outline-none focus:border-[--color-primary] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]`
- 底部提示文案：`--font-caption`，`--color-text-secondary`

### 3.5 底部固定区

- padding：`px-5 pb-5 pt-1`

**进度条（流式时显示）：**
- `role="progressbar"`，显示"接收回答中..." / "裁判评分中..." / "融合生成中..."
- 进度数字：`doneModels / totalModels`
- 轨道：`h-1.5 rounded-full bg-[--color-border]`
- 填充：渐变 `from-[--color-primary] to-purple-600`，宽度动态，`transition-all duration-500 ease-out`

**发送按钮：**
- 使用 `Button` 组件，`variant="primary" size="md"`，`w-full`
- 图标：右侧斜上箭头发送图标（`<line x1="22" y1="2" x2="11" y2="13" />` + `<polygon points="22 2 15 22 11 13 2 9 22 2" />`）
- 文字："发送提问"
- 禁用条件：`isBusy || !prompt.trim() || selected.size === 0`
- 流式时显示 loading spinning 动画

**完成状态：**
- 绿色勾 + "回答完成，可继续提问"，`--color-success`，`animate-fade-in`

---

> **🎨 Prompt 给 AI 生图（章节三）**
>
> 生成一张 ArenaQA 左侧输入面板的截图（浅色模式）。展示：
> 1. 顶部品牌区：AQ 蓝紫渐变方块 + "AI 问答竞技场" 标题 + "多模型并发对比·AI裁判评分" 副标题
> 2. 模型选择区：4 个模型卡片按钮 — DeepSeek V3（蓝色渐变已选中带勾）、通义千问（灰色未选中）、Claude 4（灰色未选中）、Gemini 2.5（绿色渐变已选中带勾），每个带对应颜色的 SVG 图标
> 3. 问题输入区：textarea 5 行高，placeholder 文字 "输入你的问题，按 Enter 发送…"，底部提示 "Enter 发送 · Shift+Enter 换行"
> 4. 底部：进度条显示 "接收回答中... 2/4" 且进度约 50%，下方全宽蓝色发送按钮 "发送提问" 带发送图标
> 宽度约 320px，风格干净简洁，蓝色 #2563EB 为主色。

---

## 四、中间回答列——AnswerColumn × ColumnLayout

### 4.1 ColumnLayout（多列容器）

- 空状态（无问答时）：
  - 使用 `EmptyState` 组件
  - 图标：聊天气泡 SVG（24×24）
  - 标题："等待你的第一个问题"
  - 描述："左侧选择模型，输入问题后点击发送。各模型的回答将在独立的列中实时流式显示。"
- 有问答时：每个模型一列，通过 `PanelGroup` 实现列间拖拽
- 各列默认等宽，最小 20%
- 列间分割条：同主布局分割条样式

### 4.2 AnswerColumn（单列结构）

```
┌──────────────────────────────┐
│ [图标] 模型名称  ●●●         │ ← 列头（流式动画三跳点）
│                 或 "2.3s"    │ ← done 后显示耗时
├──────────────────────────────┤
│                              │
│  Markdown 渲染内容            │ ← 内容区，overflow-y-auto
│                              │
│  - 段落文本                   │
│                              │
│  ┌────────────────────────┐  │
│  │  代码块，深色背景        │  │
│  │  const x = 1;          │  │
│  └────────────────────────┘  │
│                              │
│  `行内代码` 粉色高亮         │
│  **粗体** 强调              │
│                              │
│  ▎                          │ ← 流式光标（仅 streaming 时）
└──────────────────────────────┘
```

### 4.3 列头

- padding：`px-4 py-2.5`
- 背景：`bg-[--color-bg]` 灰色
- 底部边框：`border-b border-[--color-border]`
- 左侧：模型 SVG 图标（18×18，模型标识色）+ 模型名称（`--font-body`，`font-semibold`）
- 流式态：三个跳点，`w-1.5 h-1.5 rounded-full`，使用模型标识色，animation-delay 依次 0/0.15/0.3s
- 完成态：超时时间，`--font-caption`，`--color-text-disabled`，tabular-nums，`< 1s` 显示 `xxxms`，否则 `x.xs`

### 4.4 内容区

- padding：`p-4`
- 字号：`--font-body`（14px），行高 `leading-relaxed`
- 文字颜色：`--color-text-body`

**文本渲染（简易 Markdown）：**
- 段落：`<p>` 每段 `mb-2 last:mb-0`
- 换行：`<br>`
- **无序列表**：蓝色圆点 `•` (`--color-primary`) + `ml-4`
- **有序列表**：蓝色数字 + `ml-4`
- **粗体**：`<strong>`，`font-semibold`，`--color-text-primary`
- **行内代码**：`<code>`，背景 `bg-[--color-bg]`，文字 `pink-600`（浅色）/ `pink-400`（深色），`px-1.5 py-0.5 rounded-[--radius-sm]`
- **代码块**：`<pre>`，`my-3 p-3 rounded-[--radius-default]`，`bg-[#111827]`（深色背景），`text-gray-100`，`--font-small`
- **流式光标**：`w-[2px] h-[1em]`，左 `ml-0.5`，使用模型标识色，`pulse 0.8s ease-in-out infinite`

### 4.5 错误状态

- 卡片容器：`m-3 rounded-[--radius-default] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4`
- 错误图标：红色圆圈 X
- 标题："响应出错"，`red-600` / `dark:red-400`
- 错误信息：`--font-small`，`red-500` / `dark:red-300/80`

---

> **🎨 Prompt 给 AI 生图（章节四）**
>
> 生成一张 ArenaQA 中间回答列的截图（浅色模式）。展示两列并列布局：
> **左列 — DeepSeek V3（蓝色标识）：**
> - 列头：蓝色 SVG 图标 + "deepseek" + flow 后显示 "3.2s" 耗时
> - 内容：Markdown 渲染的文本段落，包含粗体、列表圆点、一个深色背景代码块（显示一段 JavaScript）、行内代码粉色高亮
> **右列 — Claude 4（琥珀色标识）：**
> - 列头：琥珀色 SVG 图标 + "claude" + 三跳点流式动画
> - 内容：正在流式输出的文本，末尾有闪烁的琥珀色光标
> 两列之间有 3px 分割条，列背景白色，列头灰色 #F3F4F6。

---

## 五、右侧结果摘要——SidePanel

### 5.1 面板结构

```
┌─────────────────────────┐
│ ┌─┐                     │
│ │R│ 结果摘要              │ ← 面板标题
│ └─┘                     │
├─────────────────────────┤
│ 根据状态显示不同内容      │
│                          │
│ [状态 1] 空闲            │ → EmptyState：星星图标+"等待结果"
│ [状态 2] 流式回答中       │ → 四跳点动画+"等待各模型完成..."
│ [状态 3] 裁判评分中       │ → 旋转 loading + "AI 裁判评分中"
│ [状态 4] 融合生成中       │ → 评分卡片 + 旋转loading + "融合生成中"
│ [状态 5] 完成(评分+融合)  │ → 评分卡片 + 融合区域
│ [状态 6] 完成(评分不可用) │ → 警告卡片 + 融合区域
└─────────────────────────┘
```

### 5.2 面板标题

- padding：`px-5 pt-5 pb-3`
- 品牌标识圆角方块：`w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600`，白色文字 "R"
- 标题文字：`--font-h3`（18px），`font-bold`

### 5.3 内容区

padding：`px-5 py-4`，`space-y-4`，`overflow-y-auto`

### 5.4 状态视图

**空闲态：**
- 使用 `EmptyState` 组件
- 图标：星星 SVG（22×22）
- 标题："等待结果"
- 描述："发送问题后，评分和综合答案将在此显示"

**流式回答中：**
- 居中四跳点（`w-2.5 h-2.5`，`--color-primary`，animation-delay 0/0.15/0.3/0.45s）
- 文字："等待各模型完成..."

**裁判评分中：**
- 圆角卡片：`rounded-[--radius-default] border bg-[--color-bg] p-4`
- 旋转 SVG 加载 + 两行文字："AI 裁判评分中" / "正在评估各模型回答质量..."

**融合生成中：**
- 上方显示评分卡片 + 下方旋转加载卡片

**完成态（评分+融合正常）：**
- 评分卡片 + 融合卡片（共识 + 分歧 + 综合答案）

**完成态（评分不可用）：**
- 琥珀色警告卡片 + 融合卡片

### 5.5 评分卡片（ScoreSection）

```
┌─────────────────────────────────┐
│ ★ AI 评分                        │ ← 标题
│                                 │
│ ┌── deepseek ──────── 8.5 ──┐   │ ← 总分高亮黄色
│ │ 准确 ████████░░ 8          │   │ ← 蓝色条
│ │ 完整 ████████░░ 8          │   │ ← 绿色条
│ │ 可操作 █████████░ 9        │   │ ← 紫色条
│ │ 安全  ██████████ 10        │   │ ← 琥珀条
│ │ 回答准确全面，建议具体化...   │   │ ← 评论
│ └────────────────────────────┘   │
│ ┌── qwen ──────────── 7.0 ──┐   │
│ │ ...                        │   │
│ └────────────────────────────┘   │
└─────────────────────────────────┘
```

- 标题行：`flex items-center gap-1.5`，星星图标 + "AI 评分" 标签，`--font-small font-semibold uppercase`
- 每个模型一张卡片：`rounded-[--radius-default] border p-3`
- **最佳模型**：黄色边框+背景（`border-yellow-200 bg-yellow-50`），总分黄色高亮，右上角 "最佳" 标签（`px-1.5 py-0.5 rounded-full bg-yellow-200`）
- 模型名：`--font-body font-semibold`
- 总分：`text-lg font-bold tabular-nums`
- 四维度评分条：`h-1.5 rounded-full`，蓝色（准确 `#2563EB`）/ 绿色（完整 `#10B981`）/ 紫色（可操作 `#7C3AED`）/ 琥珀（安全 `#F59E0B`）
- 标签：`w-10`，`--font-caption`，`--color-text-secondary`
- 数值：`w-4 text-right tabular-nums`
- 评论：`--font-caption`，`--color-text-secondary`

### 5.6 融合区域（FusionSection）

```
┌─────────────────────────────────┐
│ ✏️ 综合答案                       │ ← 标题
│                                 │
│ ┌── ✅ 共识 ──────────────────┐ │
│ │ • 共识点1                    │ │ ← 绿色卡片
│ │ • 共识点2                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌── ⚠️ 分歧 ──────────────────┐ │
│ │ 分歧主题                     │ │ ← 琥珀色卡片
│ │ deepseek: 立场A              │ │
│ │ claude: 立场B                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌── 综合答案 ─────────────────┐ │
│ │ 综合回答 Markdown 文本...    │ │ ← 普通卡片
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- 标题行："综合答案"，紫色编辑图标
- **共识卡片**：`border-green-200 bg-green-50`，绿色勾图标，绿色标题，绿色圆点列表
- **分歧卡片**：`border-amber-200 bg-amber-50`，琥珀色感叹号图标，琥珀色标题
  - 每个分歧显示主题 + 各模型立场（`model: 立场` 格式）
- **综合答案卡片**：`border border-[--color-border] bg-[--color-bg]`，文档图标，`whitespace-pre-wrap`

---

> **🎨 Prompt 给 AI 生图（章节五）**
>
> 生成一张 ArenaQA 右侧结果摘要面板的截图（浅色模式）。展示一个已完成问答的状态：
> 1. 面板标题：R 渐变方块 + "结果摘要"
> 2. **AI 评分区**：DeepSeek V3（总分 8.5，黄色边框"最佳"标签）和 通义千问（总分 7.0）两张评分卡片，每张含四维进度条（准确蓝条8/10、完整绿条8/10、可操作紫条9/10、安全黄条10/10）和简短评语
> 3. **综合答案区**：绿色共识卡片（2-3 个共识点列表）、琥珀色分歧卡片（1-2 个分歧主题，各模型立场对比）、综合答案卡片（一段 Markdown 文本）
> 宽度约 350px，风格干净，字体采用系统默认无衬线。

---

## 六、标准化基础组件——Button / EmptyState

### 6.1 Button 组件

#### 变体

| 变体 | 样式 |
|------|------|
| `primary` | 蓝色背景 `bg-[--color-primary]`，白色文字，`shadow-[--shadow-1]`，hover `--color-primary-hover`，active `--color-primary-active` + `translate-y-[1px]` |
| `secondary` | 透明背景，蓝色边框+文字，hover `bg-[--color-primary-light]` |
| `text` | 透明背景，灰色文字，hover `bg-[--color-bg]` |
| `icon` | 透明背景，灰色图标，hover 加深 |

#### 尺寸

| 尺寸 | 高度 | 内边距 |
|------|------|--------|
| `sm` | 32px（h-8） | `px-2` |
| `md` | 40px（h-10） | `px-6` |
| `lg` | 48px（h-12） | `px-8` |

图标按钮尺寸：sm 32×32 / md 40×40 / lg 48×48

#### 状态

- **Normal**：标准样式
- **Hover**：变体对应的 hover 效果
- **Active**：变体对应的 active 效果（按压下沉 1px）
- **Disabled**：`opacity-50 cursor-not-allowed shadow-none`
- **Loading**：旋转 spinner 动画替代图标，文字的 `opacity-70`

#### 共用样式

- `inline-flex items-center justify-center gap-2`
- `rounded-[--radius-sm]`（4px）
- `font-medium`
- `transition-all duration-150 ease-out`

### 6.2 EmptyState 组件

```
┌─────────────────────┐
│                     │
│    ┌─────────┐      │
│    │  SVG图标  │     │ ← 56×56 圆形容器，主色浅蓝背景
│    └─────────┘      │
│                     │
│     标题 (H3)       │ ← `--font-h3` font-medium
│                     │
│   描述文字（可选）    │ ← `--font-body` 灰色，max-w-sm
│                     │
│   [操作按钮]（可选）  │ ← mt-4
│                     │
└─────────────────────┘
```

- 容器：`flex flex-col items-center justify-center h-full text-center px-8 py-12`
- 图标容器：`w-14 h-14 rounded-2xl bg-[--color-primary-light] flex items-center justify-center mb-4 text-[--color-primary]`
- 标题：`text-[--font-h3]`（18px），`font-medium`，`--color-text-primary`，`mb-1`
- 描述：`--font-body`（14px），`--color-text-secondary`，`leading-relaxed max-w-sm`
- 操作按钮：`mt-4`

---

> **🎨 Prompt 给 AI 生图（章节六）**
>
> 生成一张 ArenaQA 基础组件展示图（浅色模式）。展示：
> 1. **Button 组件**：分三行展示
>    - 第一行：primary 变体 sm/md/lg 三个尺寸并排
>    - 第二行：primary / secondary / text / icon 四个变体并排
>    - 第三行：primary disabled / primary loading（spinner动画）状态
> 2. **EmptyState 组件**：一个居中的空状态卡片，56px 圆形图标容器（浅蓝背景+蓝色SVG图标），标题 "等待你的第一个问题"，描述文字 "左侧选择模型，输入问题后点击发送。各模型的回答将在独立的列中实时流式显示。"
> 风格：Figma 组件面板风格，标注各变体和状态名称。

---

## 七、导航栏与深色模式——NavBar

### 7.1 结构

```
┌──────────────────────────────────────────────────────┐
│ ┌─┐                                                   │
│ │AQ│ ArenaQA  AI 问答竞技场        SpecForge  [🌙/☀️]  │
│ └─┘                                                   │
└──────────────────────────────────────────────────────┘
```

### 7.2 参数

- 高度：48px（`h-12`）
- 底部边框：`border-b border-[--color-border]`
- 背景：`bg-[--color-surface]`
- padding：`px-6`
- 布局：`flex items-center justify-between`

**左侧品牌区：**
- AQ 标识：`w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600`，白色文字，`shadow-[--shadow-1]`
- 标题："ArenaQA"，`--font-h3`（18px），`font-semibold`，`tracking-tight`
- 副文本："AI 问答竞技场"，`--font-small`，`--color-text-disabled`，`hidden sm:inline`

**右侧导航区：**
- SpecForge 链接：`--font-small`，`--color-text-secondary`，hover 变 `--color-text-primary`
- 深色模式切换按钮：`w-8 h-8 rounded-[--radius-sm]`，hover `bg-[--color-bg]`
  - 浅色模式时显示月亮图标（`<path d="M21 12.79A9 9..." />`）
  - 深色模式时显示太阳图标（`<circle cx="12" cy="12" r="5" />` + 光芒线）
  - `aria-label` 跟随当前模式："切换到深色模式" / "切换到浅色模式"

### 7.3 深色模式实现

- 通过 `document.documentElement.classList.toggle('dark')` 切换
- 默认跟随系统 `prefers-color-scheme: dark`
- CSS 变量通过 `.dark` 和 `@media (prefers-color-scheme: dark)` 双路径覆盖

---

> **🎨 Prompt 给 AI 生图（章节七）**
>
> 生成两张 ArenaQA 导航栏对比截图：
> **浅色模式：** 白色背景导航栏 48px 高，左侧 AQ 蓝紫渐变方块 + "ArenaQA" 标题 + "AI 问答竞技场" 副标题，右侧 "SpecForge" 文字链接 + 月亮图标按钮（aria-label="切换到深色模式"）
> **深色模式：** 深灰色 #1F2937 背景导航栏，文字白色，月亮图标变为太阳图标（aria-label="切换到浅色模式"）
> 两张图并排展示，标注 "Light Mode" / "Dark Mode"。

---

## 附录：文件索引

本文档描述的 UI 实现在以下源码文件中：

| 文件 | 内容 |
|------|------|
| `src/app/globals.css` | 设计令牌系统（色彩/字体/间距/阴影/圆角/动效） |
| `src/app/layout.tsx` | 根布局，NavBar + 主工作区 |
| `src/app/page.tsx` | 三栏布局 |
| `src/components/ui/Button.tsx` | Button 组件 |
| `src/components/ui/EmptyState.tsx` | EmptyState 组件 |
| `src/components/shared/NavBar.tsx` | NavBar 组件 |
| `src/components/InputPanel/index.tsx` | 输入面板 |
| `src/components/AnswerColumns/AnswerColumn.tsx` | 单列回答 |
| `src/components/AnswerColumns/ColumnLayout.tsx` | 多列容器 |
| `src/components/SidePanel/index.tsx` | 结果摘要面板 |
| `src/app/api/models/route.ts` | 模型列表数据源 |
| `src/stores/chat-store.ts` | 前端状态机 |
