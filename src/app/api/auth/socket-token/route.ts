import { NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/auth";

// Socket.io用にトークンをクライアントに返す
export async function GET() {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
