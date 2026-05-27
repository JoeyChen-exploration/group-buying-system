import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const now = new Date();

    const active = await prisma.dealDay.findFirst({
      where: {
        isEnabled: true,
        activityStartAt: { lte: now },
        activityEndAt: { gte: now },
      },
      include: {
        items: {
          where: { status: { not: "disabled" } },
          include: {
            product: { select: { id: true, nameZh: true, nameEn: true, images: true } },
            variant: { select: { id: true, nameZh: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const upcoming = active
      ? null
      : await prisma.dealDay.findFirst({
          where: {
            isEnabled: true,
            activityStartAt: { gt: now },
          },
          include: {
            items: {
              where: { status: { not: "disabled" } },
              include: {
                product: { select: { id: true, nameZh: true, nameEn: true, images: true } },
                variant: { select: { id: true, nameZh: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { activityStartAt: "asc" },
        });

    return ok({ active, upcoming });
  } catch {
    return serverError();
  }
}
