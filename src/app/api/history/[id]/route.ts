// GET /api/history/[id] — 详情
// PATCH /api/history/[id] — 重命名
// DELETE /api/history/[id] — 删除单条
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: {
        answers: { orderBy: { round: "asc" } },
        judges: true,
        fusions: true,
      },
    });

    if (!conv) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    // 解析每轮 prompt
    const allPrompts: string[] = (() => {
      try { return JSON.parse(conv.prompts); } catch { return [conv.prompt]; }
    })();

    // 按 round 分组构建 rounds
    const roundsMap = new Map<number, {
      round: number;
      prompt: string;
      answers: Array<{ model: string; content: string; status: string; latencyMs?: number; error?: string }>;
      scores: Array<{ model: string; accuracy: number; completeness: number; actionability: number; safety: number; total: number; brief: string }>;
      fusion: { consensus: string[]; divergences: Array<{ topic: string; positions: Record<string, string> }>; synthesized: string } | null;
    }>();

    const roundCount = conv.roundCount;
    for (let r = 1; r <= roundCount; r++) {
      roundsMap.set(r, {
        round: r,
        prompt: allPrompts[r - 1] ?? "",
        answers: [],
        scores: [],
        fusion: null,
      });
    }

    // 分组 answers
    conv.answers.forEach((a) => {
      const r = roundsMap.get(a.round);
      if (r) {
        r.answers.push({
          model: a.model,
          content: a.content,
          status: a.status,
          latencyMs: a.latencyMs ?? undefined,
          error: a.error ?? undefined,
        });
      }
    });

    // 分组 judges
    conv.judges.forEach((j) => {
      const r = roundsMap.get(j.round);
      if (r) {
        r.scores = JSON.parse(j.scores);
      }
    });

    // 分组 fusions
    conv.fusions.forEach((f) => {
      const r = roundsMap.get(f.round);
      if (r) {
        r.fusion = {
          consensus: JSON.parse(f.consensus),
          divergences: JSON.parse(f.divergences),
          synthesized: f.synthesized,
        };
      }
    });

    const rounds = Array.from(roundsMap.values());

    return NextResponse.json({
      id: conv.id,
      prompt: conv.prompt,
      title: conv.title,
      roundCount: conv.roundCount,
      createdAt: conv.createdAt.toISOString(),
      // 向后兼容：返回第一轮的 answers/scores/fusion
      answers: rounds[0]?.answers ?? [],
      scores: rounds[0]?.scores ?? [],
      fusion: rounds[0]?.fusion ?? null,
      // 新增：完整按轮分组数据
      rounds,
    });
  } catch (e) {
    console.warn('[history] GET detail error', e);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.fusion.deleteMany({ where: { conversationId: id } });
    await prisma.judge.deleteMany({ where: { conversationId: id } });
    await prisma.answer.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.warn('[history] DELETE detail error', e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const round = body.round ?? 1;

    if (body.prompt) {
      await prisma.conversation.update({
        where: { id },
        data: { prompt: body.prompt },
      });
    }

    // 更新裁判评分（指定 round）
    if (body.scores) {
      await prisma.judge.upsert({
        where: { conversationId_round: { conversationId: id, round } },
        create: {
          conversationId: id,
          round,
          scores: JSON.stringify(body.scores),
          raw: '',
        },
        update: { scores: JSON.stringify(body.scores) },
      });
    }

    // 更新融合结果（指定 round）
    if (body.fusion) {
      await prisma.fusion.upsert({
        where: { conversationId_round: { conversationId: id, round } },
        create: {
          conversationId: id,
          round,
          consensus: JSON.stringify(body.fusion.consensus),
          divergences: JSON.stringify(body.fusion.divergences),
          synthesized: body.fusion.synthesized || '',
        },
        update: {
          consensus: JSON.stringify(body.fusion.consensus),
          divergences: JSON.stringify(body.fusion.divergences),
          synthesized: body.fusion.synthesized || '',
        },
      });
    }

    if (body.title) {
      await prisma.conversation.update({
        where: { id },
        data: { title: body.title },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.warn('[history] PATCH detail error', e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
