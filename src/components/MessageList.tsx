"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/socket";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
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
        return (
          <div key={msg.id} className="mb-3 flex items-start gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                msg.isAi ? "bg-emerald-500" : "bg-[#538bb0]"
              }`}
            >
              {msg.isAi ? "AI" : msg.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-semibold ${isMe ? "text-[#538bb0]" : "text-slate-800"}`}>
                  {msg.displayName}
                  {msg.isAi && <span className="ml-1 text-xs text-emerald-600">AI</span>}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {msg.content}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
