import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes: require staff or admin role
  if (pathname.startsWith("/admin")) {
    // Admin login page is always accessible
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get("yuwei_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== "admin" && session.role !== "staff")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
