#!/usr/bin/env node
// scripts/free-models.mjs
// 全自动免费模型管理：启动 WebBridge → 刷新 Cookie → 重启 Docker → 测试验证
// 用法: node scripts/free-models.mjs

import { execSync, spawn } from "child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const WB_API = "http://127.0.0.1:10086";
const WB_BIN = join(process.env.HOME || process.env.USERPROFILE, ".kimi-webbridge/bin/kimi-webbridge");
const ROOT = process.cwd();
const ENV_PATH = join(ROOT, ".env");
const DOCKER_FILE = join(ROOT, "docker-compose.free.yml");
const CACHE = mkdtempSync(join(tmpdir(), "arenaqa-"));

// 平台配置
const PLATFORMS = [
  { id: "kimi-free", url: "https://kimi.moonshot.cn", envKey: "FREE_KIMI_FREE_TOKEN" },
  { id: "qwen-free", url: "https://www.qianwen.com", envKey: "FREE_QWEN_FREE_TOKEN" },
  { id: "doubao-free", url: "https://www.doubao.com/chat", envKey: "FREE_DOUBAO_FREE_TOKEN" },
  { id: "glm-free", url: "https://chatglm.cn", envKey: "FREE_GLM_FREE_TOKEN" },
  { id: "spark-free", url: "https://xinghuo.xfyun.cn", envKey: "FREE_SPARK_FREE_TOKEN" },
  { id: "step-free", url: "https://chat.stepfun.com", envKey: "FREE_STEP_FREE_TOKEN", lsKey: "oasis-token" },
];

// Docker 模型端口映射（用于测试）
const DOCKER_PORTS = { "kimi-free": 8001, "qwen-free": 8002, "doubao-free": 8004, "glm-free": 8005, "spark-free": 8006, "step-free": 8007 };
const MODEL_IDS = { "kimi-free": "moonshot-v1", "qwen-free": "qwen-turbo", "doubao-free": "doubao", "glm-free": "glm-4", "spark-free": "SparkDesk-v3.5", "step-free": "step-v1" };

// ====== 工具函数 ======

function log(msg, ok = null) {
  const icon = ok === true ? "✓" : ok === false ? "✗" : "→";
  console.log(`  ${icon} ${msg}`);
}

function run(cmd, opts = {}) {
  try {
    const out = execSync(cmd, { encoding: "utf8", shell: "bash", timeout: opts.timeout || 30000, ...opts });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || "").trim(), err: (e.stderr || "").trim() || e.message };
  }
}

function wb(action, args = {}) {
  const payload = JSON.stringify({ action, args, session: "free-models" });
  const tmp = join(CACHE, `${Date.now()}.json`);
  writeFileSync(tmp, payload, "utf8");
  const r = run(`curl -s --max-time 30 -X POST ${WB_API}/command -H "Content-Type: application/json" -d @"${tmp}"`);
  if (r.ok) {
    try { return JSON.parse(r.out); } catch { return { ok: false, error: "parse fail" }; }
  }
  return { ok: false, error: r.err };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ====== 步骤 ======

async function step1_startWebBridge() {
  console.log("\n[1/5] Kimi WebBridge");
  // 先检查是否在运行
  const check = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 3 ${WB_API}/command`);
  if (check.ok && check.out !== "000") {
    log("WebBridge 已在运行", true);
    return;
  }
  // 启动
  const start = run(`"${WB_BIN}" start 2>&1`);
  log("启动 WebBridge 守护进程...", null);
  await sleep(4000);
  // 确认
  const retry = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 3 ${WB_API}/command`);
  if (retry.ok && retry.out !== "000") {
    log("WebBridge 已就绪", true);
  } else {
    log("WebBridge 启动失败，尝试重置...", false);
    run(`"${WB_BIN}" stop 2>/dev/null`);
    await sleep(2000);
    // 清理残留 PID
    try { execSync("taskkill /F /IM kimi-webbridge 2>/dev/null", { shell: "bash" }); } catch {}
    await sleep(1000);
    const retry2 = run(`"${WB_BIN}" start 2>&1`);
    await sleep(6000);
    const final = run(`curl -s -o /dev/null -w "%{http_code}" --max-time 3 ${WB_API}/command`);
    if (final.ok && final.out !== "000") {
      log("WebBridge 已就绪（重试后）", true);
    } else {
      console.log("  [FATAL] WebBridge 无法启动，请手动运行: ~/.kimi-webbridge/bin/kimi-webbridge start");
      return false;
    }
  }
  return true;
}

async function step2_refreshCookies() {
  console.log("\n[2/5] 刷新 Cookie");
  let env = readFileSync(ENV_PATH, "utf8");
  let successCount = 0;

  for (const p of PLATFORMS) {
    process.stdout.write(`  ${p.id}...`);

    const nav = wb("navigate", { url: p.url });
    if (!nav.ok) { console.log(" ✗ 导航失败"); continue; }
    await sleep(4000);

    const cookieRes = wb("evaluate", { code: "document.cookie" });
    let value = cookieRes.ok ? (cookieRes.data?.value || "") : "";

    if (p.lsKey) {
      const lsRes = wb("evaluate", { code: `localStorage.getItem("${p.lsKey}")||""` });
      const lsVal = lsRes.ok ? (lsRes.data?.value || "") : "";
      if (lsVal) value = lsVal;
    }

    if (!value) { console.log(" ✗ 空"); continue; }

    const regex = new RegExp(`^${p.envKey}=.*$`, "m");
    const newLine = `${p.envKey}=${value}`;
    env = regex.test(env) ? env.replace(regex, newLine) : env + `\n${newLine}`;
    successCount++;
    console.log(` ✓ ${value.substring(0, 20)}...`);
  }

  writeFileSync(ENV_PATH, env, "utf8");
  log(`Cookie 已更新: ${successCount}/${PLATFORMS.length}`, successCount > 0);
  return successCount > 0;
}

async function step3_rebuildDocker() {
  console.log("\n[3/5] 重建 Docker 容器");
  const r = run(`cd "${ROOT}" && docker compose -f docker-compose.free.yml up -d --force-recreate 2>&1`, { timeout: 120000 });
  if (r.ok) {
    log("容器已重建", true);
    await sleep(3000);
    return true;
  }
  log(`Docker 重建失败: ${(r.err || r.out).substring(0, 60)}`, false);
  console.log("  请手动执行:");
  console.log(`    cd "${ROOT}"`);
  console.log(`    docker compose -f docker-compose.free.yml up -d --force-recreate`);
  return false;
}

async function step4_testModels() {
  console.log("\n[4/5] 测试模型连通性");
  let pass = 0, fail = 0;

  for (const p of PLATFORMS) {
    const port = DOCKER_PORTS[p.id];
    const model = MODEL_IDS[p.id];
    if (!port) { fail++; continue; }

    const r = run(
      `curl -s --max-time 15 http://localhost:${port}/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer test" -d '${JSON.stringify({ model, messages: [{ role: "user", content: "1" }], max_tokens: 5 })}'`,
      { timeout: 20000 }
    );

    if (!r.ok) { console.log(`  ✗ ${p.id}: 无响应`); fail++; continue; }
    try {
      const d = JSON.parse(r.out);
      const ok = d.choices?.[0]?.message?.content;
      if (ok) { console.log(`  ✓ ${p.id}: ${ok}`); pass++; }
      else {
        const msg = d.message || d.errmsg || JSON.stringify(d).substring(0, 40);
        console.log(`  ○ ${p.id}: 响应但未通过（Cookie 可能仍无效）`);
        console.log(`     ${msg}`);
        fail++;
      }
    } catch { console.log(`  ✗ ${p.id}: 响应异常`); fail++; }
  }

  console.log(`  结果: ${pass} 通过, ${fail} 失败`);
  return { pass, fail };
}

function step5_summary(pass, fail) {
  console.log("\n[5/5] 总结");
  if (fail === 0) {
    log("全部模型正常运行", true);
  } else if (pass > 0) {
    log(`${pass} 个模型可用，${fail} 个仍异常`, null);
    log("Cookie 可能仍过期，需要去对应平台重新登录", false);
  } else {
    log("全部模型不可用", false);
    console.log("  可能原因:");
    console.log("  - Cookie 已过期，需重新在对应平台登录");
    console.log("  - Docker 服务未启动");
    console.log("  - 客户端网络环境被限制");
  }
  console.log("\n=== 完成 ===");
}

// ====== 主流程 ======

async function main() {
  console.log("╔══════════════════════════════════╗");
  console.log("║    ArenaQA 免费模型一键管理      ║");
  console.log("╚══════════════════════════════════╝");

  const wbOk = await step1_startWebBridge();
  if (wbOk === false) return;

  const cookieOk = await step2_refreshCookies();
  if (!cookieOk) {
    console.log("\nCookie 获取失败，跳过后续步骤");
    return;
  }

  await step3_rebuildDocker();
  const { pass, fail } = await step4_testModels();
  step5_summary(pass, fail);
}

main().catch((e) => console.error("脚本异常:", e));
