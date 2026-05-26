"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  items: { productNameSnapshot: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  preparing: "制作中",
  ready: "可取货",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-blue-50 text-blue-700",
  ready: "bg-green-50 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-400",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (!d.success) { router.push("/login?redirect=/orders"); return; }
    });
    fetch("/api/orders").then((r) => r.json()).then((d) => {
      if (d.success) setOrders(d.data);
      setLoading(false);
    });
  }, [router]);

  if (loading) return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/menu" className="text-sm text-gray-400 hover:text-gray-700 mb-4 block">← 返回</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400 mb-4">还没有订单</p>
          <Link href="/menu" className="text-sm text-gray-900 underline">去选购</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemsLabel = order.items
              .map((i) => `${i.productNameSnapshot} ×${i.quantity}`)
              .join("、");

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate mb-3">{itemsLabel || "—"}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{order.fulfillmentMethod === "delivery" ? "送货上门" : "到店自取"}</span>
                  <div className="flex items-center gap-3">
                    <span>{new Date(order.createdAt).toLocaleDateString("zh-CN")}</span>
                    <span className="font-semibold text-gray-900 text-sm">${Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
