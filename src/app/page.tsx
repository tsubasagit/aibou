"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMessage } from "@/types/socket";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  // ユーザー情報取得
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  // チャンネル一覧取得
  useEffect(() => {
    if (!user) return;
    fetch("/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setChannels(data.channels || []);
        if (data.channels?.length > 0 && !activeChannelId) {
          setActiveChannelId(data.channels[0].id);
        }
      });
  }, [user, activeChannelId]);

  // Socket.io 接続
  useEffect(() => {
    if (!user) return;

    const socket = connectSocket();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [user]);

  // チャンネル切り替え時
  useEffect(() => {
    if (!activeChannelId || !connected) return;

    const socket = connectSocket();
    socket.emit("channel:join", activeChannelId);

    // メッセージ履歴取得
    fetch(`/api/channels/${activeChannelId}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));

    return () => {
      socket.emit("channel:leave", activeChannelId);
    };
  }, [activeChannelId, connected]);

  const handleSend = useCallback(
    (content: string) => {
      if (!activeChannelId || !connected) return;
      const socket = connectSocket();
      socket.emit("message:send", { channelId: activeChannelId, content });
    },
    [activeChannelId, connected]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnectSocket();
    router.push("/login");
  }, [router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onLogout={handleLogout}
        displayName={user.displayName}
      />

      <div className="flex flex-1 flex-col">
        {/* チャンネルヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <div>
            <h2 className="font-bold text-slate-800">
              {activeChannel ? `# ${activeChannel.name}` : "チャンネルを選択"}
            </h2>
            {activeChannel?.description && (
              <p className="text-xs text-slate-500">{activeChannel.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-slate-400">
              {connected ? "接続中" : "切断中"}
            </span>
          </div>
        </div>

        {/* メッセージ表示エリア */}
        {activeChannelId ? (
          <>
            <MessageList messages={messages} currentUserId={user.id} />
            <MessageInput onSend={handleSend} disabled={!connected} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            チャンネルを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
