import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Delivery rules from README
  const deliveryRules = [
    { areaName: "东区（不含 Flat Bush）", minOrderAmount: 60, description: "普通东区优惠日配送", sortOrder: 1 },
    { areaName: "东区（Flat Bush）",      minOrderAmount: 70, description: "Flat Bush 属于东区，单独起送金额", sortOrder: 2 },
    { areaName: "中区",                    minOrderAmount: 50, description: "优惠日配送", sortOrder: 3 },
    { areaName: "西区",                    minOrderAmount: 80, description: "优惠日配送", sortOrder: 4 },
    { areaName: "北岸阳光超市自提点",      minOrderAmount: 80, description: "店里从 Epsom 送到自提点，顾客到自提点取货", sortOrder: 5 },
  ];

  for (const rule of deliveryRules) {
    await prisma.deliveryRule.upsert({
      where: { areaName: rule.areaName },
      update: {},
      create: {
        areaName: rule.areaName,
        minOrderAmount: rule.minOrderAmount,
        deliveryFee: 0,
        description: rule.description,
        isEnabled: true,
        sortOrder: rule.sortOrder,
      },
    });
  }
  console.log("✓ Delivery rules seeded");

  // Default categories
  const categories = [
    { nameZh: "蛋糕", nameEn: "Cakes", sortOrder: 1 },
    { nameZh: "饼干", nameEn: "Cookies", sortOrder: 2 },
    { nameZh: "面包", nameEn: "Bread", sortOrder: 3 },
    { nameZh: "其他", nameEn: "Others", sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: `cat-${cat.nameEn.toLowerCase()}` },
      update: {},
      create: {
        id: `cat-${cat.nameEn.toLowerCase()}`,
        nameZh: cat.nameZh,
        nameEn: cat.nameEn,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log("✓ Categories seeded");

  // Default admin account — change password after first login
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@yuwei.com" },
    update: {},
    create: {
      name: "管理员",
      email: "admin@yuwei.com",
      passwordHash: adminPassword,
      role: "admin",
    },
  });
  console.log("✓ Admin account seeded (email: admin@yuwei.com, password: Admin@123456)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
