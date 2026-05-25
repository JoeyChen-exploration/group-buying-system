import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get("categoryId");

    const products = await prisma.product.findMany({
      where: {
        status: "active",
        isHidden: false,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { id: true, nameZh: true } },
        variants: { where: { status: "active" }, orderBy: { priceDelta: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(products);
  } catch {
    return serverError();
  }
}
