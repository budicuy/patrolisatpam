"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function getUsers() {
  return await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export async function createUser(data: typeof users.$inferInsert) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, data.username),
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }

  const hashedPassword = await hash(data.password, 10);

  await db.insert(users).values({
    ...data,
    password: hashedPassword,
  });

  revalidatePath("/admin/users");
}

export async function updateUser(
  id: string,
  data: Partial<typeof users.$inferInsert> & { password?: string },
) {
  const updateData: typeof data = { ...data };

  if (data.password) {
    updateData.password = await hash(data.password, 10);
  } else {
    delete updateData.password;
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}
