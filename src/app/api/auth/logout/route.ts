import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/response";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookie());

  // Redirect to login if request came from a form submission (browser navigation)
  const referer = req.headers.get("referer") ?? "";
  if (referer.includes("/admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return ok({ message: "已登出" });
}
