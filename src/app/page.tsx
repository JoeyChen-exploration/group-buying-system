import Link from "next/link";
import { getSession } from "@/lib/auth";

const reviews = [
  {
    name: "Sarah L.",
    text: "每次来都买不够，奶油泡芙是我的心头好。朋友圈推荐之后，闺蜜们都成了回头客。",
    rating: 5,
  },
  {
    name: "Michael W.",
    text: "Birthday cake was absolutely stunning — tasted even better than it looked. The customisation options made it truly special.",
    rating: 5,
  },
  {
    name: "Jessie T.",
    text: "质感超好的一家店，包装精美，每一口都能感受到用心。送礼自用都非常合适。",
    rating: 5,
  },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    // Scroll container: full viewport, snaps each child section
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-pt-14 bg-[#faf9f7] text-gray-900 font-sans">

      {/* Nav — fixed to viewport, sits above everything */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f7]/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">悦味烘焙工坊</span>
            <span className="text-[10px] text-gray-400 tracking-widest uppercase">Joy Taste Bakery</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link href="/orders" className="text-gray-400 hover:text-gray-900 transition-colors">我的订单</Link>
                <Link href="/profile" className="text-gray-500 hover:text-gray-900 transition-colors">{session.name}</Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-gray-400 hover:text-gray-900 transition-colors">登出</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="bg-gray-900 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="h-screen snap-start overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center gap-16 pt-14">

          {/* Text */}
          <div className="flex-1 shrink-0">
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-5">Auckland, New Zealand</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-gray-900 mb-6">
              用心烘焙，<br />每一口都是惊喜
            </h1>
            <p className="text-base text-gray-500 leading-relaxed mb-10 max-w-sm">
              精选食材，手工制作，每日限量。悦味的每一件产品都承载着对品质与美味的执着追求。
            </p>
            <Link
              href="/menu"
              className="inline-block bg-gray-900 text-white text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-gray-700 transition-colors"
            >
              浏览菜单
            </Link>
          </div>

          {/* Image placeholder — portrait card, right-aligned */}
          <div className="shrink-0 flex items-center justify-end">
            <div className="w-64 h-72 rounded-3xl bg-gray-100" />
          </div>

        </div>
      </section>

      {/* ── Section 2: Story ── */}
      <section className="h-screen snap-start flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full grid sm:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">关于我们</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-5 leading-snug">
              源自热爱，<br />成于匠心
            </h2>
            <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
              <p>
                悦味烘焙工坊坐落于奥克兰，由一位热爱烘焙的华人创立。从家庭厨房到专业烘焙间，我们始终坚持一件事：用最好的食材，做最真实的味道。
              </p>
              <p>
                我们不追求量产，只追求每一件产品在出炉时都是完美的状态。无论是日常点心还是定制蛋糕，悦味都会倾注同样的心意。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl" />
            <div className="aspect-[3/4] bg-gray-200 rounded-2xl mt-8" />
          </div>
        </div>
      </section>

      {/* ── Section 3: Owner's message ── */}
      <section className="h-screen snap-start flex items-center px-6">
        <div className="max-w-2xl mx-auto w-full text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-8">创始人寄语</p>
          <blockquote className="text-xl sm:text-2xl font-light text-gray-800 leading-relaxed mb-8 italic">
            "烘焙对我来说不只是一份工作——它是我表达爱与用心的方式。每当看到客人收到蛋糕时眼神发亮，我知道这一切都值得。"
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Vivian</p>
              <p className="text-xs text-gray-400">创始人 · 主烘焙师</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Reviews ── */}
      <section className="h-screen snap-start flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-3">顾客评价</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-10">他们这样说</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#1a1a1a" className="shrink-0">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                <p className="text-xs font-medium text-gray-400">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: CTA + Footer ── */}
      <section className="relative h-screen snap-start flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <div className="w-12 h-px bg-gray-300 mx-auto mb-10" />
          <p className="text-xs tracking-[0.25em] uppercase text-gray-400 mb-5">开始你的甜蜜体验</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            用心烘焙，只为等你
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-10">
            每日限量供应 · 新鲜出炉 · 预订优先
          </p>
          <Link
            href="/menu"
            className="text-sm font-medium text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-all duration-200"
          >
            立即点单 →
          </Link>
          <div className="w-12 h-px bg-gray-300 mx-auto mt-10" />
        </div>
        <footer className="absolute bottom-8 text-xs text-gray-400">
          悦味烘焙工坊 · Joy Taste Bakery · Auckland, NZ
        </footer>
      </section>

    </div>
  );
}
