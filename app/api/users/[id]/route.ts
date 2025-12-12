import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { name, username, password, role } = body;

  const updateData: any = {
    name,
    username,
    role: role as Role,
  };

  // Only hash and update password if provided
  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.user.delete({
    where: { id },
  });
  return NextResponse.json({ message: "Deleted" });
}
