import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: ["info"] });

console.log("DB URL Length:", process.env.DATABASE_URL?.length);
console.log("Runnning Seed...");

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const satpamPassword = await bcrypt.hash("satpam123", 10);

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "Administrator",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Upsert Satpam
  const satpam = await prisma.user.upsert({
    where: { username: "satpam" },
    update: {},
    create: {
      username: "satpam",
      name: "Budi Satpam",
      password: satpamPassword,
      role: Role.SATPAM,
    },
  });

  console.log({ admin, satpam });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
