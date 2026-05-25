"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface DeliveryRule {
  areaName: string;
  minOrderAmount: string;
  deliveryFee: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  deliveryArea: string | null;
  addressDetail: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rules, setRules] = useState<DeliveryRule[]>([]);

  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer" | "other">("bank_transfer");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (d.success) {
        setUser(d.data);
        if (d.data.deliveryArea) setDeliveryArea(d.data.deliveryArea);
        if (d.data.addressDetail) setDeliveryAddress(d.data.addressDetail);
      }
      setAuthLoading(false);
    });
    fetch("/api/delivery-rules").then((r) => r.json()).then((d) => {
      if (d.success) setRules(d.data);
    });
  }, []);

  const selectedRule = rules.find((r) => r.areaName === deliveryArea);
  const deliveryFee = fulfillmentMethod === "delivery" && selectedRule ? Number(selectedRule.deliveryFee) : 0;
  const minOrder = selectedRule ? Number(selectedRule.minOrderAmount) : 0;
  const minOrderMet = fulfillmentMethod !== "delivery" || !selectedRule || subtotal >= minOrder;
  const totalAmount = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!minOrderMet) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
          fulfillmentMethod,
          deliveryArea: fulfillmentMethod === "delivery" ? deliveryArea : undefined,
          deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress : undefined,
          paymentMethod,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      clearCart();
      router.push(`/orders/${data.data.orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;

  if (!user) {
    return (
      <div className="py-24 text-center max-w-sm mx-auto">
        <p className="text-gray-600 mb-4">请先登录后再结算</p>
        <a href="/login" className="inline-block bg-gray-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
          去登录
        </a>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-400 mb-4">购物车是空的</p>
        <a href="/" className="text-sm text-gray-900 underline">去选购</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">确认订单</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact info */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">联系信息</h2>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <div><span className="text-gray-400 block text-xs mb-0.5">姓名</span>{user.name}</div>
            <div><span className="text-gray-400 block text-xs mb-0.5">邮箱</span>{user.email}</div>
            {user.phone && <div><span className="text-gray-400 block text-xs mb-0.5">手机</span>{user.phone}</div>}
          </div>
        </section>

        {/* Fulfillment */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">取货方式</h2>
          <div className="flex gap-3">
            {(["pickup", "delivery"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFulfillmentMethod(m)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  fulfillmentMethod === m ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {m === "pickup" ? "到店自取" : "送货上门"}
              </button>
            ))}
          </div>

          {fulfillmentMethod === "delivery" && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">配送区域</label>
                <select
                  required
                  className="input"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                >
                  <option value="">请选择区域</option>
                  {rules.map((r) => (
                    <option key={r.areaName} value={r.areaName}>
                      {r.areaName}（配送费 ${Number(r.deliveryFee).toFixed(2)}，起送 ${Number(r.minOrderAmount).toFixed(2)}）
                    </option>
                  ))}
                </select>
              </div>
              {selectedRule && !minOrderMet && (
                <p className="text-xs text-red-500">
                  该区域最低起送金额为 ${minOrder.toFixed(2)}，当前合计 ${subtotal.toFixed(2)}，还差 ${(minOrder - subtotal).toFixed(2)}
                </p>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">详细地址</label>
                <input
                  required
                  className="input"
                  placeholder="街道门牌号、公寓号等"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">支付方式</h2>
          <div className="flex flex-col gap-2">
            {([
              { value: "bank_transfer", label: "银行转账" },
              { value: "cash", label: "现金" },
              { value: "other", label: "其他" },
            ] as const).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  className="accent-gray-900"
                />
                {label}
              </label>
            ))}
          </div>
          {paymentMethod === "bank_transfer" && (
            <p className="text-xs text-gray-400">下单后请按收到的账户信息完成转账，备注您的订单号</p>
          )}
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">备注 <span className="text-gray-400 font-normal">（选填）</span></label>
          <textarea
            className="input min-h-16 resize-none text-sm"
            placeholder="特殊要求、过敏信息等..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        {/* Order summary */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-800 mb-3">订单明细</h2>
          {items.map((item) => (
            <div key={`${item.productId}::${item.variantId ?? ""}`} className="flex justify-between text-gray-600">
              <span className="truncate mr-2">{item.productName}{item.variantName ? ` · ${item.variantName}` : ""} × {item.quantity}</span>
              <span className="shrink-0">${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>小计</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {fulfillmentMethod === "delivery" && (
              <div className="flex justify-between text-gray-600">
                <span>配送费</span><span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 text-base pt-1">
              <span>合计</span><span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !minOrderMet}
          className="w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "提交中..." : `提交订单 · $${totalAmount.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
