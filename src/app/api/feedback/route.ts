// POST /api/feedback — 提交反馈
// GET  /api/feedback?stats=true — 获取统计

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, prompt, answer, type, tags, comment } = body as {
      model: string;
      prompt: string;
      answer: string;
      type: "like" | "dislike";
      tags: string[];
      comment?: string;
    };

    // 只保留前 200 字作为摘要
    const answerSnippet = answer.slice(0, 200);

    const feedback = await prisma.feedback.create({
      data: {
        model,
        prompt,
        answer: answerSnippet,
        type,
        tags: JSON.stringify(tags || []),
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch {
    return NextResponse.json({ success: false, error: "提交失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("stats") !== "true") {
    return NextResponse.json({ error: "需要 ?stats=true" }, { status: 400 });
  }

  try {
    const [total, likes, dislikes] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { type: "like" } }),
      prisma.feedback.count({ where: { type: "dislike" } }),
    ]);

    const modelStats = await prisma.feedback.groupBy({
      by: ["model"],
      _count: { model: true },
      where: { type: "like" },
    });

    return NextResponse.json({
      total,
      likes,
      dislikes,
      modelStats: modelStats.map((m) => ({ model: m.model, likes: m._count.model })),
    });
  } catch {
    return NextResponse.json({ total: 0, likes: 0, dislikes: 0, modelStats: [] });
  }
}
