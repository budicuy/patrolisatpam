import { hash } from "bcryptjs";
import { db } from "./lib/db";
import { users } from "./lib/schema";

const main = async () => {
  try {
    const passwordHash = await hash("password123", 10);

    await db
      .insert(users)
      .values([
        {
          username: "admin",
          name: "Administrator",
          password: passwordHash,
          role: "admin",
        },
        {
          username: "satpam",
          name: "Satpam 01",
          password: passwordHash,
          role: "satpam",
        },
      ])
      .onConflictDoNothing();

    console.log("Seeding complete!");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

main();
