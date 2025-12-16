"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { shifts } from "@/lib/schema";

export async function getShifts() {
  return await db.select().from(shifts);
}

export async function createShift(formData: FormData) {
  const name = formData.get("name") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  await db.insert(shifts).values({
    name,
    startTime: startTime,
    endTime: endTime,
  });

  revalidatePath("/admin/shifts");
}

export async function deleteShift(id: string) {
  await db.delete(shifts).where(eq(shifts.id, id));
  revalidatePath("/admin/shifts");
}
