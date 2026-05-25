import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { id, status: "active", isHidden: false },
      include: {
        category: { select: { id: true, nameZh: true } },
        variants: { where: { status: "active" }, orderBy: { priceDelta: "asc" } },
      },
    });
    if (!product) return notFound("商品不存在");
    return ok(product);
  } catch {
    return serverError();
  }
}
