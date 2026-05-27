import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const fulfillment = searchParams.get("fulfillment") ?? undefined;

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(fulfillment ? { fulfillmentMethod: fulfillment as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        fulfillmentMethod: true,
        subtotal: true,
        deliveryFee: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: { productNameSnapshot: true, quantity: true },
          take: 2,
        },
        _count: { select: { items: true } },
      },
    });

    return ok(orders);
  } catch {
    return serverError();
  }
}
