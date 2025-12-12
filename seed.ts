import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import { users } from "./lib/db/schema";

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Check if admin exists
  const adminExists = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "admin"),
  });

  if (!adminExists) {
    await db.insert(users).values({
      name: "Administrator",
      username: "admin",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin user created: admin / password123");
  }

  // Check if satpam exists
  const satpamExists = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "satpam"),
  });

  if (!satpamExists) {
    await db.insert(users).values({
      name: "Budi Satpam",
      username: "satpam",
      password: hashedPassword,
      role: "satpam",
    });
    console.log("Satpam user created: satpam / password123");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
