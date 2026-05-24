import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, createSessionCookie } from "@/lib/auth";
import { ok, fail, serverError } from "@/lib/response";
import { cookies } from "next/headers";

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

    const token = await signToken({ userId: user.id, role: user.role, name: user.name });
    const cookieStore = await cookies();
    cookieStore.set(createSessionCookie(token));

    return ok({ id: user.id, name: user.name, role: user.role }, 201);
  } catch {
    return serverError();
  }
}
