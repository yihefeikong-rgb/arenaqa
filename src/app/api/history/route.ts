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
    const { prompt, answers, scores, fusion, conversationId, round } = body as {
      prompt: string;
      answers: { model: string; content: string; latencyMs?: number; error?: string }[];
      scores: Score[];
      fusion: FusionResult | null;
      conversationId?: string;
      round?: number;
    };

    const currentRound = round ?? 1;

    // 辅助函数：构建 answers create 数组
    const buildAnswersCreate = () => {
      if (answers.length === 0) {
        return [{ model: "unknown", content: "", status: "error", error: "No answers recorded", round: currentRound }];
      }
      const valid = answers.filter((a) => a.model);
      if (valid.length === 0) {
        return [{ model: "unknown", content: "", status: "error", error: "All answers missing model field", round: currentRound }];
      }
      return valid.map((a) => ({
        model: a.model!,
        content: a.content || "",
        status: a.error ? "error" : "done",
        latencyMs: a.latencyMs ?? null,
        error: a.error ?? null,
        round: currentRound,
      }));
    };

    // 构建 Message 数组（双写）
    const buildMessagesCreate = (convId: string, seqStart: number) => {
      const msgs: Array<{
        conversationId: string;
        role: string;
        messageType: string;
        content: string;
        round: number;
        model?: string;
        sequence: number;
        metadata: string;
      }> = [];
      let seq = seqStart;

      // 1. 用户消息
      msgs.push({
        conversationId: convId,
        role: "user",
        messageType: "user_input",
        content: prompt,
        round: currentRound,
        sequence: seq++,
        metadata: "{}",
      });

      // 2. 各模型回答
      (answers || []).filter((a) => a.model).forEach((a) => {
        msgs.push({
          conversationId: convId,
          role: "assistant",
          messageType: "model_answer",
          content: a.content || "",
          round: currentRound,
          model: a.model!,
          sequence: seq++,
          metadata: JSON.stringify({ latencyMs: a.latencyMs }),
        });
      });

      // 3. Fusion 摘要
      if (fusion) {
        msgs.push({
          conversationId: convId,
          role: "assistant",
          messageType: "fusion_summary",
          content: fusion.synthesized || "",
          round: currentRound,
          model: "fusion",
          sequence: seq++,
          metadata: scores ? JSON.stringify({ scores }) : "{}",
        });
      }

      return msgs;
    };

    // 如果提供了 conversationId，追加新轮次到已有对话
    if (conversationId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { prompts: true },
      });
      const existingPrompts: string[] = existing ? JSON.parse(existing.prompts) : [];
      existingPrompts.push(prompt);

      // 获取当前最大 sequence
      const maxSeqMsg = await prisma.message.findFirst({
        where: { conversationId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      const seqStart = (maxSeqMsg?.sequence ?? 0) + 1;

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          roundCount: currentRound,
          prompts: JSON.stringify(existingPrompts),
          answers: { create: buildAnswersCreate() },
          judges: scores && scores.length > 0
            ? { create: { scores: JSON.stringify(scores), raw: "", round: currentRound } }
            : undefined,
          fusions: fusion
            ? { create: { consensus: JSON.stringify(fusion.consensus), divergences: JSON.stringify(fusion.divergences), synthesized: fusion.synthesized, round: currentRound } }
            : undefined,
          messages: { create: buildMessagesCreate(conversationId, seqStart) },
        },
      });
      return NextResponse.json({ success: true, id: conversationId });
    }

    // 新对话
    const conversation = await prisma.conversation.create({
      data: {
        prompt,
        title: prompt.slice(0, 30),
        roundCount: currentRound,
        prompts: JSON.stringify([prompt]),
        answers: { create: buildAnswersCreate() },
        judges: scores && scores.length > 0
          ? { create: { scores: JSON.stringify(scores), raw: "", round: currentRound } }
          : undefined,
        fusions: fusion
          ? { create: { consensus: JSON.stringify(fusion.consensus), divergences: JSON.stringify(fusion.divergences), synthesized: fusion.synthesized, round: currentRound } }
          : undefined,
        messages: {
          create: buildMessagesCreate("", 1).map((m) => ({ ...m, conversationId: undefined })),
        },
      },
      include: { answers: true, messages: true },
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
          answers: {
            select: { model: true, status: true, round: true },
            where: { round: 1 },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    const list = items.map((c) => ({
      id: c.id,
      prompt: c.prompt,
      title: c.title,
      roundCount: c.roundCount,
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
    await prisma.message.deleteMany();
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
