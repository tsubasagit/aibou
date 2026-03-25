export interface ServerToClientEvents {
  "message:new": (message: ChatMessage) => void;
  "message:updated": (message: ChatMessage) => void;
  "channel:joined": (data: { channelId: string; userId: string; displayName: string }) => void;
  "channel:left": (data: { channelId: string; userId: string }) => void;
  "user:typing": (data: { channelId: string; userId: string; displayName: string }) => void;
  "user:stopTyping": (data: { channelId: string; userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "message:send": (data: { channelId: string; content: string; threadId?: string }) => void;
  "channel:join": (channelId: string) => void;
  "channel:leave": (channelId: string) => void;
  "user:typing": (channelId: string) => void;
  "user:stopTyping": (channelId: string) => void;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  threadId: string | null;
  isAi: boolean;
  createdAt: string;
}
