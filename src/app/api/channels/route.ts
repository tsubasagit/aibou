import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// チャンネル一覧取得
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const channels = await prisma.channel.findMany({
    where: {
      OR: [
        { isPrivate: false },
        { members: { some: { userId: user.userId } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      isPrivate: true,
      createdAt: true,
      emailConfig: { select: { isActive: true, emailAddress: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({
    channels: channels.map((ch) => ({
      ...ch,
      hasEmail: !!ch.emailConfig?.isActive,
      emailAddress: ch.emailConfig?.emailAddress || null,
      emailConfig: undefined,
    })),
  });
}

// チャンネル作成
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { name, description, workspaceId } = await request.json();

  if (!name || !workspaceId) {
    return NextResponse.json(
      { error: "チャンネル名とワークスペースIDは必須です" },
      { status: 400 }
    );
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      description: description || null,
      workspaceId,
      createdBy: user.userId,
      members: {
        create: { userId: user.userId },
      },
    },
  });

  return NextResponse.json({ channel });
}
