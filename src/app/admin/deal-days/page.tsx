"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DealDay {
  id: string;
  titleZh: string;
  titleEn: string | null;
  isEnabled: boolean;
  activityStartAt: string;
  activityEndAt: string;
  preorderDeliveryDate: string;
  deliveryFee: string;
  _count: { items: number; orders: number };
}

function timeStatus(start: string, end: string) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now < s) return { label: "即将开始", cls: "bg-amber-50 text-amber-600" };
  if (now <= e) return { label: "进行中", cls: "bg-green-50 text-green-700" };
  return { label: "已结束", cls: "bg-gray-100 text-gray-400" };
}

function formatDateRange(start: string, end: string) {
  const fmt = (s: string) =>
    new Date(s).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} — ${fmt(end)}`;
}

export default function DealDaysPage() {
  const router = useRouter();
  const [days, setDays] = useState<DealDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/deal-days")
      .then((r) => r.json())
      .then((d) => { if (d.success) setDays(d.data); })
      .finally(() => setLoading(false));
  }, []);

  async function toggleEnabled(id: string, current: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    setToggling(id);
    const res = await fetch(`/api/admin/deal-days/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !current }),
    });
    const data = await res.json();
    if (data.success) {
      setDays((prev) => prev.map((d) => d.id === id ? { ...d, isEnabled: !current } : d));
    }
    setToggling(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">优惠日管理</h1>
        <Link
          href="/admin/deal-days/new"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + 新建优惠日
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>
      ) : days.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">还没有优惠日活动</p>
          <Link href="/admin/deal-days/new" className="text-sm font-medium text-gray-900 underline underline-offset-2">
            创建第一个
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">活动名称</th>
                <th className="text-left px-4 py-3 font-medium">活动时间</th>
                <th className="text-left px-4 py-3 font-medium">配送日期</th>
                <th className="text-center px-4 py-3 font-medium">商品</th>
                <th className="text-center px-4 py-3 font-medium">订单</th>
                <th className="text-center px-4 py-3 font-medium">时间状态</th>
                <th className="text-center px-4 py-3 font-medium">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {days.map((day) => {
                const ts = timeStatus(day.activityStartAt, day.activityEndAt);
                const isToggling = toggling === day.id;
                return (
                  <tr
                    key={day.id}
                    onClick={() => router.push(`/admin/deal-days/${day.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{day.titleZh}</p>
                      {day.titleEn && <p className="text-xs text-gray-400">{day.titleEn}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateRange(day.activityStartAt, day.activityEndAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(day.preorderDeliveryDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{day._count.items}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{day._count.orders}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ts.cls}`}>{ts.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleEnabled(day.id, day.isEnabled, e)}
                        disabled={isToggling}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          day.isEnabled ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                            day.isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
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
