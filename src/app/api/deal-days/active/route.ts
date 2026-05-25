import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const now = new Date();
    const dealDay = await prisma.dealDay.findFirst({
      where: {
        isEnabled: true,
        activityStartAt: { lte: now },
        activityEndAt: { gte: now },
      },
      select: {
        id: true,
        titleZh: true,
        preorderDeliveryDate: true,
        deliveryFee: true,
        activityEndAt: true,
      },
    });
    return ok(dealDay); // null if none active
  } catch {
    return serverError();
  }
}
