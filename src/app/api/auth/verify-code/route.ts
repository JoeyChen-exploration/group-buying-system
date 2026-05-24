import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, serverError } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "验证码为 6 位数字"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { email, code } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail("邮箱不存在", 404);
    if (user.emailVerifiedAt) return ok({ message: "邮箱已验证" });

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return fail("验证码无效，请重新发送");
    }
    if (new Date() > user.emailVerificationExpires) {
      return fail("验证码已过期，请重新发送");
    }
    if (user.emailVerificationCode !== code) {
      return fail("验证码错误");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    return ok({ email: user.email });
  } catch {
    return serverError();
  }
}
