"use client";

interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
}

interface SidebarProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onLogout: () => void;
  onCreateChannel: () => void;
  onInvite: () => void;
  displayName: string;
  workspaceName: string;
}

export default function Sidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onLogout,
  onCreateChannel,
  onInvite,
  displayName,
  workspaceName,
}: SidebarProps) {
  return (
    <div className="flex h-full w-60 flex-col bg-slate-800 text-white">
      {/* ワークスペースヘッダー */}
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#538bb0]">
            <span className="text-sm font-bold">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{workspaceName}</p>
          </div>
        </div>
      </div>

      {/* チャンネル一覧 */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-xs font-semibold uppercase text-slate-400">チャンネル</p>
          <button
            onClick={onCreateChannel}
            className="text-slate-400 hover:text-white text-lg leading-none"
            title="チャンネル作成"
          >
            +
          </button>
        </div>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={`mb-0.5 flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
              activeChannelId === ch.id
                ? "bg-[#538bb0] text-white"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <span className="mr-2 text-slate-400">{ch.isPrivate ? "🔒" : "#"}</span>
            {ch.name}
          </button>
        ))}
      </div>

      {/* アクション */}
      <div className="border-t border-slate-700 px-3 py-2">
        <button
          onClick={onInvite}
          className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
        >
          <span className="text-slate-400">+</span>
          メンバーを招待
        </button>
      </div>

      {/* ユーザー情報 */}
      <div className="flex items-center justify-between border-t border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#538bb0] text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{displayName}</span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-slate-400 hover:text-white"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
