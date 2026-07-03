import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categoryCount = await prisma.category.count();
  await prisma.$disconnect();

  if (categoryCount === 0) {
    execFileSync("npm", ["run", "db:seed"], { stdio: "inherit" });
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
