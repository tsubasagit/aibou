import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { workspaceId } = await request.json();

  const invite = await prisma.invite.create({
    data: {
      workspaceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日
    },
  });

  return NextResponse.json({ token: invite.token });
}
