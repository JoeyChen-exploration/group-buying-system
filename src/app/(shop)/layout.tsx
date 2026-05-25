import Link from "next/link";
import { getSession } from "@/lib/auth";
import { CartProvider } from "@/context/CartContext";
import CartIcon from "@/components/shop/CartIcon";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-base font-bold text-gray-900 tracking-tight">
              悦味烘焙工坊
            </Link>
            <div className="flex items-center gap-4">
              <CartIcon />
              {session ? (
                <span className="text-sm text-gray-600">{session.name}</span>
              ) : (
                <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  登录
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </div>
    </CartProvider>
  );
}
