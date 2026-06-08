# SpecForge to Reasonix 适配指南

> 指导如何将 SpecForge V3 的 13 个 Skill 迁移为原生 Reasonix 技能。

---

## 一、适配总览

| SpecForge Skill | Reasonix 状态 | runAs | 需适配项 |
|----------------|--------------|-------|---------|
| **项目级** | | | |
| project-requirements-clarification | ✅ 已安装 `specforge-project-req` | inline | 路径引用 |
| project-product-overview | 🔧 参考 `.reasonix/skills/specforge/` | inline | 需安装 |
| project-tech-stack | 🔧 参考文件 | inline | 需安装 |
| project-structure | 🔧 参考文件 | inline | 需安装 |
| project-dev-standards | 🔧 参考文件 | inline | 需安装 |
| project-roadmap-planning | 🔧 参考文件 | inline | 需安装 |
| project-initialization | 🔧 参考文件 | inline | 需要写权限工具 |
| **功能级** | | | |
| feature-requirements-clarification | ✅ 已安装 `specforge-feature-req` | inline | — |
| feature-tech-design | 🔧 参考文件 | inline | 需安装 |
| feature-task-planning | 🔧 参考文件 | inline | 需安装 |
| feature-implementation | ✅ 已安装 `specforge-feature-impl` | **subagent** | tools 限制 |
| feature-evolution | 🔧 参考文件 | inline | 需安装 |
| **通用** | | | |
| bugfix-workflow | ✅ 已安装 `specforge-bugfix` | **subagent** | tools 限制 |

---

## 二、转换规则

### 2.1 YAML 前置元数据

```yaml
---
name: "specforge-{技能名}"
description: "一句话描述"
runAs: inline        # 或 subagent
allowedTools: [...]  # subagent 时必须指定
effort: medium       # 可选：low/medium/high
---
```

### 2.2 路径引用更新

| 原引用 | 替换为 |
|--------|--------|
| `specs/PROJECT-CONTEXT.md` | `specs/PROJECT-CONTEXT.md`（相对路径）或全局规则 |
| `specs/GUARDRAILS.md` | `specs/GUARDRAILS.md`（保持相对路径） |
| `assets/{模板名}.md` | `specs/templates/{模板名}.md`（或直接内联） |
| `spec/`（不带 s） | 统一为 `specs/` |

### 2.3 Subagent 工具白名单

```yaml
# 适合编码类 Skill（如 feature-implementation）
allowedTools:
  - read_file
  - write_file
  - edit_file
  - delete_range
  - multi_edit
  - bash
  - lsp_diagnostics
  - lsp_definition
  - lsp_hover
  - lsp_references
  - grep
  - glob
  - ls

# 适合纯文档类 Skill（如 product-overview）
allowedTools:
  - read_file
  - write_file
  - grep
  - glob
  - ls
```

### 2.4 核心机制集成

GUARDRAILS.md 和 PROJECT-CONTEXT.md 已存放在 `.reasonix/skills/specforge/specs/` 下。有两种使用方式：

**方式 A：独立参考文件**（推荐）
- 保留在 `.reasonix/skills/specforge/specs/` 作为参考
- 在 Skill 中直接引用路径

**方式 B：转为 Reasonix Rules**
- 将 GUARDRAILS.md 转为 Reasonix 规则文件
- 将 PROJECT-CONTEXT.md 转为预加载上下文规则
- 存放在 `.reasonix/rules/` 目录

---

## 三、安装全部 Skill

如需安装剩余的 SpecForge Skill，按以下命令逐个执行：

```bash
# 项目级
install_skill name="specforge-project-overview" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-product-overview/SKILL.md)"
install_skill name="specforge-tech-stack" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-tech-stack/SKILL.md)"
install_skill name="specforge-project-structure" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-structure/SKILL.md)"
install_skill name="specforge-dev-standards" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-dev-standards/SKILL.md)"
install_skill name="specforge-roadmap" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-roadmap-planning/SKILL.md)"
install_skill name="specforge-init" description="..." body="$(cat .reasonix/skills/specforge/skills/project/project-initialization/SKILL.md)"

# 功能级
install_skill name="specforge-tech-design" description="..." body="$(cat .reasonix/skills/specforge/skills/feature/feature-tech-design/SKILL.md)"
install_skill name="specforge-task-planning" description="..." body="$(cat .reasonix/skills/specforge/skills/feature/feature-task-planning/SKILL.md)"
install_skill name="specforge-evolution" description="..." body="$(cat .reasonix/skills/specforge/skills/feature/feature-evolution/SKILL.md)"
```

---

## 四、推荐工作流映射

```
传统 Claude Code 工作流          →  Reasonix + SpecForge
───────────────────────────────────────────────────────
/claw（自由模式）                 →  /specforge-project-req（先想清楚）
直接让 AI 写代码                  →  /specforge-feature-req → /specforge-feature-impl
遇到 BUG 自己去翻                  →  /specforge-bugfix（隔离子代理排查）
开发串行等待                       →  task() 并行 + specforge-feature-impl
