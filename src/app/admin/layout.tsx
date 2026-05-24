import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const navItems = [
  { label: "仪表盘", href: "/admin/dashboard" },
  { label: "订单", href: "/admin/orders" },
  { label: "商品", href: "/admin/products" },
  { label: "分类", href: "/admin/categories" },
  { label: "优惠日", href: "/admin/deal-days" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-bold text-gray-900">
              悦味 后台
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {session.name}
              <span className="ml-1.5 text-xs text-gray-400">
                ({session.role === "admin" ? "管理员" : "店员"})
              </span>
            </span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                登出
              </button>
            </form>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
