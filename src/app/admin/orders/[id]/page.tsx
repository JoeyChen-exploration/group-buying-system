"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  variantSnapshot: { nameZh: string } | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  subtotal: string;
  deliveryFee: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryArea: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "待确认", confirmed: "已确认", preparing: "制作中",
  ready: "可取货", completed: "已完成", cancelled: "已取消",
};

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  preparing: "bg-blue-50 text-blue-700 border-blue-200",
  ready:     "bg-green-50 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-500 border-gray-200",
  cancelled: "bg-red-50 text-red-400 border-red-200",
};

const NEXT_ACTIONS: Record<string, { status: string; label: string; style: string }[]> = {
  pending:   [{ status: "confirmed", label: "确认订单", style: "bg-blue-600 hover:bg-blue-700 text-white" }, { status: "cancelled", label: "取消订单", style: "border border-red-300 text-red-500 hover:bg-red-50" }],
  confirmed: [{ status: "preparing", label: "开始制作", style: "bg-blue-600 hover:bg-blue-700 text-white" }, { status: "cancelled", label: "取消订单", style: "border border-red-300 text-red-500 hover:bg-red-50" }],
  preparing: [{ status: "ready", label: "标记可取货", style: "bg-green-600 hover:bg-green-700 text-white" }, { status: "cancelled", label: "取消订单", style: "border border-red-300 text-red-500 hover:bg-red-50" }],
  ready:     [{ status: "completed", label: "完成订单", style: "bg-gray-900 hover:bg-gray-700 text-white" }, { status: "cancelled", label: "取消订单", style: "border border-red-300 text-red-500 hover:bg-red-50" }],
  completed: [],
  cancelled: [],
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "现金", bank_transfer: "银行转账", other: "其他",
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrder(d.data); setLoading(false); });
  }, [id]);

  async function handleStatus(status: string) {
    if (!order) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOrder((prev) => prev ? { ...prev, status: data.data.status } : prev);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-12 text-center px-4">加载中...</p>;
  if (!order) return <p className="text-sm text-gray-400 py-12 text-center px-4">订单不存在</p>;

  const actions = NEXT_ACTIONS[order.status] ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-gray-700 mb-4 block"
      >
        ← 返回
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="font-mono text-xs text-gray-400 mb-1">{order.orderNumber}</p>
          <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleString("zh-CN")}
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full border ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">顾客信息</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <Row label="姓名" value={order.user.name} />
            <Row label="邮箱" value={order.user.email} />
            {order.user.phone && <Row label="手机" value={order.user.phone} />}
          </div>
        </section>

        {/* Fulfillment */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">配送信息</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <Row label="取货方式" value={order.fulfillmentMethod === "delivery" ? "送货上门" : "到店自取"} />
            <Row label="支付方式" value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} />
            {order.deliveryArea && <Row label="配送区域" value={order.deliveryArea} />}
            {order.deliveryAddress && <Row label="详细地址" value={order.deliveryAddress} />}
            {order.notes && <Row label="备注" value={order.notes} />}
          </div>
        </section>

        {/* Items */}
        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">商品明细</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.productNameSnapshot}
                  {item.variantSnapshot ? ` · ${item.variantSnapshot.nameZh}` : ""}
                  <span className="text-gray-400"> × {item.quantity}</span>
                </span>
                <span className="text-gray-800 font-medium">${Number(item.lineTotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>小计</span><span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>配送费</span><span>${Number(order.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>合计</span><span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        {actions.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">更新状态</h2>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="flex gap-2 flex-wrap">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatus(action.status)}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${action.style}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-xs block">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
