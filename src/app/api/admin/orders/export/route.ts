import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { fail } from "@/lib/response";

const STATUS_LABEL: Record<string, string> = {
  pending: "待确认", confirmed: "已确认", preparing: "制作中",
  ready: "可取货", completed: "已完成", cancelled: "已取消",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "现金", bank_transfer: "银行转账", other: "其他",
};

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["admin", "staff"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) return fail("请提供 from 和 to 参数");

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return fail("日期格式无效");

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { select: { productNameSnapshot: true, variantSnapshot: true, quantity: true, unitPrice: true, lineTotal: true } },
    },
  });

  const header = [
    "订单号", "下单时间", "顾客姓名", "邮箱", "手机",
    "取货方式", "配送区域", "配送地址",
    "支付方式", "支付状态", "订单状态",
    "商品明细", "小计", "配送费", "合计", "备注",
  ];

  const rows = orders.map((o) => {
    const itemsText = o.items
      .map((i) => {
        const variant = (i.variantSnapshot as { nameZh?: string } | null)?.nameZh;
        return `${i.productNameSnapshot}${variant ? `(${variant})` : ""} ×${i.quantity}`;
      })
      .join("；");

    return [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString("zh-CN"),
      o.user.name,
      o.user.email,
      o.user.phone ?? "",
      o.fulfillmentMethod === "delivery" ? "送货上门" : "到店自取",
      o.deliveryArea ?? "",
      o.deliveryAddress ?? "",
      o.paymentMethod ? (PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod) : "",
      o.paymentStatus === "paid" ? "已付款" : "未付款",
      STATUS_LABEL[o.status] ?? o.status,
      itemsText,
      Number(o.subtotal).toFixed(2),
      Number(o.deliveryFee).toFixed(2),
      Number(o.totalAmount).toFixed(2),
      o.notes ?? "",
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  ws["!cols"] = [
    { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 24 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 24 },
    { wch: 10 }, { wch: 8 }, { wch: 8 },
    { wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "订单");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `orders-${from}-to-${to}.xlsx`;

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
