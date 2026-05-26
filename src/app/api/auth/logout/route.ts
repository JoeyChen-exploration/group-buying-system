import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/response";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookie());

  const referer = req.headers.get("referer") ?? "";
  if (referer.includes("/admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Form submission from shop/homepage — redirect back to home
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return ok({ message: "已登出" });
}
