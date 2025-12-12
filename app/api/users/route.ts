import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  // Exclude passwords from response
  const safeUsers = users.map(({ password, ...rest }) => rest);
  return NextResponse.json(safeUsers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, username, password, role } = body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashedPassword,
      role: role as Role,
    },
  });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}
