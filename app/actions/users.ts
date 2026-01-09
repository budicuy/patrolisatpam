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
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    });

    if (existingUser) {
      return { error: "Username already taken" };
    }

    const hashedPassword = await hash(data.password, 10);

    await db.insert(users).values({
      ...data,
      password: hashedPassword,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Gagal membuat user" };
  }
}

export async function updateUser(
  id: number,
  data: Partial<typeof users.$inferInsert> & { password?: string },
) {
  try {
    const updateData: typeof data = { ...data };

    if (data.password) {
      updateData.password = await hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { error: "Gagal mengupdate user" };
  }
}

export async function deleteUser(id: number) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      error: "Gagal menghapus user. Mungkin user terhubung dengan data lain.",
    };
  }
}

export async function toggleUserActive(id: number) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return { error: "User tidak ditemukan" };
    }

    await db
      .update(users)
      .set({ isActive: !user.isActive })
      .where(eq(users.id, id));

    revalidatePath("/admin/users");
    return { success: true, isActive: !user.isActive };
  } catch (error) {
    console.error("Toggle user active error:", error);
    return { error: "Gagal mengubah status user" };
  }
}
