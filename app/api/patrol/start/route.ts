import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shiftId } = await req.json();

  // Check if there is already an ongoing patrol for this user
  const existingPatrol = await prisma.historyPatroli.findFirst({
    where: {
      userId: session.user.id,
      status: "ONGOING",
    },
  });

  if (existingPatrol) {
    return NextResponse.json(existingPatrol);
  }

  const patrol = await prisma.historyPatroli.create({
    data: {
      userId: session.user.id,
      shiftId: shiftId,
      tanggal: new Date(),
      status: "ONGOING",
    },
  });

  return NextResponse.json(patrol);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patrol = await prisma.historyPatroli.findFirst({
    where: {
      userId: session.user.id,
      status: "ONGOING",
    },
    include: {
      checkpoints: true,
    },
  });

  return NextResponse.json(patrol || null);
}
