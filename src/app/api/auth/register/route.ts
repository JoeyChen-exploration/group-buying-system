import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, createSessionCookie } from "@/lib/auth";
import { ok, fail, serverError } from "@/lib/response";
import { cookies } from "next/headers";

const schema = z.object({
  name: z.string().min(1, "姓名不能为空").max(50),
  phone: z.string().min(8, "手机号格式不正确").max(20),
  email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
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

    const { name, phone, email, password, deliveryArea, addressDetail } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });
    if (existing) {
      return fail(existing.phone === phone ? "该手机号已注册" : "该邮箱已注册");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
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
