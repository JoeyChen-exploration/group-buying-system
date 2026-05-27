"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface DealItem {
  id: string;
  dealPrice: string;
  totalQuantity: number;
  remainingQuantity: number;
  soldQuantity: number;
  perOrderLimit: number | null;
  perUserLimit: number | null;
  status: string;
  product: { id: string; nameZh: string; nameEn: string | null; images: string[] };
  variant: { id: string; nameZh: string } | null;
}

interface ActiveDealDay {
  id: string;
  titleZh: string;
  titleEn: string | null;
  descriptionZh: string | null;
  activityStartAt: string;
  activityEndAt: string;
  preorderDeliveryDate: string;
  deliveryFee: string;
  showCountdown: boolean;
  items: DealItem[];
}

interface UpcomingDealDay {
  id: string;
  titleZh: string;
  titleEn: string | null;
  descriptionZh: string | null;
  activityStartAt: string;
  activityEndAt: string;
  preorderDeliveryDate: string;
  deliveryFee: string;
  showCountdown: boolean;
  items: DealItem[];
}

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number>(
    target ? Math.max(0, new Date(target).getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!target) return;
    const tick = () => setDiff(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const d = Math.floor(h / 24);
  const hh = h % 24;
  return { d, h: hh, m, s, done: diff === 0 };
}

function Pad({ n }: { n: number }) {
  return <span>{String(n).padStart(2, "0")}</span>;
}

function CountdownDisplay({ label, target }: { label: string; target: string }) {
  const { d, h, m, s, done } = useCountdown(target);
  if (done) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="font-mono text-lg font-semibold text-gray-800 tracking-widest">
        {d > 0 && <><Pad n={d} /><span className="text-gray-300 mx-0.5">d</span></>}
        <Pad n={h} /><span className="text-gray-300 mx-0.5">:</span>
        <Pad n={m} /><span className="text-gray-300 mx-0.5">:</span>
        <Pad n={s} />
      </div>
    </div>
  );
}

function OpensInButton({ target }: { target: string }) {
  const { d, h, m, s, done } = useCountdown(target);
  if (done) return null;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0 || d > 0) parts.push(`${String(h).padStart(2, "0")} 时`);
  parts.push(`${String(m).padStart(2, "0")} 分`);
  parts.push(`${String(s).padStart(2, "0")} 秒`);

  return (
    <div className="w-full py-2.5 text-center rounded-xl bg-gray-50 border border-gray-200">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">距开抢</p>
      <p className="text-sm font-mono font-semibold text-gray-700">{parts.join(" ")}</p>
    </div>
  );
}

function UpcomingDealView({ upcoming }: { upcoming: UpcomingDealDay }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-amber-600 font-medium uppercase tracking-widest">预热中</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{upcoming.titleZh}</h1>
        {upcoming.titleEn && <p className="text-sm text-gray-400">{upcoming.titleEn}</p>}
        {upcoming.descriptionZh && (
          <p className="text-sm text-gray-500 mt-2">{upcoming.descriptionZh}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span>预计配送：{new Date(upcoming.preorderDeliveryDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span>
          {Number(upcoming.deliveryFee) > 0
            ? <span>配送费 ${Number(upcoming.deliveryFee).toFixed(2)}</span>
            : <span className="text-green-600 font-medium">免配送费</span>
          }
        </div>
        {upcoming.showCountdown && (
          <div className="mt-4 inline-block bg-gray-50 border border-gray-100 rounded-xl px-5 py-3">
            <CountdownDisplay label="距开抢时间" target={upcoming.activityStartAt} />
          </div>
        )}
      </div>

      {upcoming.items.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider">本次团购商品预览</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.items.map((item) => (
              <div key={item.id} className="bg-white border rounded-2xl overflow-hidden">
                {item.product.images[0] ? (
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image src={item.product.images[0]} alt={item.product.nameZh} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-gray-100" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">
                    {item.product.nameZh}
                    {item.variant && <span className="text-gray-400 font-normal"> · {item.variant.nameZh}</span>}
                  </h3>
                  {item.product.nameEn && <p className="text-xs text-gray-400">{item.product.nameEn}</p>}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">${Number(item.dealPrice).toFixed(2)}</span>
                    {item.perOrderLimit && <span className="text-xs text-gray-400">每单限 {item.perOrderLimit}</span>}
                  </div>
                  <div className="mt-3">
                    <OpensInButton target={upcoming.activityStartAt} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StockBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((remaining / total) * 100);
  const color = pct > 40 ? "bg-green-400" : pct > 15 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="mt-2">
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">剩余 {remaining} / {total}</p>
    </div>
  );
}

export default function DealsPage() {
  const { items: cartItems, addItem, updateQuantity, isAuthenticated } = useCart();
  const [active, setActive] = useState<ActiveDealDay | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingDealDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deal-days/active")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setActive(d.data.active ?? null);
          setUpcoming(d.data.upcoming ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function getCartQty(dealDayItemId: string) {
    return cartItems.find((i) => i.dealDayItemId === dealDayItemId)?.quantity ?? 0;
  }

  function handleAdd(item: DealItem, dealDay: ActiveDealDay) {
    const qty = getCartQty(item.id);
    if (item.perOrderLimit && qty >= item.perOrderLimit) return;
    addItem({
      productId: item.product.id,
      variantId: item.variant?.id,
      productName: item.product.nameZh,
      variantName: item.variant?.nameZh,
      image: item.product.images[0],
      unitPrice: Number(item.dealPrice),
      dealDayItemId: item.id,
      dealDayId: dealDay.id,
    });
  }

  if (loading) return <p className="text-sm text-gray-400 py-20 text-center">加载中...</p>;

  if (!active && !upcoming) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center px-4">
        <p className="text-2xl mb-2">🛒</p>
        <h1 className="text-lg font-semibold text-gray-700 mb-2">暂无团购活动</h1>
        <p className="text-sm text-gray-400">下次活动开始时这里会显示通知，敬请期待。</p>
      </div>
    );
  }

  if (!active && upcoming) {
    return <UpcomingDealView upcoming={upcoming} />;
  }

  if (!active) return null;

  const soldOut = active.items.every((i) => i.remainingQuantity === 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">今日团购</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{active.titleZh}</h1>
        {active.titleEn && <p className="text-sm text-gray-400">{active.titleEn}</p>}
        {active.descriptionZh && (
          <p className="text-sm text-gray-500 mt-2">{active.descriptionZh}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span>预计配送：{new Date(active.preorderDeliveryDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span>
          {Number(active.deliveryFee) > 0
            ? <span>配送费 ${Number(active.deliveryFee).toFixed(2)}</span>
            : <span className="text-green-600 font-medium">免配送费</span>
          }
          {soldOut && (
            <span className="text-red-500 font-medium">已售罄</span>
          )}
        </div>

        {active.showCountdown && (
          <div className="mt-4 inline-block bg-gray-50 border border-gray-100 rounded-xl px-5 py-3">
            <CountdownDisplay label="距活动结束" target={active.activityEndAt} />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {active.items.map((item) => {
          const isSoldOut = item.remainingQuantity === 0 || item.status === "sold_out";
          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-opacity ${isSoldOut ? "opacity-60" : ""}`}
            >
              {item.product.images[0] ? (
                <div className="relative w-full aspect-[4/3] bg-gray-100">
                  <Image src={item.product.images[0]} alt={item.product.nameZh} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-gray-100" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">
                  {item.product.nameZh}
                  {item.variant && <span className="text-gray-400 font-normal"> · {item.variant.nameZh}</span>}
                </h3>
                {item.product.nameEn && (
                  <p className="text-xs text-gray-400">{item.product.nameEn}</p>
                )}

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    ${Number(item.dealPrice).toFixed(2)}
                  </span>
                  {item.perOrderLimit && (
                    <span className="text-xs text-gray-400">每单限 {item.perOrderLimit}</span>
                  )}
                </div>

                <StockBar remaining={item.remainingQuantity} total={item.totalQuantity} />

                <div className="mt-3">
                  {isSoldOut ? (
                    <div className="w-full py-2 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">
                      已售罄
                    </div>
                  ) : isAuthenticated === false ? (
                    <Link
                      href={`/login?redirect=/deals`}
                      className="block w-full py-2 text-center text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      登录后加入购物车
                    </Link>
                  ) : (() => {
                    const qty = getCartQty(item.id);
                    const atLimit = !!(item.perOrderLimit && qty >= item.perOrderLimit);
                    return (
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.variant?.id, -1, item.id)}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:text-gray-900 text-lg font-light transition-colors"
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold text-gray-900 min-w-[1.25rem] text-center">{qty}</span>
                          </>
                        )}
                        <button
                          onClick={() => handleAdd(item, active)}
                          disabled={atLimit}
                          aria-label="加入购物车"
                          className="relative w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-150 active:scale-90 shadow-sm disabled:opacity-30"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-gray-900 rounded-full text-[9px] font-black flex items-center justify-center leading-none shadow-sm">+</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
