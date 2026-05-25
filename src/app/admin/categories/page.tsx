"use client";

import { useState, useEffect, useMemo } from "react";

interface Category {
  id: string;
  nameZh: string;
  nameEn: string | null;
  isVisible: boolean;
  _count: { products: number };
}

const emptyForm = { nameZh: "", nameEn: "", isVisible: true };
type SortField = "nameZh" | "nameEn" | "products";
type SortDir = "asc" | "desc";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [sortField, setSortField] = useState<SortField>("nameZh");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pageError, setPageError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...categories].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortField === "nameZh") { av = a.nameZh; bv = b.nameZh; }
      else if (sortField === "nameEn") { av = a.nameEn ?? ""; bv = b.nameEn ?? ""; }
      else { av = a._count.products; bv = b._count.products; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [categories, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    const active = sortField === field;
    const asc = active && sortDir === "asc";
    const desc = active && sortDir === "desc";
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

  async function handleVisibilityChange(cat: Category, isVisible: boolean) {
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isVisible } : c));
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible }),
    });
    const data = await res.json();
    if (!data.success) {
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isVisible: !isVisible } : c));
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setNameError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ nameZh: cat.nameZh, nameEn: cat.nameEn ?? "", isVisible: cat.isVisible });
    setNameError("");
    setShowForm(true);
  }

  function checkDuplicate(name: string): boolean {
    const dup = categories.some(
      (c) => c.nameZh.trim().toLowerCase() === name.trim().toLowerCase() && c.id !== editing?.id
    );
    if (dup) setNameError("已有相同分类名，请更换");
    return dup;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (checkDuplicate(form.nameZh)) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setNameError(data.message); return; }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`确认删除分类「${cat.nameZh}」？`)) return;
    setPageError("");
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { setPageError(data.message); return; }
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">分类管理</h1>
        <button onClick={openCreate} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + 新建分类
        </button>
      </div>

      {pageError && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
          <span>{pageError}</span>
          <button onClick={() => setPageError("")} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => toggleSort("nameZh")} className="hover:text-gray-900 flex items-center">
                    分类名称<SortIcon field="nameZh" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => toggleSort("nameEn")} className="hover:text-gray-900 flex items-center">
                    英文名<SortIcon field="nameEn" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => toggleSort("products")} className="hover:text-gray-900 flex items-center mx-auto">
                    商品数<SortIcon field="products" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">顾客可见</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.nameZh}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.nameEn ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{cat._count.products}</td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={cat.isVisible ? "true" : "false"}
                      onChange={(e) => handleVisibilityChange(cat, e.target.value === "true")}
                      className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400 ${
                        cat.isVisible ? "border-green-200 text-green-700 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50"
                      }`}
                    >
                      <option value="true">顾客可见</option>
                      <option value="false">顾客不可见</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(cat)} className="text-gray-500 hover:text-gray-900 text-xs">编辑</button>
                    <button onClick={() => handleDelete(cat)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无分类</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑分类" : "新建分类"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类名称（中文）</label>
                <input
                  required
                  className={`input ${nameError ? "border-red-400 focus:ring-red-300" : ""}`}
                  value={form.nameZh}
                  onChange={(e) => { setForm({ ...form, nameZh: e.target.value }); setNameError(""); }}
                  placeholder="例：蛋糕"
                />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文名 <span className="text-gray-400 font-normal">（选填）</span></label>
                <input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="e.g. Cakes" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isVisible" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="rounded" />
                <label htmlFor="isVisible" className="text-sm text-gray-700">顾客可见</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" disabled={saving} className="flex-1 bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-700 disabled:opacity-60">
                  {saving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
