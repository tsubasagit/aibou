"use client";

import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export async function connectSocket(): Promise<TypedSocket> {
  if (socket?.connected) return socket;

  // サーバーからSocket用トークンを取得
  const res = await fetch("/api/auth/socket-token");
  const { token } = await res.json();

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: { token },
  });

  return socket;
}

export function getSocket(): TypedSocket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
