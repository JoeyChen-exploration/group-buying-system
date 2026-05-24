import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, createSessionCookie } from "@/lib/auth";
import { ok, fail, serverError } from "@/lib/response";
import { cookies } from "next/headers";

const schema = z.object({
  phone: z.string().min(1, "请输入手机号"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message);
    }

    const { phone, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return fail("手机号或密码错误", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail("手机号或密码错误", 401);

    const token = await signToken({ userId: user.id, role: user.role, name: user.name });
    const cookieStore = await cookies();
    cookieStore.set(createSessionCookie(token));

    return ok({ id: user.id, name: user.name, role: user.role });
  } catch {
    return serverError();
  }
}
