import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({
    where: { role: "customer" },
  });
  console.log(`✓ Deleted ${result.count} test customer(s). Admin accounts untouched.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
