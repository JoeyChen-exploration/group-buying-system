"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

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
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeCategory ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {cat.nameZh}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">该分类暂无商品</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const minPrice = Number(product.basePrice);
  const maxDelta = product.variants.length
    ? Math.max(...product.variants.map((v) => Number(v.priceDelta)))
    : 0;
  const priceLabel = maxDelta > 0 ? `从 $${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}`;

  return (
    <Link href={`/products/${product.id}`} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow block">
      <div className="relative aspect-square bg-gray-100">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.nameZh} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">◻</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5">{product.category.nameZh}</p>
        <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.nameZh}</p>
        <p className="text-sm font-semibold text-gray-900 mt-1">{priceLabel}</p>
      </div>
    </Link>
  );
}
