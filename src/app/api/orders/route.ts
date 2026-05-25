import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, serverError } from "@/lib/response";

const schema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
  })).min(1, "购物车不能为空"),
  fulfillmentMethod: z.enum(["pickup", "delivery"]),
  deliveryArea: z.string().optional(),
  deliveryAddress: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer", "other"]),
  notes: z.string().optional(),
});

function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `YW${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { items, fulfillmentMethod, deliveryArea, deliveryAddress, paymentMethod, notes } = parsed.data;

    if (fulfillmentMethod === "delivery") {
      if (!deliveryArea) return fail("请选择配送区域");
      if (!deliveryAddress?.trim()) return fail("请填写详细地址");
    }

    // Batch-fetch and validate products + variants from DB
    const productIds = [...new Set(items.map((i) => i.productId))];
    const variantIds = [...new Set(items.filter((i) => i.variantId).map((i) => i.variantId!))];

    const [dbProducts, dbVariants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds }, status: "active" } }),
      variantIds.length
        ? prisma.productVariant.findMany({ where: { id: { in: variantIds }, status: "active" } })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    let subtotal = 0;
    const orderItems: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

    for (const { productId, variantId, quantity } of items) {
      const product = productMap.get(productId);
      if (!product) return fail("部分商品已下架或不存在，请刷新后重试");

      const variant = variantId ? variantMap.get(variantId) : undefined;
      if (variantId && !variant) return fail("部分规格已下架或不存在，请刷新后重试");
      if (variant && variant.productId !== productId) return fail("规格与商品不匹配");

      const unitPrice = Number(product.basePrice) + (variant ? Number(variant.priceDelta) : 0);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId,
        variantId: variantId ?? null,
        productNameSnapshot: product.nameZh,
        variantSnapshot: variant
          ? { id: variant.id, nameZh: variant.nameZh, size: variant.size, flavor: variant.flavor, filling: variant.filling, priceDelta: Number(variant.priceDelta) }
          : Prisma.DbNull,
        quantity,
        unitPrice,
        lineTotal,
        isDealDayItem: false,
      });
    }

    // Delivery fee & min-order check
    let deliveryFee = 0;
    if (fulfillmentMethod === "delivery") {
      const rule = await prisma.deliveryRule.findFirst({ where: { areaName: deliveryArea, isEnabled: true } });
      if (!rule) return fail("所选区域暂不支持配送，请选择其他区域");
      if (subtotal < Number(rule.minOrderAmount)) {
        return fail(`该区域最低起送金额为 $${Number(rule.minOrderAmount).toFixed(2)}，当前合计 $${subtotal.toFixed(2)}`);
      }
      deliveryFee = Number(rule.deliveryFee);
    }

    const totalAmount = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session!.userId,
        orderType: "regular",
        status: "pending",
        fulfillmentMethod,
        subtotal,
        deliveryFee,
        totalAmount,
        paymentMethod,
        deliveryArea: deliveryArea ?? null,
        deliveryAddress: deliveryAddress ?? null,
        notes: notes ?? null,
        items: { create: orderItems },
      },
    });

    return ok({ orderId: order.id, orderNumber: order.orderNumber }, 201);
  } catch {
    return serverError();
  }
}
