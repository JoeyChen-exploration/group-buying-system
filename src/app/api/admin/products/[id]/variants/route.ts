import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, notFound, serverError } from "@/lib/response";

const schema = z.object({
  nameZh: z.string().min(1, "规格名称不能为空"),
  size: z.string().optional().or(z.literal("")),
  flavor: z.string().optional().or(z.literal("")),
  filling: z.string().optional().or(z.literal("")),
  extraOptions: z.record(z.string()).optional(),
  priceDelta: z.number().default(0),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAuth(["admin"]);
    if (error) return error;

    const { id: productId } = await params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return notFound("商品不存在");

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { size, flavor, filling, ...rest } = parsed.data;
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size: size || null,
        flavor: flavor || null,
        filling: filling || null,
        ...rest,
      },
    });
    return ok(variant, 201);
  } catch {
    return serverError();
  }
}
