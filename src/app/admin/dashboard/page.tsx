import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">后台管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          欢迎回来，{session.name}（{session.role === "admin" ? "管理员" : "店员"}）
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "订单管理", href: "/admin/orders" },
            { label: "商品管理", href: "/admin/products" },
            { label: "优惠日管理", href: "/admin/deal-days" },
            { label: "数据导出", href: "/admin/export" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
