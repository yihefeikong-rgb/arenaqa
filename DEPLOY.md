# ArenaQA 部署方案

> 基于 AI 模型融合分析结果，推荐 Railway 作为首选部署平台。
> 最后更新：2026-06-11

---

## 方案评估结果

### 🥇 Railway（强烈推荐）

| 维度 | 说明 |
|------|------|
| **成本** | 每月 $5 免费额度，个人项目通常够用 |
| **SQLite 持久化** | Persistent Volumes 完美支持 |
| **部署难度** | 极低，连接 GitHub 自动部署 |
| **域名** | 自动提供 `*.railway.app` 子域名 |
| **SSE 支持** | 完美支持长连接 |
| **注意** | 免费额度用完后服务暂停；国内访问速度可能偏慢 |

### 🥈 Render（备选）

| 维度 | 说明 |
|------|------|
| **成本** | 免费层每月 500 小时 |
| **SQLite 持久化** | Disk 挂载支持 |
| **部署难度** | 低，连接 GitHub 自动部署 |
| **休眠问题** | ⚠️ 15 分钟无活动会休眠（冷启动 30-60 秒） |

### 🥉 Fly.io（次选）

| 维度 | 说明 |
|------|------|
| **成本** | 免费层 3 台共享 VM（256MB RAM），需绑信用卡验证 |
| **部署难度** | 中等，需要 Dockerfile 和 `fly.toml` |

---

## 改动清单

### 1. 数据库路径可配置化

**文件**: `prisma/schema.prisma`

确保 SQLite 数据库路径使用环境变量：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

`.env` 中添加默认值：

```
DATABASE_URL=file:./prisma/dev.db
```

Railway 上设置环境变量指向持久卷路径：

```
DATABASE_URL=file:/data/dev.db
```

### 2. Railway 配置

**文件**: `railway.json`

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

### 3. NIM_API_KEY 环境变量

后端 `judge.ts` 和 `fusion.ts` 依赖 `process.env.NIM_API_KEY` 作为评分/融合的备用 API Key。

Railway 上需设置：

```
NIM_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
```

（或用户在设置面板中配置裁判模型 Key，已支持）

### 4. 持久卷配置

在 Railway Dashboard 中添加 Persistent Volume：
- 挂载路径：`/data`
- 大小：1GB（足够 SQLite 使用）
- `DATABASE_URL` 设为 `file:/data/dev.db`

### 5. 首次部署初始化

首次部署完成后，需要通过 Railway 的 Shell 或构建命令执行：

```bash
npx prisma db push
```

---

## 部署步骤

### 前置条件

1. 注册 [Railway](https://railway.app/) 账号（GitHub 登录）
2. 确保项目已推送至 GitHub

### 操作步骤

```bash
# 1. 确保数据库配置正确
echo "DATABASE_URL=file:./prisma/dev.db" >> .env

# 2. 提交代码
git add .
git commit -m "chore: add Railway deployment config"
git push origin master

# 3. Railway 创建项目
#    - 点击 "New Project" → "Deploy from GitHub repo"
#    - 选择 arenaqa 仓库
#    - 自动触发部署

# 4. 设置环境变量
#    在 Railway Dashboard → Project → Variables 中添加：
#    - DATABASE_URL=file:/data/dev.db
#    - NIM_API_KEY=nvapi-xxx（如有需要）

# 5. 添加持久卷
#    Railway Dashboard → Project → Volumes → Add Volume
#    挂载路径：/data

# 6. 初始化数据库
#    Railway Dashboard → Project → Shell
#    npx prisma db push

# 7. 访问
#    Railway 自动分配 *.railway.app 域名
```

---

## 注意事项

1. **API Key 安全**：NIM_API_KEY 直接配在 Railway 环境变量中，不会出现在代码里
2. **数据库备份**：Railway 持久卷有数据丢失风险，建议定期通过 `prisma studio` 导出
3. **冷启动**：首次请求或闲置后的首次请求可能较慢（约 5-10 秒 Next.js 冷启动）
4. **国内访问**：如在国内使用，可能需要配合 Cloudflare 加速
5. **升级路径**：如需更多资源，可升级 Railway 付费计划（$5/月起）
