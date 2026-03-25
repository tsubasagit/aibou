"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { ChatMessage } from "@/types/socket";

interface EmailReplyModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  replyTo: ChatMessage | null;
  onSent: () => void;
}

export default function EmailReplyModal({
  open,
  onClose,
  channelId,
  replyTo,
  onSent,
}: EmailReplyModalProps) {
  const [to, setTo] = useState(replyTo?.fromEmail || "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(
    replyTo?.subject ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : ""
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // replyToが変わったら初期値を更新
  useState(() => {
    if (replyTo) {
      setTo(replyTo.fromEmail || "");
      setSubject(
        replyTo.subject ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : ""
      );
    }
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const toList = to.split(/[,;\s]+/).filter(Boolean);
      const ccList = cc ? cc.split(/[,;\s]+/).filter(Boolean) : [];

      const res = await fetch(`/api/channels/${channelId}/email-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toList,
          cc: ccList,
          subject,
          content,
          inReplyToMessageId: replyTo?.id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "送信に失敗しました");
        return;
      }

      setContent("");
      onSent();
      onClose();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="メール返信">
      <form onSubmit={handleSend} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">CC（任意）</label>
          <input
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="カンマ区切りで複数可"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">件名</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">本文</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            className="mt-1 block w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading || !to || !content}
            className="rounded-lg bg-[#538bb0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6f94] disabled:opacity-50"
          >
            {loading ? "送信中..." : "メール送信"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
