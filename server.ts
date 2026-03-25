import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { jwtVerify } from "jose";
import { PrismaClient } from "./src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ChatMessage,
} from "./src/types/socket.js";

const port = parseInt(process.env.SOCKET_PORT || "3001", 10);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aibou-dev-secret-change-in-production"
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

interface SocketData {
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

const httpServer = createServer();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

// 認証ミドルウェア
io.use(async (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    parseCookie(socket.handshake.headers.cookie || "")["aibou-token"];

  if (!token) {
    return next(new Error("認証が必要です"));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, email: true, displayName: true, role: true },
    });

    if (!user) {
      return next(new Error("ユーザーが見つかりません"));
    }

    socket.data = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    } as SocketData;

    next();
  } catch {
    next(new Error("無効なトークンです"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data as SocketData;
  console.log(`Connected: ${user.displayName} (${user.userId})`);

  socket.on("channel:join", async (channelId) => {
    socket.join(channelId);
    io.to(channelId).emit("channel:joined", {
      channelId,
      userId: user.userId,
      displayName: user.displayName,
    });
  });

  socket.on("channel:leave", (channelId) => {
    socket.leave(channelId);
    io.to(channelId).emit("channel:left", {
      channelId,
      userId: user.userId,
    });
  });

  socket.on("message:send", async (data) => {
    try {
      const message = await prisma.message.create({
        data: {
          channelId: data.channelId,
          userId: user.userId,
          content: data.content,
          threadId: data.threadId || null,
        },
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      });

      const chatMessage: ChatMessage = {
        id: message.id,
        channelId: message.channelId,
        userId: message.user.id,
        displayName: message.user.displayName,
        avatarUrl: message.user.avatarUrl,
        content: message.content,
        threadId: message.threadId,
        isAi: message.isAi,
        createdAt: message.createdAt.toISOString(),
      };

      io.to(data.channelId).emit("message:new", chatMessage);
    } catch (error) {
      console.error("Message send error:", error);
      socket.emit("error", { message: "メッセージの送信に失敗しました" });
    }
  });

  socket.on("user:typing", (channelId) => {
    socket.to(channelId).emit("user:typing", {
      channelId,
      userId: user.userId,
      displayName: user.displayName,
    });
  });

  socket.on("user:stopTyping", (channelId) => {
    socket.to(channelId).emit("user:stopTyping", {
      channelId,
      userId: user.userId,
    });
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${user.displayName}`);
  });
});

httpServer.listen(port, () => {
  console.log(`> Aibou Socket.io server running on http://localhost:${port}`);
});

function parseCookie(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  });
  return cookies;
}
