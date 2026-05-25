import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, serverError } from "@/lib/response";

const variantSchema = z.object({
  nameZh: z.string().min(1, "规格名称不能为空"),
  size: z.string().optional().or(z.literal("")),
  flavor: z.string().optional().or(z.literal("")),
  filling: z.string().optional().or(z.literal("")),
  extraOptions: z.record(z.string()).optional(),
  priceDelta: z.number().default(0),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

const productSchema = z.object({
  nameZh: z.string().min(1, "商品名称不能为空").max(100),
  nameEn: z.string().max(100).optional().or(z.literal("")),
  descriptionZh: z.string().optional().or(z.literal("")),
  descriptionEn: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, "请选择分类"),
  images: z.array(z.string()).default([]),
  basePrice: z.number().positive("价格必须大于 0"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  isHidden: z.boolean().default(false),
  variants: z.array(variantSchema).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const sortField = searchParams.get("sortField") ?? "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
    const pageSize = 20;

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status: status as "active" | "inactive" | "archived" } : {}),
      ...(search ? { nameZh: { contains: search } } : {}),
    };

    const orderBy = (() => {
      if (sortField === "nameZh") return { nameZh: sortDir };
      if (sortField === "basePrice") return { basePrice: sortDir };
      if (sortField === "status") return { status: sortDir };
      if (sortField === "category") return { category: { nameZh: sortDir } };
      return { createdAt: sortDir };
    })();

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, nameZh: true } },
          variants: { where: { status: "active" }, orderBy: { priceDelta: "asc" } },
          _count: { select: { orderItems: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return ok({ products, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { variants, nameEn, descriptionZh, descriptionEn, ...productData } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        nameEn: nameEn || null,
        descriptionZh: descriptionZh || null,
        descriptionEn: descriptionEn || null,
        variants: {
          create: variants.map((v) => ({
            nameZh: v.nameZh,
            size: v.size || null,
            flavor: v.flavor || null,
            filling: v.filling || null,
            extraOptions: v.extraOptions ?? undefined,
            priceDelta: v.priceDelta,
            status: v.status,
          })),
        },
      },
      include: { variants: true, category: true },
    });

    return ok(product, 201);
  } catch {
    return serverError();
  }
}
