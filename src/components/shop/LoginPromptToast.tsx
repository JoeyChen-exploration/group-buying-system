"use client";

import Link from "next/link";
import { useEffect } from "react";

interface Props {
  show: boolean;
  redirectTo?: string;
  onClose: () => void;
}

export default function LoginPromptToast({ show, redirectTo = "/menu", onClose }: Props) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [show, onClose]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm transition-all duration-300 ${
        show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="bg-gray-900 text-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">请先登录</p>
          <p className="text-xs text-gray-400 mt-0.5">登录后即可将商品加入购物车</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="bg-white text-gray-900 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            去登录
          </Link>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
