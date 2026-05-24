"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Category { id: string; nameZh: string; }
interface Variant {
  id?: string;
  nameZh: string;
  size: string;
  flavor: string;
  filling: string;
  priceDelta: number;
  status: "active" | "inactive" | "archived";
}

const emptyVariant = (): Variant => ({ nameZh: "", size: "", flavor: "", filling: "", priceDelta: 0, status: "active" });

interface Props { productId?: string; }

export default function ProductForm({ productId }: Props) {
  const router = useRouter();
  const isEdit = !!productId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    nameZh: "", nameEn: "", descriptionZh: "", descriptionEn: "",
    categoryId: "", basePrice: "", status: "active" as const, isHidden: false,
    images: [] as string[],
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => {
      if (d.success) setCategories(d.data);
    });
    if (isEdit) {
      fetch(`/api/admin/products/${productId}`).then((r) => r.json()).then((d) => {
        if (!d.success) return;
        const p = d.data;
        setForm({
          nameZh: p.nameZh, nameEn: p.nameEn ?? "", descriptionZh: p.descriptionZh ?? "",
          descriptionEn: p.descriptionEn ?? "", categoryId: p.categoryId,
          basePrice: String(p.basePrice), status: p.status, isHidden: p.isHidden,
          images: p.images,
        });
        setVariants(p.variants.map((v: Variant & { id: string }) => ({
          id: v.id, nameZh: v.nameZh, size: v.size ?? "", flavor: v.flavor ?? "",
          filling: v.filling ?? "", priceDelta: Number(v.priceDelta), status: v.status,
        })));
      });
    }
  }, [productId, isEdit]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setForm((prev) => ({ ...prev, images: [...prev.images, data.data.url] }));
      else alert(data.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  }

  function addVariant() { setVariants((prev) => [...prev, emptyVariant()]); }
  function removeVariant(i: number) { setVariants((prev) => prev.filter((_, idx) => idx !== i)); }
  function setVariant(i: number, field: keyof Variant, value: string | number) {
    setVariants((prev) => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const body = { ...form, basePrice: Number(form.basePrice), ...(isEdit ? {} : { variants }) };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-sm">← 返回</button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? "编辑商品" : "新建商品"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">基本信息</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品名称（中文）</label>
            <input required className="input" value={form.nameZh} onChange={f("nameZh")} placeholder="例：草莓奶油蛋糕" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">英文名 <span className="text-gray-400 font-normal">（选填）</span></label>
            <input className="input" value={form.nameEn} onChange={f("nameEn")} placeholder="e.g. Strawberry Cream Cake" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select required className="input" value={form.categoryId} onChange={f("categoryId")}>
                <option value="">请选择分类</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameZh}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">基础价格（$）</label>
              <input required type="number" min="0" step="0.01" className="input" value={form.basePrice} onChange={f("basePrice")} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select className="input" value={form.status} onChange={f("status")}>
                <option value="active">上架</option>
                <option value="inactive">下架</option>
                <option value="archived">归档</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isHidden} onChange={(e) => setForm((p) => ({ ...p, isHidden: e.target.checked }))} className="rounded" />
                设为隐藏款（仅优惠日可见）
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述（中文）</label>
            <textarea className="input min-h-20 resize-none" value={form.descriptionZh} onChange={f("descriptionZh")} placeholder="商品描述..." />
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">商品图片</h2>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url) => (
              <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                <Image src={url} alt="" fill className="object-cover" />
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  删除
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-60">
              <span className="text-2xl">{uploading ? "…" : "+"}</span>
              <span className="text-xs mt-1">{uploading ? "上传中" : "添加图片"}</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <p className="text-xs text-gray-400">支持 JPG、PNG、WebP，单张不超过 5MB</p>
        </section>

        {/* Variants — only shown on create; edit variants handled per-item on the list */}
        {!isEdit && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">规格 <span className="text-gray-400 font-normal text-sm">（选填，可在保存后添加）</span></h2>
              <button type="button" onClick={addVariant} className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded-lg">+ 添加规格</button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">规格 {i + 1}</span>
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">规格名称</label>
                    <input required className="input" value={v.nameZh} onChange={(e) => setVariant(i, "nameZh", e.target.value)} placeholder="例：6寸" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">价格差（$）</label>
                    <input type="number" step="0.01" className="input" value={v.priceDelta} onChange={(e) => setVariant(i, "priceDelta", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">尺寸</label>
                    <input className="input" value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} placeholder="6寸 / 8寸" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">口味</label>
                    <input className="input" value={v.flavor} onChange={(e) => setVariant(i, "flavor", e.target.value)} placeholder="草莓 / 巧克力" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 text-gray-700 text-sm py-2.5 rounded-lg hover:bg-gray-50">取消</button>
          <button type="submit" disabled={loading} className="flex-1 bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-60">
            {loading ? "保存中..." : isEdit ? "保存修改" : "创建商品"}
          </button>
        </div>
      </form>
    </div>
  );
}
