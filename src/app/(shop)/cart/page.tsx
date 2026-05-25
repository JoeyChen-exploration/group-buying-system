"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-400 mb-4">购物车是空的</p>
        <Link href="/" className="text-sm text-gray-900 underline">去选购</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">购物车</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={`${item.productId}::${item.variantId ?? ""}`} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
            {/* Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.productName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">◻</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
              {item.variantName && (
                <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
              )}
              <p className="text-sm text-gray-900 mt-1">${item.unitPrice.toFixed(2)}</p>
            </div>

            {/* Qty + Remove */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => removeItem(item.productId, item.variantId)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                删除
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.productId, item.variantId, -1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm leading-none"
                >−</button>
                <span className="px-2 py-1 text-sm text-gray-900 min-w-[1.5rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.variantId, 1)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 text-sm leading-none"
                >+</button>
              </div>
              <p className="text-xs text-gray-500">${(item.unitPrice * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>小计</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400">配送费将在结算时根据区域计算</p>
      </div>

      <Link
        href="/checkout"
        className="block w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-xl text-center hover:bg-gray-700 transition-colors"
      >
        去结算
      </Link>
    </div>
  );
}
