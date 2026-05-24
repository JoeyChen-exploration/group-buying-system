import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        deliveryArea: true,
        addressDetail: true,
        languagePreference: true,
        createdAt: true,
      },
    });
    if (!user) return unauthorized();

    return ok(user);
  } catch {
    return serverError();
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  deliveryArea: z.string().optional(),
  addressDetail: z.string().optional(),
  languagePreference: z.enum(["zh", "en"]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ok({ message: parsed.error.errors[0].message }, 400);
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        deliveryArea: true,
        addressDetail: true,
      },
    });

    return ok(user);
  } catch {
    return serverError();
  }
}
