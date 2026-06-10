// POST /api/history — 保存当前会话到数据库
// GET  /api/history — 分页列表 + 搜索
// DELETE /api/history — 清空所有历史

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Score, FusionResult } from "@/types";

// ---- 保存会话 ----
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, answers, scores, fusion } = body as {
      prompt: string;
      answers: { model: string; content: string; latencyMs?: number; error?: string }[];
      scores: Score[];
      fusion: FusionResult | null;
    };

    // 全部模型均失败时，answers 为空内容，仍然保存历史
    const conversation = await prisma.conversation.create({
      data: {
        prompt,
        answers: {
          create: (() => {
            if (answers.length === 0) {
              return [{ model: "unknown", content: "", status: "error", error: "No answers recorded" }];
            }
            const valid = answers.filter((a) => a.model);
            if (valid.length === 0) {
              return [{ model: "unknown", content: "", status: "error", error: "All answers missing model field" }];
            }
            return valid.map((a) => ({
              model: a.model!,
              content: a.content || "",
              status: a.error ? "error" : "done",
              latencyMs: a.latencyMs ?? null,
              error: a.error ?? null,
            }));
          })(),
        },
        judge: scores && scores.length > 0
          ? { create: { scores: JSON.stringify(scores), raw: "" } }
          : undefined,
        fusion: fusion
          ? { create: { consensus: JSON.stringify(fusion.consensus), divergences: JSON.stringify(fusion.divergences), synthesized: fusion.synthesized } }
          : undefined,
      },
      include: { answers: true },
    });

    return NextResponse.json({ success: true, id: conversation.id });
  } catch (err) {
    console.error("[history] POST error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "保存失败" }, { status: 500 });
  }
}

// ---- 列表 + 搜索 ----
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where = q
      ? { prompt: { contains: q } }
      : {};

    const [items, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          answers: { select: { model: true, status: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    const list = items.map((c) => ({
      id: c.id,
      prompt: c.prompt,
      modelCount: c.answers.length,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ items: list, total, page, limit });
  } catch (e) {
    console.warn('[history] GET list error', e);
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 });
  }
}

// ---- 清空全部 ----
export async function DELETE() {
  try {
    await prisma.fusion.deleteMany();
    await prisma.judge.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.conversation.deleteMany();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.warn('[history] DELETE all error', e);
    return NextResponse.json({ success: false, error: "清空失败" }, { status: 500 });
  }
}
