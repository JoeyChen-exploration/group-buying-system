"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Product {
  id: string;
  nameZh: string;
  basePrice: string;
  status: "active" | "inactive" | "archived";
  isHidden: boolean;
  category: { nameZh: string };
  variants: { id: string }[];
  _count: { orderItems: number };
}

interface Meta { total: number; page: number; totalPages: number; }

const STATUS_LABEL: Record<string, string> = { active: "上架", inactive: "下架", archived: "归档" };
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    if (data.success) {
      setProducts(data.data.products);
      setMeta({ total: data.data.total, page: data.data.page, totalPages: data.data.totalPages });
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(product: Product) {
    if (!confirm(`确认删除商品「${product.nameZh}」？`)) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.data?.message ?? data.message);
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
        <Link href="/admin/products/new" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + 新建商品
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="搜索商品名称..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="input max-w-36"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">全部状态</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
          <option value="archived">归档</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商品名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">分类</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">基础价格</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">规格数</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">隐藏款</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nameZh}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category.nameZh}</td>
                    <td className="px-4 py-3 text-right text-gray-900">${Number(p.basePrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.variants.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {p.isHidden ? <span className="text-rose-500 text-xs font-medium">隐藏款</span> : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-gray-500 hover:text-gray-900 text-xs">编辑</Link>
                      <button onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">暂无商品</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>共 {meta.total} 个商品</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">上一页</button>
                <span className="px-3 py-1">{meta.page} / {meta.totalPages}</span>
                <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40">下一页</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
