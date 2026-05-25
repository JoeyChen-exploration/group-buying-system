import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, notFound, forbidden, serverError } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) return notFound("订单不存在");

    // Customers can only see their own orders; staff/admin can see all
    if (session!.role === "customer" && order.userId !== session!.userId) {
      return forbidden();
    }

    return ok(order);
  } catch {
    return serverError();
  }
}
