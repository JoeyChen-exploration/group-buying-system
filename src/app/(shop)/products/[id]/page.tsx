"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface Variant {
  id: string;
  nameZh: string;
  size: string | null;
  flavor: string | null;
  filling: string | null;
  priceDelta: string;
}

interface Product {
  id: string;
  nameZh: string;
  nameEn: string | null;
  descriptionZh: string | null;
  basePrice: string;
  images: string[];
  category: { nameZh: string };
  variants: Variant[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mainImage, setMainImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setNotFound(true); return; }
        setProduct(d.data);
        if (d.data.variants.length > 0) setSelectedVariant(d.data.variants[0]);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;
  if (notFound || !product) return (
    <div className="py-24 text-center">
      <p className="text-gray-500 mb-4">商品不存在或已下架</p>
      <button onClick={() => router.push("/")} className="text-sm text-gray-900 underline">返回首页</button>
    </div>
  );

  const basePrice = Number(product.basePrice);
  const displayPrice = basePrice + (selectedVariant ? Number(selectedVariant.priceDelta) : 0);

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      variantId: selectedVariant?.id,
      productName: product!.nameZh,
      variantName: selectedVariant?.nameZh,
      image: product!.images[0],
      unitPrice: displayPrice,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function variantLabel(v: Variant) {
    const parts = [v.size, v.flavor, v.filling].filter(Boolean);
    return parts.length ? `${v.nameZh} · ${parts.join(" / ")}` : v.nameZh;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-700 mb-4 block">← 返回</button>

      {/* Images */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {product.images[mainImage] ? (
          <Image src={product.images[mainImage]} alt={product.nameZh} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">◻</div>
        )}
      </div>
      {product.images.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {product.images.map((url, i) => (
            <button
              key={i}
              onClick={() => setMainImage(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === mainImage ? "border-gray-900" : "border-transparent"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">{product.category.nameZh}</p>
        <h1 className="text-xl font-bold text-gray-900">{product.nameZh}</h1>
        {product.nameEn && <p className="text-sm text-gray-400 mt-0.5">{product.nameEn}</p>}
        <p className="text-2xl font-bold text-gray-900 mt-2">${displayPrice.toFixed(2)}</p>
        {selectedVariant && Number(selectedVariant.priceDelta) !== 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            基础价 ${basePrice.toFixed(2)} + 规格差价 ${Number(selectedVariant.priceDelta) > 0 ? "+" : ""}{Number(selectedVariant.priceDelta).toFixed(2)}
          </p>
        )}
      </div>

      {/* Variants */}
      {product.variants.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">选择规格</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedVariant?.id === v.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {variantLabel(v)}
                {Number(v.priceDelta) !== 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    ({Number(v.priceDelta) > 0 ? "+" : ""}{Number(v.priceDelta).toFixed(2)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {product.descriptionZh && (
        <div className="mb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-xl border border-gray-100 p-4">
          {product.descriptionZh}
        </div>
      )}

      {/* Quantity + Add to cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none"
          >−</button>
          <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[2.5rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 text-lg leading-none"
          >+</button>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {added ? "✓ 已加入购物车" : "加入购物车"}
        </button>
      </div>
    </div>
  );
}
