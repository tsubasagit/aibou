import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { io, Socket } from "socket.io-client";
import { decrypt } from "./src/lib/mail/encryption.js";
import { fetchNewEmails, type ImapConfig } from "./src/lib/mail/imap-client.js";
import { parseEmail } from "./src/lib/mail/mail-parser.js";

const POLL_INTERVAL = parseInt(process.env.MAIL_POLL_INTERVAL || "30000", 10);
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// Socket.io クライアント（メールBotとして接続）
let socket: Socket | null = null;

async function getOrCreateEmailBot(workspaceId: string): Promise<string> {
  const botEmail = `email-bot-${workspaceId}@internal.aibou.local`;

  let bot = await prisma.user.findUnique({ where: { email: botEmail } });
  if (!bot) {
    bot = await prisma.user.create({
      data: {
        email: botEmail,
        password: "no-login",
        displayName: "メール",
        role: "MEMBER",
      },
    });
  }
  return bot.id;
}

async function processEmailConfig(config: {
  id: string;
  channelId: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  imapPass: string;
  imapTls: boolean;
  lastSyncUid: string | null;
  emailAddress: string;
  channel: { workspaceId: string };
}) {
  try {
    const imapConfig: ImapConfig = {
      host: config.imapHost,
      port: config.imapPort,
      user: config.imapUser,
      pass: decrypt(config.imapPass),
      tls: config.imapTls,
    };

    const emails = await fetchNewEmails(imapConfig, config.lastSyncUid || undefined);

    if (emails.length === 0) return;

    const botUserId = await getOrCreateEmailBot(config.channel.workspaceId);
    let lastUid = config.lastSyncUid;

    for (const email of emails) {
      const parsed = parseEmail(email.parsed);

      // 外部連絡先を検索/作成
      let contact = await prisma.externalContact.findUnique({
        where: {
          workspaceId_email: {
            workspaceId: config.channel.workspaceId,
            email: parsed.fromEmail,
          },
        },
      });

      if (!contact) {
        contact = await prisma.externalContact.create({
          data: {
            workspaceId: config.channel.workspaceId,
            email: parsed.fromEmail,
            displayName: parsed.fromName,
          },
        });
      }

      // メッセージ + メール情報を保存
      const message = await prisma.message.create({
        data: {
          channelId: config.channelId,
          userId: botUserId,
          content: parsed.textContent,
          isAi: false,
          emailMessage: {
            create: {
              emailMessageId: parsed.messageId,
              inReplyTo: parsed.inReplyTo,
              references: parsed.references,
              subject: parsed.subject,
              fromEmail: parsed.fromEmail,
              toEmails: JSON.stringify(parsed.toEmails),
              ccEmails: parsed.ccEmails ? JSON.stringify(parsed.ccEmails) : null,
              direction: "INBOUND",
              externalContactId: contact.id,
            },
          },
        },
      });

      // Socket.ioでリアルタイム通知
      if (socket?.connected) {
        socket.emit("message:send" as never, {
          type: "email:new",
          channelId: config.channelId,
          message: {
            id: message.id,
            channelId: config.channelId,
            userId: botUserId,
            displayName: contact.displayName,
            avatarUrl: null,
            content: parsed.textContent,
            threadId: null,
            isAi: false,
            isEmail: true,
            fromEmail: parsed.fromEmail,
            subject: parsed.subject,
            createdAt: message.createdAt.toISOString(),
          },
        });
      }

      lastUid = email.uid;
      console.log(`[Mail] ${config.emailAddress} ← ${parsed.fromEmail}: ${parsed.subject || "(件名なし)"}`);
    }

    // 同期ポイント更新
    if (lastUid) {
      await prisma.channelEmailConfig.update({
        where: { id: config.id },
        data: { lastSyncUid: lastUid, lastSyncAt: new Date() },
      });
    }
  } catch (error) {
    console.error(`[Mail] Error polling ${config.emailAddress}:`, error);
  }
}

async function pollAll() {
  const configs = await prisma.channelEmailConfig.findMany({
    where: { isActive: true },
    include: { channel: { select: { workspaceId: true } } },
  });

  if (configs.length === 0) return;

  await Promise.all(configs.map(processEmailConfig));
}

async function main() {
  console.log(`> Aibou Mail Worker started (interval: ${POLL_INTERVAL}ms)`);

  // Socket.ioサーバーに接続を試みる（通知用）
  try {
    socket = io(SOCKET_URL, { autoConnect: true });
    socket.on("connect", () => console.log("[Mail] Socket.io connected"));
    socket.on("disconnect", () => console.log("[Mail] Socket.io disconnected"));
  } catch {
    console.log("[Mail] Socket.io connection skipped");
  }

  // 初回ポーリング
  await pollAll();

  // 定期ポーリング
  setInterval(pollAll, POLL_INTERVAL);
}

main().catch(console.error);
