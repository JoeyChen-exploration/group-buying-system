import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">后台管理</h1>
      <p className="text-sm text-gray-500 mt-1">
        欢迎回来，{session.name}（{session.role === "admin" ? "管理员" : "店员"}）
      </p>
    </div>
  );
}
