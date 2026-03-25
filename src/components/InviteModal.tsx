"use client";

import { useState } from "react";
import Modal from "./Modal";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function InviteModal({ open, onClose, workspaceId }: InviteModalProps) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteUrl(`${window.location.origin}/invite/${data.token}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="メンバー招待">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          招待リンクを生成して、チームメンバーに共有してください。
        </p>

        {inviteUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg bg-[#538bb0] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3d6f94]"
              >
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <p className="text-xs text-slate-400">有効期限: 7日間</p>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-[#538bb0] px-4 py-2 font-semibold text-white hover:bg-[#3d6f94] disabled:opacity-50"
          >
            {loading ? "生成中..." : "招待リンクを生成"}
          </button>
        )}
      </div>
    </Modal>
  );
}
