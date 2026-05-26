"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import LoginPromptToast from "@/components/shop/LoginPromptToast";

interface Category { id: string; nameZh: string; }
interface Variant { id: string; priceDelta: string; }
interface Product {
  id: string;
  nameZh: string;
  basePrice: string;
  images: string[];
  category: { id: string; nameZh: string };
  variants: Variant[];
}

export default function ShopPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const onNeedLogin = useCallback(() => setShowLoginPrompt(true), []);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([cats, prods]) => {
      if (cats.success) setCategories(cats.data);
      if (prods.success) setProducts(prods.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => activeCategory ? products.filter((p) => p.category.id === activeCategory) : products,
    [products, activeCategory]
  );

  if (loading) {
    return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;
  }

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-7 overflow-x-auto border-b border-gray-100 mb-8">
        {[{ id: "", nameZh: "全部" }, ...categories].map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                active
                  ? "border-gray-900 text-gray-900 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600 font-medium"
              }`}
            >
              {cat.nameZh}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">该分类暂无商品</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} onNeedLogin={onNeedLogin} />
          ))}
        </div>
      )}

      <LoginPromptToast
        show={showLoginPrompt}
        redirectTo="/menu"
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
}

function CartPlusIcon() {
  return (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-gray-900 rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow-sm">
        +
      </span>
    </>
  );
}

function ProductCard({ product, onNeedLogin }: { product: Product; onNeedLogin: () => void }) {
  const router = useRouter();
  const { addItem, items, updateQuantity, isAuthenticated } = useCart();

  const hasVariants = product.variants.length > 0;
  const cartItem = hasVariants
    ? undefined
    : items.find((i) => i.productId === product.id && !i.variantId);
  const qty = cartItem?.quantity ?? 0;

  const basePrice = Number(product.basePrice);
  const maxDelta = product.variants.length
    ? Math.max(...product.variants.map((v) => Number(v.priceDelta)))
    : 0;
  const priceLabel = maxDelta > 0 ? `从 $${basePrice.toFixed(2)}` : `$${basePrice.toFixed(2)}`;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (isAuthenticated === false) { onNeedLogin(); return; }
    addItem({ productId: product.id, productName: product.nameZh, image: product.images[0], unitPrice: basePrice });
  }

  function handleIncrement(e: React.MouseEvent) {
    e.stopPropagation();
    if (isAuthenticated === false) { onNeedLogin(); return; }
    updateQuantity(product.id, undefined, 1);
  }

  function handleDecrement(e: React.MouseEvent) {
    e.stopPropagation();
    if (isAuthenticated === false) { onNeedLogin(); return; }
    updateQuantity(product.id, undefined, -1);
  }

  return (
    <div
      onClick={() => router.push(`/products/${product.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer select-none"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.nameZh} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-6xl">◻</div>
        )}
      </div>

      {/* Info — relative so the cart control can be absolute */}
      <div className="px-3 pt-3 pb-3 relative">
        <p className="text-xs text-gray-400 mb-0.5">{product.category.nameZh}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 pr-10">{product.nameZh}</p>
        <p className="text-sm font-semibold text-gray-900 mt-1 pr-10">{priceLabel}</p>

        {/* Cart control — absolute so it never affects layout height */}
        <div
          className="absolute inset-y-0 right-2 flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {hasVariants ? (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/products/${product.id}`); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap"
            >
              选规格 →
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Minus + count — slide in when qty > 0 */}
              <div className={`flex items-center gap-1.5 transition-all duration-200 ${qty > 0 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"}`}>
                <button
                  onClick={handleDecrement}
                  aria-label="减少"
                  className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:scale-90"
                >
                  <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
                    <rect width="8" height="2" rx="1" fill="currentColor" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-gray-900 min-w-[1rem] text-center tabular-nums">
                  {qty > 0 ? qty : ""}
                </span>
              </div>

              {/* Cart + plus icon button */}
              <button
                onClick={qty === 0 ? handleAdd : handleIncrement}
                aria-label="加入购物车"
                className="relative w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-150 active:scale-90 shadow-sm"
              >
                <CartPlusIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
