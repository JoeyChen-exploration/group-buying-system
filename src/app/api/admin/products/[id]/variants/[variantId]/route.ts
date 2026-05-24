import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const schema = z.object({
  nameZh: z.string().min(1).optional(),
  size: z.string().optional().or(z.literal("")),
  flavor: z.string().optional().or(z.literal("")),
  filling: z.string().optional().or(z.literal("")),
  extraOptions: z.record(z.string()).optional(),
  priceDelta: z.number().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
});

type Params = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: productId, variantId } = await params;
    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!existing) return notFound("规格不存在");

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { size, flavor, filling, ...rest } = parsed.data;
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...rest,
        ...(size !== undefined ? { size: size || null } : {}),
        ...(flavor !== undefined ? { flavor: flavor || null } : {}),
        ...(filling !== undefined ? { filling: filling || null } : {}),
      },
    });
    return ok(variant);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: productId, variantId } = await params;
    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) return notFound("规格不存在");

    if (existing._count.orderItems > 0) {
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { status: "archived" },
      });
      return ok({ message: "规格已归档（存在历史订单）" });
    }

    await prisma.productVariant.delete({ where: { id: variantId } });
    return ok({ message: "已删除" });
  } catch {
    return serverError();
  }
}
