import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const rules = await prisma.deliveryRule.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(rules);
  } catch {
    return serverError();
  }
}
