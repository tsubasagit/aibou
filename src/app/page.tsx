"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import MemberPanel from "@/components/MemberPanel";
import CreateChannelModal from "@/components/CreateChannelModal";
import InviteModal from "@/components/InviteModal";
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

interface Workspace {
  id: string;
  name: string;
}

interface Member {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  online?: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [connected, setConnected] = useState(false);

  // モーダル状態
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

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

  // ワークスペース・チャンネル取得
  const fetchChannels = useCallback(async () => {
    if (!user) return;

    // ワークスペース取得
    const wsRes = await fetch("/api/workspaces");
    const wsData = await wsRes.json();
    if (wsData.workspace) {
      setWorkspace(wsData.workspace);
    }

    // チャンネル取得
    const chRes = await fetch("/api/channels");
    const chData = await chRes.json();
    setChannels(chData.channels || []);
    if (chData.channels?.length > 0 && !activeChannelId) {
      setActiveChannelId(chData.channels[0].id);
    }
  }, [user, activeChannelId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // メンバー取得
  useEffect(() => {
    if (!workspace) return;
    fetch(`/api/workspaces/${workspace.id}/members`)
      .then((res) => res.json())
      .then((data) => setMembers(data.members || []));
  }, [workspace]);

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
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#538bb0] border-t-transparent" />
          <p className="text-slate-500">読み込み中...</p>
        </div>
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
        onCreateChannel={() => setShowCreateChannel(true)}
        onInvite={() => setShowInvite(true)}
        displayName={user.displayName}
        workspaceName={workspace?.name || "Aibou"}
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMembers((v) => !v)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              {members.length}
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-xs text-slate-400">
                {connected ? "接続中" : "切断中"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* メッセージエリア */}
          <div className="flex flex-1 flex-col">
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

          {/* メンバーパネル */}
          <MemberPanel
            members={members}
            open={showMembers}
            onClose={() => setShowMembers(false)}
          />
        </div>
      </div>

      {/* モーダル */}
      {workspace && (
        <>
          <CreateChannelModal
            open={showCreateChannel}
            onClose={() => setShowCreateChannel(false)}
            workspaceId={workspace.id}
            onCreated={fetchChannels}
          />
          <InviteModal
            open={showInvite}
            onClose={() => setShowInvite(false)}
            workspaceId={workspace.id}
          />
        </>
      )}
    </div>
  );
}
