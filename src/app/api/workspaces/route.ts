import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.userId },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!membership) {
    // ワークスペースオーナーとして検索
    const owned = await prisma.workspace.findFirst({
      where: { ownerId: user.userId },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ workspace: owned || null });
  }

  return NextResponse.json({ workspace: membership.workspace });
}
