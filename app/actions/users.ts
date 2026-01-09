"use server";

import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

// Extended user type for session
interface ExtendedUser {
  id?: string;
  role?: string;
}

// Helper to get current user role
async function getCurrentUserRole(): Promise<{
  role: string | null;
  userId: string | null;
}> {
  const session = await auth();
  if (!session?.user) {
    return { role: null, userId: null };
  }
  const user = session.user as ExtendedUser;
  return { role: user.role || null, userId: user.id || null };
}

export async function getUsers() {
  // Auth check - only admin and hr can view users
  const { role } = await getCurrentUserRole();
  if (!role || (role !== "admin" && role !== "hr")) {
    throw new Error("Unauthorized: Admin or HR access required");
  }

  return await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export async function createUser(data: typeof users.$inferInsert) {
  try {
    // Auth check
    const { role } = await getCurrentUserRole();
    if (!role || (role !== "admin" && role !== "hr")) {
      return { error: "Unauthorized: Admin or HR access required" };
    }

    // Role enforcement: HR can only create satpam users
    if (role === "hr" && data.role !== "satpam") {
      return { error: "HR hanya dapat membuat user dengan role Satpam" };
    }

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
    // Auth check - only admin can update users
    const { role } = await getCurrentUserRole();
    if (!role || role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

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
    // Auth check - only admin can delete users
    const { role } = await getCurrentUserRole();
    if (!role || role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

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
    // Auth check - only admin can toggle user status
    const { role } = await getCurrentUserRole();
    if (!role || role !== "admin") {
      return { error: "Unauthorized: Admin access required" };
    }

    // Single query: UPDATE with NOT operator and RETURNING
    const result = await db
      .update(users)
      .set({ isActive: sql`NOT ${users.isActive}` })
      .where(eq(users.id, id))
      .returning({ isActive: users.isActive });

    if (result.length === 0) {
      return { error: "User tidak ditemukan" };
    }

    revalidatePath("/admin/users");
    return { success: true, isActive: result[0].isActive };
  } catch (error) {
    console.error("Toggle user active error:", error);
    return { error: "Gagal mengubah status user" };
  }
}
