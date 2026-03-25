import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { testImapConnection } from "@/lib/mail/imap-client";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { imapHost, imapPort, imapUser, imapPass, imapTls } = await request.json();

  if (!imapHost || !imapUser || !imapPass) {
    return NextResponse.json({ error: "IMAP設定が不足しています" }, { status: 400 });
  }

  const success = await testImapConnection({
    host: imapHost,
    port: imapPort || 993,
    user: imapUser,
    pass: imapPass,
    tls: imapTls ?? true,
  });

  return NextResponse.json({
    success,
    message: success ? "IMAP接続に成功しました" : "IMAP接続に失敗しました。設定を確認してください",
  });
}
