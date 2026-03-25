"use client";

import { useState } from "react";
import Modal from "./Modal";

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreated: () => void;
}

export default function CreateChannelModal({
  open,
  onClose,
  workspaceId,
  onCreated,
}: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/\s+/g, "-"),
          description,
          workspaceId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
        return;
      }

      setName("");
      setDescription("");
      onCreated();
      onClose();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="チャンネル作成">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            チャンネル名
          </label>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-slate-400">#</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
              placeholder="design"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            説明（任意）
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
            placeholder="デザインに関する議論"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg bg-[#538bb0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6f94] disabled:opacity-50"
          >
            {loading ? "作成中..." : "作成"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
