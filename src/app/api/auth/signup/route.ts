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

    // 1. ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        role: "ADMIN",
      },
    });

    // 2. ワークスペース作成
    const wsName = workspaceName || `${displayName}のワークスペース`;
    const slug =
      wsName
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40) +
      "-" +
      Date.now().toString(36);

    const workspace = await prisma.workspace.create({
      data: {
        name: wsName,
        slug,
        ownerId: user.id,
      },
    });

    // 3. ワークスペースメンバー追加
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id },
    });

    // 4. デフォルトチャンネル作成 + メンバー追加
    for (const ch of [
      { name: "general", description: "全体チャンネル" },
      { name: "random", description: "雑談チャンネル" },
    ]) {
      const channel = await prisma.channel.create({
        data: {
          workspaceId: workspace.id,
          name: ch.name,
          description: ch.description,
          createdBy: user.id,
        },
      });
      await prisma.channelMember.create({
        data: { channelId: channel.id, userId: user.id },
      });
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
