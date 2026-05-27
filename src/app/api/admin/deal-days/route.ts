import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/require-auth";
import { ok, fail, serverError } from "@/lib/response";

const createSchema = z.object({
  titleZh: z.string().min(1, "请填写活动名称"),
  titleEn: z.string().optional(),
  descriptionZh: z.string().optional(),
  descriptionEn: z.string().optional(),
  activityStartAt: z.string().datetime(),
  activityEndAt: z.string().datetime(),
  preorderDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式错误"),
  deliveryFee: z.number().min(0).default(0),
  showCountdown: z.boolean().default(true),
});

export async function GET() {
  try {
    const { error } = await requireAuth(["admin", "staff"]);
    if (error) return error;

    const dealDays = await prisma.dealDay.findMany({
      orderBy: { activityStartAt: "desc" },
      include: {
        _count: { select: { items: true, orders: true } },
      },
    });

    return ok(dealDays);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(["admin"]);
    if (error) return error;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return fail(parsed.error.errors[0].message);

    const { preorderDeliveryDate, activityStartAt, activityEndAt, ...rest } = parsed.data;

    if (new Date(activityEndAt) <= new Date(activityStartAt)) {
      return fail("结束时间必须晚于开始时间");
    }

    const dealDay = await prisma.dealDay.create({
      data: {
        ...rest,
        activityStartAt: new Date(activityStartAt),
        activityEndAt: new Date(activityEndAt),
        preorderDeliveryDate: new Date(preorderDeliveryDate),
        createdBy: session!.userId,
      },
    });

    return ok(dealDay);
  } catch {
    return serverError();
  }
}
