import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtp, otpExpiresAt, sendVerificationCode } from "@/lib/email";
import { ok, fail, serverError } from "@/lib/response";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail("邮箱不存在", 404);
    if (user.emailVerifiedAt) return fail("邮箱已验证，无需重新发送");

    // Rate limit: don't resend if last code was sent less than 60 seconds ago
    if (
      user.emailVerificationExpires &&
      new Date() < new Date(user.emailVerificationExpires.getTime() - 9 * 60 * 1000)
    ) {
      return fail("请稍后再试（60 秒内只能发送一次）", 429);
    }

    const code = generateOtp();
    const expires = otpExpiresAt();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationCode: code, emailVerificationExpires: expires },
    });

    try {
      await sendVerificationCode(user.email, user.name, code);
    } catch (emailErr) {
      console.error("Failed to resend verification code:", emailErr);
      return fail("邮件发送失败，请稍后重试");
    }

    return ok({ message: "验证码已重新发送" });
  } catch {
    return serverError();
  }
}
