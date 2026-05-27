import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const patchSchema = z.object({
  dealPrice: z.number().min(0).optional(),
  totalQuantity: z.number().int().min(1).optional(),
  perOrderLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).nullable().optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: dealDayId, itemId } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const item = await prisma.dealDayItem.findFirst({ where: { id: itemId, dealDayId } });
    if (!item) return notFound("商品不存在");

    const { totalQuantity, dealPrice, perOrderLimit, perUserLimit, status } = parsed.data;

    const updateData: Prisma.DealDayItemUpdateInput = {};
    if (dealPrice !== undefined) updateData.dealPrice = dealPrice;
    if (perOrderLimit !== undefined) updateData.perOrderLimit = perOrderLimit;
    if (perUserLimit !== undefined) updateData.perUserLimit = perUserLimit;
    if (status !== undefined) updateData.status = status;

    if (totalQuantity !== undefined) {
      if (totalQuantity < item.soldQuantity) {
        return fail(`总量不能少于已售数量（${item.soldQuantity}）`);
      }
      updateData.totalQuantity = totalQuantity;
      updateData.remainingQuantity = totalQuantity - item.soldQuantity;
    }

    const updated = await prisma.dealDayItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        product: { select: { id: true, nameZh: true } },
        variant: { select: { id: true, nameZh: true } },
      },
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: dealDayId, itemId } = await params;
    const item = await prisma.dealDayItem.findFirst({ where: { id: itemId, dealDayId } });
    if (!item) return notFound("商品不存在");
    if (item.soldQuantity > 0) return fail("已有订单购买该商品，无法删除");

    await prisma.dealDayItem.delete({ where: { id: itemId } });
    return ok({ id: itemId });
  } catch {
    return serverError();
  }
}
