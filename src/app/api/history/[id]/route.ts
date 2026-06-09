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
        answers: true,
        judge: true,
        fusion: true,
      },
    });

    if (!conv) {
      return NextResponse.json({ error: "未找到" }, { status: 404 });
    }

    return NextResponse.json({
      id: conv.id,
      prompt: conv.prompt,
      createdAt: conv.createdAt.toISOString(),
      answers: conv.answers.map((a) => ({
        model: a.model,
        content: a.content,
        status: a.status,
        latencyMs: a.latencyMs,
        error: a.error,
      })),
      scores: conv.judge ? JSON.parse(conv.judge.scores) : [],
      fusion: conv.fusion
        ? {
            consensus: JSON.parse(conv.fusion.consensus),
            divergences: JSON.parse(conv.fusion.divergences),
            synthesized: conv.fusion.synthesized,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
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
    await prisma.conversation.update({
      where: { id },
      data: { prompt: body.prompt },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
