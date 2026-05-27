import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready:     ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: true,
      },
    });
    if (!order) return notFound("订单不存在");

    return ok(order);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!order) return notFound("订单不存在");

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return fail(`不能从 ${order.status} 转为 ${parsed.data.status}`);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true, orderNumber: true },
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}
