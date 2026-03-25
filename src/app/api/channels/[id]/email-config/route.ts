import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/mail/encryption";

// メール連携設定を取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { id: channelId } = await params;

  const config = await prisma.channelEmailConfig.findUnique({
    where: { channelId },
    select: {
      id: true,
      imapHost: true,
      imapPort: true,
      imapUser: true,
      imapTls: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpTls: true,
      emailAddress: true,
      displayName: true,
      isActive: true,
      lastSyncAt: true,
    },
  });

  return NextResponse.json({ config });
}

// メール連携設定を作成/更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id: channelId } = await params;
  const body = await request.json();

  const data = {
    channelId,
    imapHost: body.imapHost,
    imapPort: body.imapPort || 993,
    imapUser: body.imapUser,
    imapPass: encrypt(body.imapPass),
    imapTls: body.imapTls ?? true,
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort || 587,
    smtpUser: body.smtpUser,
    smtpPass: encrypt(body.smtpPass),
    smtpTls: body.smtpTls ?? true,
    emailAddress: body.emailAddress,
    displayName: body.displayName || null,
    isActive: true,
  };

  const config = await prisma.channelEmailConfig.upsert({
    where: { channelId },
    create: data,
    update: { ...data, channelId: undefined },
  });

  return NextResponse.json({
    config: {
      id: config.id,
      emailAddress: config.emailAddress,
      isActive: config.isActive,
    },
  });
}

// メール連携を無効化
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id: channelId } = await params;

  await prisma.channelEmailConfig.updateMany({
    where: { channelId },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
