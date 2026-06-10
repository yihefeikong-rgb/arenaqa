# Task Board — ArenaQA 项目总看板

> 最后更新：2026-06-10

## P0 🔴 — 当前待审查

- [ ] 全面审查计划见 `REVIEW-PLAN.md`
- [ ] P0: 历史评分不显示（`/api/judge` 返回了 scores 但前端无反应）
- [ ] P0: 所有静默 catch 加 console.warn/error
- [ ] P1: API 参数验证（所有 endpoint）
- [ ] P1: runJudge/runFusion 超时保护
- [ ] P2: 组件 re-render 优化
- [ ] P2: 安全审查

## DONE ✅ — 全部完成

- [x] Kimi 计划 10/10（Markdown/缓冲/停止重试/输入框/历史/反馈/成本/免费模型/PWA）
- [x] 额外功能：自定义付费模型、自定义裁判模型、内置模型可改 BaseURL+ModelID
- [x] 测试覆盖：10 文件 125 用例，覆盖率 Lines 97.71% Branches 80.76%
- [x] Cookie 自动刷新脚本：`scripts/refresh-cookies.mjs`（WebBridge 一键刷新）
- [x] 免费模型健康监控：/api/models 返回 🟢🟡🔴，ModelCard 显示状态
- [x] 代码清理：.gitignore 补充（coverage/ .codegraph/ .reasonix/）、P0 提交 + 构建
- [x] 3 次提交推送至 GitHub（`642ee15` master）
