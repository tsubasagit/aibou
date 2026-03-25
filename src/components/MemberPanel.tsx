"use client";

interface Member {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  online?: boolean;
}

interface MemberPanelProps {
  members: Member[];
  open: boolean;
  onClose: () => void;
}

export default function MemberPanel({ members, open, onClose }: MemberPanelProps) {
  if (!open) return null;

  const online = members.filter((m) => m.online);
  const offline = members.filter((m) => !m.online);

  return (
    <div className="flex h-full w-60 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">メンバー</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {online.length > 0 && (
          <>
            <p className="mb-2 px-2 text-xs font-semibold text-slate-400">
              オンライン — {online.length}
            </p>
            {online.map((m) => (
              <MemberItem key={m.id} member={m} />
            ))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p className="mb-2 mt-4 px-2 text-xs font-semibold text-slate-400">
              オフライン — {offline.length}
            </p>
            {offline.map((m) => (
              <MemberItem key={m.id} member={m} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MemberItem({ member }: { member: Member }) {
  return (
    <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-1.5">
      <div className="relative">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#538bb0] text-xs font-bold text-white">
          {member.displayName.charAt(0).toUpperCase()}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            member.online ? "bg-green-500" : "bg-slate-300"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-700">{member.displayName}</p>
      </div>
      {member.role === "ADMIN" && (
        <span className="text-[10px] font-medium text-[#538bb0]">管理者</span>
      )}
    </div>
  );
}
