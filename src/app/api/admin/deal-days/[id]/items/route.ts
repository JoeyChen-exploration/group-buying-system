import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const createSchema = z.object({
  productId: z.string().min(1, "请选择商品"),
  variantId: z.string().optional(),
  dealPrice: z.number().min(0, "价格不能为负"),
  totalQuantity: z.number().int().min(1, "数量至少为 1"),
  perOrderLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: dealDayId } = await params;
    const dealDay = await prisma.dealDay.findUnique({ where: { id: dealDayId } });
    if (!dealDay) return notFound("优惠日不存在");

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { totalQuantity, variantId, ...rest } = parsed.data;

    const existing = await prisma.dealDayItem.findFirst({
      where: {
        dealDayId,
        productId: rest.productId,
        variantId: variantId ?? null,
      },
    });
    if (existing) return fail("该商品（规格）已在本活动中");

    const item = await prisma.dealDayItem.create({
      data: {
        ...rest,
        variantId: variantId ?? null,
        dealDayId,
        totalQuantity,
        remainingQuantity: totalQuantity,
      },
      include: {
        product: { select: { id: true, nameZh: true } },
        variant: { select: { id: true, nameZh: true } },
      },
    });

    return ok(item);
  } catch {
    return serverError();
  }
}
