"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";

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
  deliveryArea: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "待确认", confirmed: "已确认", preparing: "制作中",
  ready: "可取货", completed: "已完成", cancelled: "已取消",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "现金", bank_transfer: "银行转账", other: "其他",
};

export default function OrderConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setError("订单不存在或无权查看"); return; }
        setOrder(d.data);
        setLoading(false);
      });
  }, [id]);

  if (loading && !error) return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;
  if (error) return (
    <div className="py-24 text-center">
      <p className="text-gray-500 mb-4">{error}</p>
      <Link href="/" className="text-sm text-gray-900 underline">返回首页</Link>
    </div>
  );
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">订单已提交</h1>
        <p className="text-sm text-gray-500 mt-1">我们将尽快确认您的订单</p>
        <p className="text-xs font-mono text-gray-400 mt-2 bg-gray-100 rounded px-3 py-1 inline-block">
          {order.orderNumber}
        </p>
      </div>

      {/* Order details */}
      <div className="space-y-4">
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">订单信息</h2>
          <Row label="状态" value={STATUS_LABEL[order.status] ?? order.status} />
          <Row label="取货方式" value={order.fulfillmentMethod === "delivery" ? "送货上门" : "到店自取"} />
          {order.deliveryArea && <Row label="配送区域" value={order.deliveryArea} />}
          {order.deliveryAddress && <Row label="详细地址" value={order.deliveryAddress} />}
          <Row label="支付方式" value={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} />
          {order.notes && <Row label="备注" value={order.notes} />}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">商品明细</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span className="truncate mr-2">
                  {item.productNameSnapshot}
                  {item.variantSnapshot ? ` · ${item.variantSnapshot.nameZh}` : ""}
                  {" "}× {item.quantity}
                </span>
                <span className="shrink-0">${Number(item.lineTotal).toFixed(2)}</span>
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
            <div className="flex justify-between font-semibold text-gray-900 text-base pt-1">
              <span>合计</span><span>${Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {order.paymentMethod === "bank_transfer" && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">银行转账提醒</p>
            <p className="text-xs text-amber-700">请完成转账并在备注中注明订单号 <strong>{order.orderNumber}</strong>，我们确认收款后将处理您的订单。</p>
          </section>
        )}
      </div>

      <Link
        href="/"
        className="block w-full mt-6 border border-gray-200 text-gray-700 text-sm font-medium py-3 rounded-xl text-center hover:bg-gray-50 transition-colors"
      >
        继续选购
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
