import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const patchSchema = z.object({
  titleZh: z.string().min(1).optional(),
  titleEn: z.string().optional(),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  activityStartAt: z.string().datetime().optional(),
  activityEndAt: z.string().datetime().optional(),
  preorderDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  deliveryFee: z.number().min(0).optional(),
  showCountdown: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { id } = await params;
    const dealDay = await prisma.dealDay.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, nameZh: true, basePrice: true } },
            variant: { select: { id: true, nameZh: true, priceDelta: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!dealDay) return notFound("优惠日不存在");
    return ok(dealDay);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const existing = await prisma.dealDay.findUnique({ where: { id } });
    if (!existing) return notFound("优惠日不存在");

    const { preorderDeliveryDate, activityStartAt, activityEndAt, ...rest } = parsed.data;

    const startAt = activityStartAt ? new Date(activityStartAt) : existing.activityStartAt;
    const endAt = activityEndAt ? new Date(activityEndAt) : existing.activityEndAt;
    if (endAt <= startAt) return fail("结束时间必须晚于开始时间");

    const updated = await prisma.dealDay.update({
      where: { id },
      data: {
        ...rest,
        ...(activityStartAt ? { activityStartAt: new Date(activityStartAt) } : {}),
        ...(activityEndAt ? { activityEndAt: new Date(activityEndAt) } : {}),
        ...(preorderDeliveryDate ? { preorderDeliveryDate: new Date(preorderDeliveryDate) } : {}),
      },
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.dealDay.findUnique({
      where: { id },
      select: { _count: { select: { orders: true } } },
    });
    if (!existing) return notFound("优惠日不存在");
    if (existing._count.orders > 0) return fail("该活动已有订单，无法删除");

    await prisma.dealDay.delete({ where: { id } });
    return ok({ id });
  } catch {
    return serverError();
  }
}
