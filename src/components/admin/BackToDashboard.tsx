"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BackToDashboard() {
  const pathname = usePathname();
  if (pathname === "/admin/dashboard") return null;

  return (
    <Link
      href="/admin/dashboard"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <span>←</span>
      <span>返回 Dashboard</span>
    </Link>
  );
}
