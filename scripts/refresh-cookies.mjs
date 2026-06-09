// scripts/refresh-cookies.mjs
// 使用 Kimi WebBridge 自动刷新免费模型的 Cookie Token
// 用法: node scripts/refresh-cookies.mjs
// 需要: Kimi WebBridge 后台运行 + Docker 容器已部署

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const API = "http://127.0.0.1:10086";
const SESSION = "refresh-cookies";
const ENV_PATH = join(process.cwd(), ".env");
const DOCKER_FILE = join(process.cwd(), "docker-compose.free.yml");
const CACHE_DIR = mkdtempSync(join(tmpdir(), "arenaqa-cookies-"));

// 各平台配置
const PLATFORMS = [
  {
    id: "kimi-free",
    url: "https://kimi.moonshot.cn",
    cookieKey: "kimi-auth",
    envKey: "FREE_KIMI_FREE_TOKEN",
  },
  {
    id: "qwen-free",
    url: "https://www.qianwen.com",
    envKey: "FREE_QWEN_FREE_TOKEN",
  },
  {
    id: "doubao-free",
    url: "https://www.doubao.com/chat",
    envKey: "FREE_DOUBAO_FREE_TOKEN",
  },
  {
    id: "glm-free",
    url: "https://chatglm.cn",
    envKey: "FREE_GLM_FREE_TOKEN",
  },
  {
    id: "spark-free",
    url: "https://xinghuo.xfyun.cn",
    envKey: "FREE_SPARK_FREE_TOKEN",
  },
  {
    id: "step-free",
    url: "https://chat.stepfun.com",
    envKey: "FREE_STEP_FREE_TOKEN",
    // 阶跃星辰需额外获取 localStorage token
    localStorageKey: "oasis-token",
  },
];

// ---- 工具函数 ----

function wb(action, args = {}) {
  const payload = JSON.stringify({ action, args, session: SESSION });
  const tmpFile = `${CACHE_DIR}/${Date.now()}.json`;
  try {
    execSync(`mkdir -p "${CACHE_DIR}"`, { encoding: "utf8", shell: "bash" });
    // 用文件传递 body，避免 shell 引号问题
    execSync(`echo '${payload.replace(/'/g, "'\\''")}' > "${tmpFile}"`, { encoding: "utf8", shell: "bash" });
    const raw = execSync(`curl -s --max-time 30 -X POST ${API}/command -H "Content-Type: application/json" -d @"${tmpFile}"`, {
      encoding: "utf8",
      shell: "bash",
    });
    execSync(`rm -f "${tmpFile}"`, { encoding: "utf8", shell: "bash" });
    return JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function checkProxy() {
  try {
    const r = execSync("curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:10086/command 2>&1", {
      encoding: "utf8",
      shell: "bash",
    });
    return true;
  } catch {
    return false;
  }
}

function readDotEnv() {
  try {
    return readFileSync(ENV_PATH, "utf8");
  } catch {
    return "";
  }
}

function writeDotEnv(content) {
  writeFileSync(ENV_PATH, content, "utf8");
  console.log("  [OK] .env 已更新");
}

function rebuildDocker() {
  console.log("\n[*] 重建 Docker 容器...");
  try {
    execSync(`cd "${process.cwd()}" && docker compose -f docker-compose.free.yml up -d --force-recreate 2>&1`, {
      encoding: "utf8",
      shell: "bash",
      timeout: 120000,
    });
    console.log("  [OK] 容器已重建");
  } catch (e) {
    console.log("  [WARN] 重建失败（Docker 未运行？）: " + (e.message || "").substring(0, 60));
  }
}

// ---- 核心逻辑 ----

async function refreshAll() {
  console.log("=== ArenaQA Cookie 自动刷新 ===");
  console.log("");

  // 检查 WebBridge
  if (!checkProxy()) {
    console.log("[ERROR] Kimi WebBridge 未运行");
    console.log(" 启动: ~/.kimi-webbridge/bin/kimi-webbridge start");
    process.exit(1);
  }
  console.log("[OK] Kimi WebBridge 已连接\n");

  let env = readDotEnv();
  const results = [];

  for (const platform of PLATFORMS) {
    process.stdout.write(`[${platform.id}] 正在获取 Cookie...`);

    // 导航到目标页面
    const nav = wb("navigate", { url: platform.url });
    if (!nav.ok || nav.error) {
      const errMsg = typeof nav.error === "string" ? nav.error : nav.error?.message || JSON.stringify(nav.error).slice(0, 60);
      console.log(` ✗ 导航失败: ${errMsg}`);
      results.push({ ...platform, success: false });
      continue;
    }

    // 等待页面加载
    await new Promise((r) => setTimeout(r, 4000));

    // 提取 document.cookie
    const cookieRes = wb("evaluate", { code: "document.cookie" });
    let cookieValue = cookieRes.ok ? cookieRes.data?.value || "" : "";
    let lsValue = "";

    if (!cookieValue) {
      console.log(` ✗ 未获取到 Cookie`);
      results.push({ ...platform, success: false });
      continue;
    }

    // 如有 localStorage 需求（阶跃星辰）
    if (platform.localStorageKey) {
      const lsRes = wb("evaluate", {
        code: `localStorage.getItem("${platform.localStorageKey}") || ""`,
      });
      lsValue = lsRes.ok ? lsRes.data?.value || "" : "";
      if (lsValue) {
        cookieValue = lsValue; // 阶跃星辰用 localStorage token 而非 Cookie
        console.log(` ✓ ${cookieValue.substring(0, 30)}... (localStorage)`);
      } else {
        console.log(` ✗ localStorage 未找到 ${platform.localStorageKey}`);
        results.push({ ...platform, success: false });
        continue;
      }
    } else {
      console.log(` ✓ ${cookieValue.substring(0, 40)}...`);
    }

    // 更新 .env
    const regex = new RegExp(`^${platform.envKey}=.*$`, "m");
    const newLine = `${platform.envKey}=${cookieValue}`;
    if (regex.test(env)) {
      env = env.replace(regex, newLine);
    } else {
      env += `\n${newLine}`;
    }

    results.push({ ...platform, success: true, valueLength: cookieValue.length });
  }

  // 写入 .env
  if (results.some((r) => r.success)) {
    writeDotEnv(env);
  }

  // 打印结果
  console.log("\n=== 结果汇总 ===");
  for (const r of results) {
    console.log(`  ${r.success ? "✓" : "✗"} ${r.id}: ${r.success ? r.valueLength + " chars" : "失败"}`);
  }

  // 重建容器
  rebuildDocker();

  console.log("\n完成。");
}

refreshAll().catch((e) => console.error("脚本异常:", e));
