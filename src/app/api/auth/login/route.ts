import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, createSessionCookie } from "@/lib/auth";
import { ok, fail, serverError } from "@/lib/response";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail("邮箱或密码错误", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail("邮箱或密码错误", 401);

    if (!user.emailVerifiedAt) {
      return fail("请先验证邮箱，验证邮件已发送至你的邮箱", 403);
    }

    const token = await signToken({ userId: user.id, role: user.role, name: user.name });
    const cookieStore = await cookies();
    cookieStore.set(createSessionCookie(token));

    return ok({ id: user.id, name: user.name, role: user.role });
  } catch {
    return serverError();
  }
}
