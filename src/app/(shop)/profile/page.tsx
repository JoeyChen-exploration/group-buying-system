"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DeliveryRule { areaName: string; }

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  deliveryArea: string | null;
  addressDetail: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [rules, setRules] = useState<DeliveryRule[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    deliveryArea: "",
    addressDetail: "",
  });
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (!d.success) { router.push("/login?redirect=/profile"); return; }
      const u: UserProfile = d.data;
      setEmail(u.email);
      setForm({
        name: u.name ?? "",
        phone: u.phone ?? "",
        deliveryArea: u.deliveryArea ?? "",
        addressDetail: u.addressDetail ?? "",
      });
      setLoading(false);
    });
    fetch("/api/delivery-rules").then((r) => r.json()).then((d) => {
      if (d.success) setRules(d.data);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          deliveryArea: form.deliveryArea || undefined,
          addressDetail: form.addressDetail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message ?? "保存失败"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-12 text-center">加载中...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <Link href="/menu" className="text-sm text-gray-400 hover:text-gray-700 mb-4 block">← 返回</Link>
      <h1 className="text-xl font-bold text-gray-900 mb-6">个人资料</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email — read only */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">账号</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">邮箱（不可修改）</label>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </section>

        {/* Basic info */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">基本信息</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">姓名</label>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">手机号 <span className="text-gray-400">（选填）</span></label>
            <input
              className="input"
              placeholder="+64 ..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </section>

        {/* Default delivery */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">默认配送信息 <span className="text-gray-400 font-normal text-xs">（结算时自动填入）</span></h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">配送区域</label>
            <select
              className="input"
              value={form.deliveryArea}
              onChange={(e) => setForm({ ...form, deliveryArea: e.target.value })}
            >
              <option value="">不设置</option>
              {rules.map((r) => (
                <option key={r.areaName} value={r.areaName}>{r.areaName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">详细地址</label>
            <input
              className="input"
              placeholder="街道门牌号、公寓号等"
              value={form.addressDetail}
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">已保存</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
