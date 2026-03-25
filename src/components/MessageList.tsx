"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/socket";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onEmailReply?: (message: ChatMessage) => void;
}

export default function MessageList({ messages, currentUserId, onEmailReply }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        まだメッセージはありません。最初のメッセージを送りましょう！
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {messages.map((msg) => {
        const isMe = msg.userId === currentUserId;
        const isEmail = msg.isEmail;

        return (
          <div key={msg.id} className="mb-3 flex items-start gap-3">
            {/* アバター */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                isEmail
                  ? "bg-amber-500"
                  : msg.isAi
                    ? "bg-emerald-500"
                    : "bg-[#538bb0]"
              }`}
            >
              {isEmail ? "\u2709" : msg.isAi ? "AI" : msg.displayName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              {/* ヘッダー */}
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isEmail
                      ? "text-amber-700"
                      : isMe
                        ? "text-[#538bb0]"
                        : "text-slate-800"
                  }`}
                >
                  {msg.displayName}
                  {isEmail && (
                    <span className="ml-1 text-xs font-normal text-amber-600">
                      メール
                    </span>
                  )}
                  {msg.isAi && (
                    <span className="ml-1 text-xs text-emerald-600">AI</span>
                  )}
                </span>
                {isEmail && msg.fromEmail && (
                  <span className="text-xs text-slate-400">&lt;{msg.fromEmail}&gt;</span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* メール件名 */}
              {isEmail && msg.subject && (
                <p className="mb-1 text-xs font-medium text-slate-500">
                  件名: {msg.subject}
                </p>
              )}

              {/* 本文 */}
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {msg.content}
              </p>

              {/* メール返信ボタン */}
              {isEmail && onEmailReply && (
                <button
                  onClick={() => onEmailReply(msg)}
                  className="mt-1 text-xs text-amber-600 hover:text-amber-800 hover:underline"
                >
                  {"\u2709"} メールで返信
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
