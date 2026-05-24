import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const schema = z.object({
  nameZh: z.string().min(1).max(50).optional(),
  nameEn: z.string().max(50).optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFound("分类不存在");

    const { nameEn, ...rest } = parsed.data;
    const category = await prisma.category.update({
      where: { id },
      data: { ...rest, nameEn: nameEn === "" ? null : nameEn },
    });
    return ok(category);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id } = await params;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) return notFound("分类不存在");
    if (existing._count.products > 0) {
      return fail(`该分类下有 ${existing._count.products} 个商品，无法删除`);
    }

    await prisma.category.delete({ where: { id } });
    return ok({ message: "已删除" });
  } catch {
    return serverError();
  }
}
