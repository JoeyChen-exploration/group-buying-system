"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Variant { id: string; nameZh: string; priceDelta: string; }
interface Product { id: string; nameZh: string; basePrice: string; variants: Variant[]; }
interface DealDayItem {
  id: string;
  productId: string;
  variantId: string | null;
  dealPrice: string;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  perOrderLimit: number | null;
  perUserLimit: number | null;
  status: "active" | "disabled" | "sold_out";
  product: { id: string; nameZh: string };
  variant: { id: string; nameZh: string } | null;
}
interface DealDay {
  id: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  isEnabled: boolean;
  activityStartAt: string;
  activityEndAt: string;
  preorderDeliveryDate: string;
  deliveryFee: string;
  showCountdown: boolean;
  items: DealDayItem[];
  _count: { orders: number };
}

const ITEM_STATUS_LABEL: Record<string, string> = { active: "销售中", disabled: "已暂停", sold_out: "售罄" };
const ITEM_STATUS_CLS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  disabled: "bg-amber-50 text-amber-600",
  sold_out: "bg-gray-100 text-gray-400",
};

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

const isNew = (id: string) => id === "new";

export default function DealDayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const creating = isNew(id);

  const [dealDay, setDealDay] = useState<DealDay | null>(null);
  const [loading, setLoading] = useState(!creating);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    titleZh: "", titleEn: "", descriptionZh: "", descriptionEn: "",
    activityStartAt: "", activityEndAt: "", preorderDeliveryDate: "",
    deliveryFee: "0", showCountdown: true,
  });

  // Products for item picker
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    productId: "", variantId: "", dealPrice: "", totalQuantity: "",
    perOrderLimit: "", perUserLimit: "",
  });
  const [addingItem, setAddingItem] = useState(false);
  const [itemError, setItemError] = useState("");

  // Edit item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemForm, setEditItemForm] = useState({
    dealPrice: "", totalQuantity: "", perOrderLimit: "", perUserLimit: "", status: "active",
  });
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (!creating) {
      fetch(`/api/admin/deal-days/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const dd = d.data as DealDay;
            setDealDay(dd);
            setForm({
              titleZh: dd.titleZh,
              titleEn: dd.titleEn ?? "",
              descriptionZh: dd.descriptionZh ?? "",
              descriptionEn: dd.descriptionEn ?? "",
              activityStartAt: toLocalDatetime(dd.activityStartAt),
              activityEndAt: toLocalDatetime(dd.activityEndAt),
              preorderDeliveryDate: toDateInput(dd.preorderDeliveryDate),
              deliveryFee: String(Number(dd.deliveryFee)),
              showCountdown: dd.showCountdown,
            });
          }
        })
        .finally(() => setLoading(false));
    }

    fetch("/api/admin/products?pageSize=200&status=active")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data.products ?? []); });
  }, [id, creating]);

  function setF(k: string, v: string | boolean) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...form,
        activityStartAt: new Date(form.activityStartAt).toISOString(),
        activityEndAt: new Date(form.activityEndAt).toISOString(),
        deliveryFee: Number(form.deliveryFee),
      };

      const url = creating ? "/api/admin/deal-days" : `/api/admin/deal-days/${id}`;
      const method = creating ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }

      if (creating) {
        router.replace(`/admin/deal-days/${data.data.id}`);
      } else {
        setSuccess("已保存");
        setTimeout(() => setSuccess(""), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleEnabled() {
    if (!dealDay) return;
    setSaving(true);
    const res = await fetch(`/api/admin/deal-days/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !dealDay.isEnabled }),
    });
    const data = await res.json();
    if (data.success) setDealDay((prev) => prev ? { ...prev, isEnabled: !prev.isEnabled } : prev);
    setSaving(false);
  }

  async function handleDelete() {
    if (!dealDay || dealDay._count.orders > 0) return;
    if (!confirm("确定删除该优惠日？此操作不可撤销。")) return;
    const res = await fetch(`/api/admin/deal-days/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) router.push("/admin/deal-days");
    else setError(data.message);
  }

  async function handleAddItem() {
    setAddingItem(true);
    setItemError("");
    const res = await fetch(`/api/admin/deal-days/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: itemForm.productId,
        variantId: itemForm.variantId || undefined,
        dealPrice: Number(itemForm.dealPrice),
        totalQuantity: Number(itemForm.totalQuantity),
        perOrderLimit: itemForm.perOrderLimit ? Number(itemForm.perOrderLimit) : undefined,
        perUserLimit: itemForm.perUserLimit ? Number(itemForm.perUserLimit) : undefined,
      }),
    });
    const data = await res.json();
    if (!data.success) { setItemError(data.message); setAddingItem(false); return; }
    setDealDay((prev) => prev ? { ...prev, items: [...prev.items, data.data] } : prev);
    setItemForm({ productId: "", variantId: "", dealPrice: "", totalQuantity: "", perOrderLimit: "", perUserLimit: "" });
    setShowAddItem(false);
    setAddingItem(false);
  }

  function startEdit(item: DealDayItem) {
    setEditingItemId(item.id);
    setEditItemForm({
      dealPrice: String(Number(item.dealPrice)),
      totalQuantity: String(item.totalQuantity),
      perOrderLimit: item.perOrderLimit ? String(item.perOrderLimit) : "",
      perUserLimit: item.perUserLimit ? String(item.perUserLimit) : "",
      status: item.status === "sold_out" ? "active" : item.status,
    });
  }

  async function handleSaveItem(itemId: string) {
    setSavingItem(true);
    const res = await fetch(`/api/admin/deal-days/${id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealPrice: Number(editItemForm.dealPrice),
        totalQuantity: Number(editItemForm.totalQuantity),
        perOrderLimit: editItemForm.perOrderLimit ? Number(editItemForm.perOrderLimit) : null,
        perUserLimit: editItemForm.perUserLimit ? Number(editItemForm.perUserLimit) : null,
        status: editItemForm.status,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setDealDay((prev) => prev
        ? { ...prev, items: prev.items.map((i) => i.id === itemId ? { ...i, ...data.data } : i) }
        : prev);
      setEditingItemId(null);
    }
    setSavingItem(false);
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("确定移除该商品？")) return;
    const res = await fetch(`/api/admin/deal-days/${id}/items/${itemId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setDealDay((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev);
    }
  }

  const selectedProduct = products.find((p) => p.id === itemForm.productId);

  if (loading) return <p className="text-sm text-gray-400 py-12 text-center px-4">加载中...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => router.push("/admin/deal-days")} className="text-sm text-gray-400 hover:text-gray-700 mb-4 block">
        ← 返回
      </button>

      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-bold text-gray-900">{creating ? "新建优惠日" : "编辑优惠日"}</h1>
        {!creating && dealDay && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleEnabled}
              disabled={saving}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                dealDay.isEnabled
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-green-300 text-green-700 hover:bg-green-50"
              }`}
            >
              {dealDay.isEnabled ? "禁用活动" : "启用活动"}
            </button>
            {dealDay._count.orders === 0 && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">基本信息</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-400 block mb-1">活动名称（中文）*</label>
              <input value={form.titleZh} onChange={(e) => setF("titleZh", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-400 block mb-1">活动名称（英文）</label>
              <input value={form.titleEn} onChange={(e) => setF("titleEn", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 block mb-1">活动描述（中文）</label>
              <textarea value={form.descriptionZh} onChange={(e) => setF("descriptionZh", e.target.value)} rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
            </div>
          </div>
        </section>

        {/* Time & delivery */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">时间与配送</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">活动开始时间 *</label>
              <input type="datetime-local" value={form.activityStartAt} onChange={(e) => setF("activityStartAt", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">活动结束时间 *</label>
              <input type="datetime-local" value={form.activityEndAt} onChange={(e) => setF("activityEndAt", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">预计配送日期 *</label>
              <input type="date" value={form.preorderDeliveryDate} onChange={(e) => setF("preorderDeliveryDate", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">配送费 (NZD)</label>
              <input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={(e) => setF("deliveryFee", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setF("showCountdown", !form.showCountdown)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${form.showCountdown ? "bg-gray-900" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.showCountdown ? "translate-x-4" : "translate-x-0"}`} />
              </button>
              <span className="text-sm text-gray-600">顾客端显示倒计时</span>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-500 px-1">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : creating ? "创建活动" : "保存修改"}
          </button>
          {success && <span className="text-sm text-green-600">{success}</span>}
        </div>

        {/* Items — only shown after creation */}
        {!creating && dealDay && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">团购商品</h2>
              <button
                onClick={() => { setShowAddItem(true); setItemError(""); }}
                className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                + 添加商品
              </button>
            </div>

            {dealDay.items.length === 0 && !showAddItem && (
              <p className="text-sm text-gray-400 py-4 text-center">还没有团购商品</p>
            )}

            {dealDay.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">商品</th>
                      <th className="text-right pb-2 font-medium">团购价</th>
                      <th className="text-right pb-2 font-medium">总量</th>
                      <th className="text-right pb-2 font-medium">已售</th>
                      <th className="text-right pb-2 font-medium">剩余</th>
                      <th className="text-center pb-2 font-medium">每单限</th>
                      <th className="text-center pb-2 font-medium">每人限</th>
                      <th className="text-center pb-2 font-medium">状态</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dealDay.items.map((item) =>
                      editingItemId === item.id ? (
                        <tr key={item.id} className="bg-gray-50">
                          <td className="py-2 pr-2">
                            <p className="font-medium text-gray-800">{item.product.nameZh}</p>
                            {item.variant && <p className="text-xs text-gray-400">{item.variant.nameZh}</p>}
                          </td>
                          <td className="py-2 pr-2">
                            <input type="number" min="0" step="0.01" value={editItemForm.dealPrice}
                              onChange={(e) => setEditItemForm((f) => ({ ...f, dealPrice: e.target.value }))}
                              className="w-20 px-2 py-1 text-xs text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300" />
                          </td>
                          <td className="py-2 pr-2">
                            <input type="number" min={item.soldQuantity} value={editItemForm.totalQuantity}
                              onChange={(e) => setEditItemForm((f) => ({ ...f, totalQuantity: e.target.value }))}
                              className="w-16 px-2 py-1 text-xs text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300" />
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-500">{item.soldQuantity}</td>
                          <td className="py-2 pr-2 text-right text-gray-500">
                            {Number(editItemForm.totalQuantity) - item.soldQuantity}
                          </td>
                          <td className="py-2 pr-2">
                            <input type="number" min="1" value={editItemForm.perOrderLimit} placeholder="—"
                              onChange={(e) => setEditItemForm((f) => ({ ...f, perOrderLimit: e.target.value }))}
                              className="w-12 px-2 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300" />
                          </td>
                          <td className="py-2 pr-2">
                            <input type="number" min="1" value={editItemForm.perUserLimit} placeholder="—"
                              onChange={(e) => setEditItemForm((f) => ({ ...f, perUserLimit: e.target.value }))}
                              className="w-12 px-2 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300" />
                          </td>
                          <td className="py-2 pr-2">
                            <select value={editItemForm.status}
                              onChange={(e) => setEditItemForm((f) => ({ ...f, status: e.target.value }))}
                              className="text-xs border border-gray-200 rounded px-1 py-1 focus:outline-none">
                              <option value="active">销售中</option>
                              <option value="disabled">暂停</option>
                            </select>
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            <button onClick={() => handleSaveItem(item.id)} disabled={savingItem}
                              className="text-xs text-blue-600 hover:text-blue-800 mr-2 disabled:opacity-50">保存</button>
                            <button onClick={() => setEditingItemId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600">取消</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id}>
                          <td className="py-2.5 pr-2">
                            <p className="font-medium text-gray-800">{item.product.nameZh}</p>
                            {item.variant && <p className="text-xs text-gray-400">{item.variant.nameZh}</p>}
                          </td>
                          <td className="py-2.5 pr-2 text-right font-medium text-gray-900">
                            ${Number(item.dealPrice).toFixed(2)}
                          </td>
                          <td className="py-2.5 pr-2 text-right text-gray-600">{item.totalQuantity}</td>
                          <td className="py-2.5 pr-2 text-right text-gray-600">{item.soldQuantity}</td>
                          <td className="py-2.5 pr-2 text-right text-gray-600">{item.remainingQuantity}</td>
                          <td className="py-2.5 pr-2 text-center text-gray-400">{item.perOrderLimit ?? "—"}</td>
                          <td className="py-2.5 pr-2 text-center text-gray-400">{item.perUserLimit ?? "—"}</td>
                          <td className="py-2.5 pr-2 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ITEM_STATUS_CLS[item.status]}`}>
                              {ITEM_STATUS_LABEL[item.status]}
                            </span>
                          </td>
                          <td className="py-2.5 whitespace-nowrap text-right">
                            <button onClick={() => startEdit(item)}
                              className="text-xs text-gray-400 hover:text-gray-700 mr-2">编辑</button>
                            {item.soldQuantity === 0 && (
                              <button onClick={() => handleDeleteItem(item.id)}
                                className="text-xs text-gray-400 hover:text-red-500">删除</button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add item form */}
            {showAddItem && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-3">添加团购商品</p>
                {itemError && <p className="text-xs text-red-500 mb-2">{itemError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-gray-400 block mb-1">选择商品 *</label>
                    <select value={itemForm.productId}
                      onChange={(e) => setItemForm((f) => ({ ...f, productId: e.target.value, variantId: "" }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">
                      <option value="">请选择</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameZh}</option>
                      ))}
                    </select>
                  </div>
                  {selectedProduct && selectedProduct.variants.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs text-gray-400 block mb-1">规格</label>
                      <select value={itemForm.variantId}
                        onChange={(e) => setItemForm((f) => ({ ...f, variantId: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300">
                        <option value="">无规格</option>
                        {selectedProduct.variants.map((v) => (
                          <option key={v.id} value={v.id}>{v.nameZh}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">团购价 (NZD) *</label>
                    <input type="number" min="0" step="0.01" value={itemForm.dealPrice}
                      onChange={(e) => setItemForm((f) => ({ ...f, dealPrice: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">总库存 *</label>
                    <input type="number" min="1" value={itemForm.totalQuantity}
                      onChange={(e) => setItemForm((f) => ({ ...f, totalQuantity: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">每单限购</label>
                    <input type="number" min="1" placeholder="不限" value={itemForm.perOrderLimit}
                      onChange={(e) => setItemForm((f) => ({ ...f, perOrderLimit: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">每人限购</label>
                    <input type="number" min="1" placeholder="不限" value={itemForm.perUserLimit}
                      onChange={(e) => setItemForm((f) => ({ ...f, perUserLimit: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleAddItem} disabled={addingItem || !itemForm.productId || !itemForm.dealPrice || !itemForm.totalQuantity}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40">
                    {addingItem ? "添加中..." : "确认添加"}
                  </button>
                  <button onClick={() => { setShowAddItem(false); setItemError(""); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
