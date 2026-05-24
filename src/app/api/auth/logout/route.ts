import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/response";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(clearSessionCookie());
  return ok({ message: "已登出" });
}
