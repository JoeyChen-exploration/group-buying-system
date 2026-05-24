import type { UserRole } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/response";

export async function requireAuth(roles?: UserRole[]) {
  const session = await getSession();
  if (!session) return { error: unauthorized(), session: null };
  if (roles && !roles.includes(session.role)) {
    return { error: forbidden(), session: null };
  }
  return { error: null, session };
}
