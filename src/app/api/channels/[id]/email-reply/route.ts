import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/mail/encryption";
import { sendMail } from "@/lib/mail/smtp-client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }

  const { id: channelId } = await params;
  const { to, cc, subject, content, inReplyToMessageId } = await request.json();

  if (!to?.length || !content) {
    return NextResponse.json(
      { error: "宛先と本文は必須です" },
      { status: 400 }
    );
  }

  // チャンネルのメール設定を取得
  const emailConfig = await prisma.channelEmailConfig.findUnique({
    where: { channelId },
  });

  if (!emailConfig || !emailConfig.isActive) {
    return NextResponse.json(
      { error: "このチャンネルにはメール連携が設定されていません" },
      { status: 400 }
    );
  }

  // 返信先のメール情報を取得（スレッド追跡用）
  let inReplyTo: string | undefined;
  let references: string | undefined;
  if (inReplyToMessageId) {
    const original = await prisma.emailMessage.findUnique({
      where: { messageId: inReplyToMessageId },
    });
    if (original) {
      inReplyTo = original.emailMessageId || undefined;
      references = [original.references, original.emailMessageId]
        .filter(Boolean)
        .join(" ") || undefined;
    }
  }

  // SMTP送信
  try {
    const result = await sendMail(
      {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        user: emailConfig.smtpUser,
        pass: decrypt(emailConfig.smtpPass),
        tls: emailConfig.smtpTls,
      },
      {
        from: emailConfig.emailAddress,
        fromName: emailConfig.displayName || undefined,
        to,
        cc: cc || [],
        subject: subject || "",
        text: content,
        inReplyTo,
        references,
      }
    );

    // 送信メッセージをDBに保存
    const message = await prisma.message.create({
      data: {
        channelId,
        userId: user.userId,
        content,
        isAi: false,
        emailMessage: {
          create: {
            emailMessageId: result.messageId,
            inReplyTo: inReplyTo || null,
            references: references || null,
            subject,
            fromEmail: emailConfig.emailAddress,
            toEmails: JSON.stringify(to),
            ccEmails: cc?.length ? JSON.stringify(cc) : null,
            direction: "OUTBOUND",
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      messageId: message.id,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "メールの送信に失敗しました" },
      { status: 500 }
    );
  }
}
