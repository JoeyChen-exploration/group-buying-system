import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
    return ok(categories);
  } catch {
    return serverError();
  }
}
