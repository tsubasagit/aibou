import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, inviteToken } = await request.json();

    if (!email || !password || !displayName || !inviteToken) {
      return NextResponse.json({ error: "全項目を入力してください" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    // 招待トークン検証
    const invite = await prisma.invite.findUnique({
      where: { token: inviteToken },
      include: { workspace: { include: { channels: { where: { isPrivate: false } } } } },
    });

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "招待リンクが無効または期限切れです" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        role: "MEMBER",
      },
    });

    // ワークスペースに参加
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: user.id },
    });

    // 公開チャンネルに自動参加
    for (const ch of invite.workspace.channels) {
      await prisma.channelMember.create({
        data: { channelId: ch.id, userId: user.id },
      });
    }

    // 招待を使用済みに
    await prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Invite signup error:", error);
    return NextResponse.json(
      { error: "参加に失敗しました" },
      { status: 500 }
    );
  }
}
