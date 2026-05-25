"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const { totalItems } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex p-1">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-[10px] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Link>
  );
}
