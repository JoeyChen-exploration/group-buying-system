"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  items: { productNameSnapshot: string; quantity: number }[];
  _count: { items: number };
}

type SortField = "createdAt" | "totalAmount" | "user" | "status";
type SortDir = "asc" | "desc";

const STATUS_TABS = [
  { value: "", label: "全部" },
  { value: "pending", label: "待确认" },
  { value: "confirmed", label: "已确认" },
  { value: "preparing", label: "制作中" },
  { value: "ready", label: "可取货" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-blue-50 text-blue-700",
  ready:     "bg-green-50 text-green-700",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待确认", confirmed: "已确认", preparing: "制作中",
  ready: "可取货", completed: "已完成", cancelled: "已取消",
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "现金", bank_transfer: "银行转账", other: "其他",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="ml-1.5 inline-flex flex-col gap-px">
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 0L8 5H0L4 0Z" fill={active && dir === "asc" ? "#374151" : "#D1D5DB"} />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
        <path d="M4 5L0 0H8L4 5Z" fill={active && dir === "desc" ? "#374151" : "#D1D5DB"} />
      </svg>
    </span>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "近7天",  from: () => daysAgoStr(6),  to: todayStr },
  { label: "近1个月", from: () => daysAgoStr(29), to: todayStr },
  { label: "近3个月", from: () => daysAgoStr(89), to: todayStr },
  { label: "近6个月", from: () => daysAgoStr(179), to: todayStr },
];

function ExportModal({ onClose }: { onClose: () => void }) {
  const [from, setFrom] = useState(daysAgoStr(6));
  const [to, setTo] = useState(todayStr());
  const [activePreset, setActivePreset] = useState(0);

  function applyPreset(index: number) {
    const p = PRESETS[index];
    setFrom(p.from());
    setTo(p.to());
    setActivePreset(index);
  }

  function handleDateChange(field: "from" | "to", value: string) {
    if (field === "from") setFrom(value);
    else setTo(value);
    setActivePreset(-1);
  }

  function handleExport() {
    window.location.href = `/api/admin/orders/export?from=${from}&to=${to}`;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">导出订单</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <p className="text-xs text-gray-400 mb-3">快速选择</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(i)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                activePreset === i
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-3">自定义日期范围</p>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="date"
            value={from}
            onChange={(e) => handleDateChange("from", e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <span className="text-gray-400 text-sm shrink-0">至</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => handleDateChange("to", e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        <button
          onClick={handleExport}
          disabled={!from || !to || from > to}
          className="w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
        >
          导出 XLSX
        </button>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeStatus) params.set("status", activeStatus);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.data); })
      .finally(() => setLoading(false));
  }, [activeStatus]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q
      ? orders.filter((o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q)
        )
      : orders;

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
      else if (sortField === "totalAmount") cmp = Number(a.totalAmount) - Number(b.totalAmount);
      else if (sortField === "user") cmp = a.user.name.localeCompare(b.user.name, "zh");
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [orders, search, sortField, sortDir]);

  function ColHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    return (
      <th className={`px-4 py-3 font-medium ${className ?? ""}`}>
        <button
          onClick={() => toggleSort(field)}
          className="inline-flex items-center hover:text-gray-700 transition-colors"
        >
          {label}
          <SortIcon active={sortField === field} dir={sortDir} />
        </button>
      </th>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">订单管理</h1>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出
        </button>
      </div>

      {/* Search + status tabs */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-xs w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索姓名、订单号、邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
        {search && (
          <span className="text-xs text-gray-400">找到 {displayed.length} 条</span>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeStatus === tab.value
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">{search ? "没有匹配结果" : "暂无订单"}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">订单号</th>
                <ColHeader field="user" label="顾客" className="text-left" />
                <th className="text-left px-4 py-3 font-medium">商品</th>
                <th className="text-left px-4 py-3 font-medium">取货方式</th>
                <th className="text-left px-4 py-3 font-medium">支付</th>
                <ColHeader field="totalAmount" label="金额" className="text-right" />
                <ColHeader field="status" label="状态" className="text-left" />
                <ColHeader field="createdAt" label="下单时间" className="text-left" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((order) => {
                const itemsLabel = order.items
                  .map((i) => `${i.productNameSnapshot} ×${i.quantity}`)
                  .join("、");
                const extra = order._count.items - order.items.length;

                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{order.user.name}</p>
                      <p className="text-xs text-gray-400">{order.user.phone ?? order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-gray-600">{itemsLabel}</p>
                      {extra > 0 && <p className="text-xs text-gray-400">+{extra} 件</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.fulfillmentMethod === "delivery" ? "送货" : "自取"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
