"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  nameZh: string;
  nameEn: string | null;
  sortOrder: number;
  isVisible: boolean;
  _count: { products: number };
}

const emptyForm = { nameZh: "", nameEn: "", sortOrder: 0, isVisible: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ nameZh: cat.nameZh, nameEn: cat.nameEn ?? "", sortOrder: cat.sortOrder, isVisible: cat.isVisible });
    setError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`确认删除分类「${cat.nameZh}」？`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    load();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">分类管理</h1>
        <button onClick={openCreate} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + 新建分类
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">加载中...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">分类名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">英文名</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">排序</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">商品数</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">显示</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.nameZh}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.nameEn ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{cat.sortOrder}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{cat._count.products}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cat.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isVisible ? "显示" : "隐藏"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(cat)} className="text-gray-500 hover:text-gray-900 text-xs">编辑</button>
                    <button onClick={() => handleDelete(cat)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暂无分类</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑分类" : "新建分类"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类名称（中文）</label>
                <input required className="input" value={form.nameZh} onChange={(e) => setForm({ ...form, nameZh: e.target.value })} placeholder="例：蛋糕" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文名 <span className="text-gray-400 font-normal">（选填）</span></label>
                <input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="e.g. Cakes" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序（数字越小越靠前）</label>
                <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isVisible" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="rounded" />
                <label htmlFor="isVisible" className="text-sm text-gray-700">顾客端显示此分类</label>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
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
