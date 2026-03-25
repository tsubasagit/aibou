import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// メッセージ履歴取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { id: channelId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const messages = await prisma.message.findMany({
    where: { channelId, threadId: null },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      emailMessage: {
        select: {
          fromEmail: true,
          subject: true,
          direction: true,
          externalContact: {
            select: { displayName: true },
          },
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return NextResponse.json({
    messages: items.reverse().map((m) => ({
      id: m.id,
      channelId: m.channelId,
      userId: m.user.id,
      displayName: m.emailMessage?.externalContact?.displayName || m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      content: m.content,
      threadId: m.threadId,
      isAi: m.isAi,
      isEmail: !!m.emailMessage,
      fromEmail: m.emailMessage?.fromEmail || undefined,
      subject: m.emailMessage?.subject || undefined,
      createdAt: m.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[0]?.id : null,
  });
}
