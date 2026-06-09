# Task Board — ArenaQA 项目总看板

> 最后更新：2026-06-09

## DONE ✅

- [x] Kimi 计划 10/10 全部完成（Markdown/缓冲/停止重试/输入框/历史/反馈/成本/免费模型/PWA）
- [x] 额外功能：自定义付费模型、自定义裁判模型、内置模型可改 BaseURL+ModelID
- [x] 测试覆盖：10 文件 125 用例，Lines 97.71%（待提交）

---

## TODO（按优先级排列）

### P0 — 收尾提交

- [ ] **提交测试成果 + 当前变更**
  - 9 个已修改文件 + 10+ 个新测试文件需要 commit
  - `git add` 后 `git commit` + `git push`

- [ ] **`npm install` + `next build` 验证**
  - 新依赖（vitest、testing-library 等）需安装
  - 构建必须通过

- [ ] **跑一遍测试，确认 125 用例全过**
  - `npm run test` 验证
  - 上次另一个 agent 写的，确认当前环境 OK

### P1 — 免费 Cookie 自动刷新（WebBridge）

- [ ] **Phase 1-a：`scripts/refresh-cookies.mjs`**
  - 新建脚本，用 WebBridge 遍历 FREE_MODELS，提取各平台 `document.cookie`
  - 自动更新 `.env` 中 FREE_*_TOKEN
  - 自动执行 `docker compose -f docker-compose.free.yml up -d --force-recreate`

- [ ] **Phase 1-b：阶跃星辰特殊处理**
  - 需要 localStorage.oasis-token 而非 Cookie
  - WebBridge 需额外执行 `localStorage.getItem("oasis-token")`

- [ ] **Phase 1-c：一键运行验证**
  - `node scripts/refresh-cookies.mjs` 跑通全流程

### P2 — 免费模型健康度监控

- [ ] **Phase 2-a：后端健康检测**
  - `src/app/api/models/route.ts` 返回时 ping 各 free-api `/health`
  - 返回状态：healthy / unhealthy / dead

- [ ] **Phase 2-b：前端状态标识**
  - `ModelCard.tsx` 显示 🟢🟡🔴 状态
  - 过期的模型自动标记为不可选

### P3 — 代码清理 & 补充

- [ ] **清理过时 docs/**
  - `docs/` 中 6 个文件全部落后于实际代码
  - 确认后删除或归档

- [ ] **补充 .gitignore**
  - `.codegraph/`、`.reasonix/`、`coverage/` 加入 gitignore
  - `HANDFF.md`、`HANDOFF-NEXT.md` 是否需要 gitignore 确认

- [ ] **测试补充（非必须）**
  - API 路由测试（mock Prisma/NextRequest）
  - task-manager 测试
  - useChat hook 测试（mock EventSource）

### P4 — 长远展望

- [ ] **PlaywrightProvider 实现**
  - 浏览器自动化接入网页版模型

- [ ] **CI/CD 接入**
  - GitHub Actions：自动跑测试 + 构建
