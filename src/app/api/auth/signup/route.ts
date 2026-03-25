import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, workspaceName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "メールアドレス、パスワード、表示名は必須です" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
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

    // ユーザー + ワークスペース + #general チャンネルを一括作成
    const wsName = workspaceName || `${displayName}のワークスペース`;
    const slug = wsName
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) + "-" + Date.now().toString(36);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        role: "ADMIN",
        ownedWorkspaces: {
          create: {
            name: wsName,
            slug,
            members: { create: { userId: undefined as unknown as string } },
            channels: {
              create: [
                {
                  name: "general",
                  description: "全体チャンネル",
                  createdBy: undefined as unknown as string,
                },
                {
                  name: "random",
                  description: "雑談チャンネル",
                  createdBy: undefined as unknown as string,
                },
              ],
            },
          },
        },
      },
    });

    // リレーションの userId を更新（self-reference workaround）
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: user.id },
      include: { channels: true },
    });

    if (workspace) {
      await prisma.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id },
      });

      for (const ch of workspace.channels) {
        await prisma.channel.update({
          where: { id: ch.id },
          data: { createdBy: user.id },
        });
        await prisma.channelMember.create({
          data: { channelId: ch.id, userId: user.id },
        });
      }
    }

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
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "アカウントの作成に失敗しました" },
      { status: 500 }
    );
  }
}
