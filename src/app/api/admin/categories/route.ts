import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, serverError } from "@/lib/response";

const schema = z.object({
  nameZh: z.string().min(1, "分类名称不能为空").max(50),
  nameEn: z.string().max(50).optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export async function GET() {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return ok(categories);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { nameZh, nameEn, sortOrder, isVisible } = parsed.data;
    const category = await prisma.category.create({
      data: { nameZh, nameEn: nameEn || null, sortOrder, isVisible },
    });
    return ok(category, 201);
  } catch {
    return serverError();
  }
}
