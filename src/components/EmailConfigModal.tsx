"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

interface EmailConfigModalProps {
  open: boolean;
  onClose: () => void;
  channelId: string;
  onSaved: () => void;
}

export default function EmailConfigModal({
  open,
  onClose,
  channelId,
  onSaved,
}: EmailConfigModalProps) {
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  // 既存設定を読み込み
  useEffect(() => {
    if (!open || !channelId) return;
    fetch(`/api/channels/${channelId}/email-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setImapHost(data.config.imapHost || "");
          setImapPort(String(data.config.imapPort || 993));
          setImapUser(data.config.imapUser || "");
          setSmtpHost(data.config.smtpHost || "");
          setSmtpPort(String(data.config.smtpPort || 587));
          setSmtpUser(data.config.smtpUser || "");
          setEmailAddress(data.config.emailAddress || "");
          setDisplayName(data.config.displayName || "");
        }
      });
  }, [open, channelId]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/channels/${channelId}/email-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imapHost,
          imapPort: parseInt(imapPort),
          imapUser,
          imapPass,
          imapTls: true,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "通信エラーが発生しました" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/channels/${channelId}/email-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imapHost,
          imapPort: parseInt(imapPort),
          imapUser,
          imapPass,
          imapTls: true,
          smtpHost: smtpHost || imapHost,
          smtpPort: parseInt(smtpPort),
          smtpUser: smtpUser || imapUser,
          smtpPass: smtpPass || imapPass,
          smtpTls: true,
          emailAddress: emailAddress || imapUser,
          displayName: displayName || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存に失敗しました");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  // Gmailプリセット
  function applyGmailPreset() {
    setImapHost("imap.gmail.com");
    setImapPort("993");
    setSmtpHost("smtp.gmail.com");
    setSmtpPort("587");
  }

  return (
    <Modal open={open} onClose={onClose} title="メール連携設定">
      <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* プリセット */}
        <div>
          <button
            type="button"
            onClick={applyGmailPreset}
            className="text-xs text-[#538bb0] hover:underline"
          >
            Gmail設定を自動入力
          </button>
        </div>

        {/* メールアドレス */}
        <div>
          <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            required
            placeholder="zeimu@example.com"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">表示名（任意）</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="税務チーム"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none focus:ring-1 focus:ring-[#538bb0]"
          />
        </div>

        {/* IMAP設定 */}
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-500">受信（IMAP）</legend>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                required
                placeholder="imap.gmail.com"
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none"
              />
            </div>
            <div>
              <input
                type="number"
                value={imapPort}
                onChange={(e) => setImapPort(e.target.value)}
                placeholder="993"
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-[#538bb0] focus:outline-none"
              />
            </div>
          </div>
          <input
            type="text"
            value={imapUser}
            onChange={(e) => setImapUser(e.target.value)}
            required
            placeholder="ユーザー名"
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none"
          />
          <input
            type="password"
            value={imapPass}
            onChange={(e) => setImapPass(e.target.value)}
            required
            placeholder="パスワード（アプリパスワード推奨）"
            className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none"
          />
        </fieldset>

        {/* SMTP設定 */}
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-500">送信（SMTP）</legend>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com（空欄ならIMAPと同じ）"
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#538bb0] focus:outline-none"
              />
            </div>
            <div>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-[#538bb0] focus:outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* 接続テスト */}
        {testResult && (
          <div
            className={`rounded-lg p-3 text-sm ${
              testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {testResult.message}
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !imapHost || !imapUser || !imapPass}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? "テスト中..." : "接続テスト"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#538bb0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6f94] disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
