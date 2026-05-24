import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const updateSchema = z.object({
  nameZh: z.string().min(1).max(100).optional(),
  nameEn: z.string().max(100).optional().or(z.literal("")),
  descriptionZh: z.string().optional().or(z.literal("")),
  descriptionEn: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  basePrice: z.number().positive().optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  isHidden: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { priceDelta: "asc" } },
      },
    });
    if (!product) return notFound("商品不存在");
    return ok(product);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return notFound("商品不存在");

    const { nameEn, descriptionZh, descriptionEn, ...rest } = parsed.data;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(nameEn !== undefined ? { nameEn: nameEn || null } : {}),
        ...(descriptionZh !== undefined ? { descriptionZh: descriptionZh || null } : {}),
        ...(descriptionEn !== undefined ? { descriptionEn: descriptionEn || null } : {}),
      },
      include: { variants: true, category: true },
    });
    return ok(product);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) return notFound("商品不存在");

    // Soft delete if product has order history, hard delete otherwise
    if (existing._count.orderItems > 0) {
      await prisma.product.update({ where: { id }, data: { status: "archived" } });
      return ok({ message: "商品已归档（存在历史订单，无法彻底删除）" });
    }

    await prisma.product.delete({ where: { id } });
    return ok({ message: "已删除" });
  } catch {
    return serverError();
  }
}
