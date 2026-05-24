import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailToken } from "@/lib/email";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return fail("缺少验证令牌");

  const payload = await verifyEmailToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-token", req.url)
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.email !== payload.email) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  if (!user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  return NextResponse.redirect(
    new URL(`/login?email=${encodeURIComponent(user.email)}&verified=true`, req.url)
  );
}
