import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signVerifyToken, sendVerificationEmail } from "@/lib/email";
import { ok, fail, serverError } from "@/lib/response";

const schema = z.object({
  name: z.string().min(1, "姓名不能为空").max(50),
  email: z.string().email("邮箱格式不正确"),
  phone: z.string().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "密码至少 8 位"),
  deliveryArea: z.string().optional(),
  addressDetail: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.errors[0].message);
    }

    const { name, email, phone, password, deliveryArea, addressDetail } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail("该邮箱已注册");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "customer",
        deliveryArea: deliveryArea || null,
        addressDetail: addressDetail || null,
      },
    });

    // Send verification email (non-blocking — don't fail registration if SMTP errors)
    try {
      const token = await signVerifyToken(user.id, user.email);
      await sendVerificationEmail(user.email, user.name, token);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return ok({ email: user.email }, 201);
  } catch {
    return serverError();
  }
}
