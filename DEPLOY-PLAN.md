# 部署执行计划

## 前置确认

| 项目 | 状态 |
|------|------|
| Railway 账号 | ❌ 需注册 |
| GitHub 仓库 | ✅ `origin/master` |
| Prisma + SQLite | ✅ 已用 `env("DATABASE_URL")` |
| NIM_API_KEY | ✅ `.env` 中有，部署时要配到 Railway |
| Node 版本 | v24 (Railway 默认支持) |

---

## Phase 1：代码改动（我来做）

### 1.1 添加 `railway.json`

项目根目录新建，告诉 Railway 如何构建和启动。

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate && next build"
  },
  "deploy": {
    "startCommand": "npx next start",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 1.2 数据库路径持久化适配

当前 `.env` 的 `DATABASE_URL=file:./dev.db` 是相对路径。部署后要改为持久卷路径。

代码层面无需改动——Prisma 已经在读 `env("DATABASE_URL")`。只需在 Railway 环境变量中改为 `DATABASE_URL=file:/data/dev.db`。

### 1.3 package.json 加启动脚本（可选）

新增 `postinstall` 脚本，确保部署时自动生成 Prisma Client：

```json
"scripts": {
  "postinstall": "prisma generate",
  "build": "next build",
  "start": "next start"
}
```

### 1.4 确认 `.gitignore` 不影响部署文件

当前排除项：`.env`、`*.db`、`.next/`、`node_modules/` — 全部正确 ✅
`schema.prisma` 和 `railway.json` 不会被排除 ✅

---

## Phase 2：部署操作（你来做）

### 步骤

```
1. 注册 Railway（GitHub 登录，免费）
   → https://railway.app/

2. 我改完代码后，你 push 到 GitHub

3. Railway → New Project → Deploy from GitHub repo
   → 选择 arenaqa 仓库
   → 自动开始构建 + 部署（约 2-3 分钟）

4. 设置环境变量
   Railway Dashboard → Project → Variables：
   DATABASE_URL=file:/data/dev.db
   NIM_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx（从 .env 复制）

5. 添加持久卷
   Railway Dashboard → Project → Volumes → Add Volume
   挂载路径：/data
   容量：1GB

6. 初始化数据库
   Railway Dashboard → Project → Shell
   npx prisma db push

7. 访问
   Railway 自动分配 *.railway.app 域名
   Application → Settings → Domain → 复制域名
```

---

## Phase 3：验证

部署完成后需要检查：

- [ ] 页面正常加载（主界面）
- [ ] 左侧模型列表正常显示
- [ ] 发送消息后 SSE 流式响应正常
- [ ] 评分和融合模块有内容
- [ ] 历史记录能保存和读取
- [ ] 手机浏览器访问正常

---

## 回滚方案

如果部署后有问题：
- Railway 支持回滚到之前版本
- 本地开发不受影响（`.env` 仍在本地）
- 数据库数据在持久卷中，不会丢失

---

## 预计耗时

| 阶段 | 时间 |
|------|------|
| Phase 1（我改代码） | ~10 分钟 |
| Phase 2（你部署） | ~15 分钟 |
| Phase 3（验证） | ~10 分钟 |
| **总计** | **~35 分钟** |
