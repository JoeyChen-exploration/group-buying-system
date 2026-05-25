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

type SortField = "nameZh" | "category" | "basePrice" | "status";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  const asc = active && dir === "asc";
  const desc = active && dir === "desc";
  return (
    <span className="ml-1.5 inline-flex flex-col gap-px">
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 0L8 5H0L4 0Z" fill={asc ? "#374151" : "#D1D5DB"} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 5L0 0H8L4 5Z" fill={desc ? "#374151" : "#D1D5DB"} />
      </svg>
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("nameZh");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), sortField, sortDir });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    if (data.success) {
      setProducts(data.data.products);
      setMeta({ total: data.data.total, page: data.data.page, totalPages: data.data.totalPages });
    }
    setLoading(false);
  }, [page, search, statusFilter, sortField, sortDir]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`确认删除商品「${product.nameZh}」？`)) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.data?.message ?? data.message);
    load();
  }

  function ColHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    return (
      <th className={`px-4 py-3 font-medium text-gray-600 ${className ?? ""}`}>
        <button
          onClick={() => toggleSort(field)}
          className="inline-flex items-center hover:text-gray-900"
        >
          {label}
          <SortIcon active={sortField === field} dir={sortDir} />
        </button>
      </th>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
        <Link href="/admin/products/new" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + 新建商品
        </Link>
      </div>

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
                  <ColHeader field="nameZh" label="商品名称" className="text-left" />
                  <ColHeader field="category" label="分类" className="text-left" />
                  <ColHeader field="basePrice" label="基础价格" className="text-right" />
                  <th className="text-center px-4 py-3 font-medium text-gray-600">规格数</th>
                  <ColHeader field="status" label="状态" className="text-center" />
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
