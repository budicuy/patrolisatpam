import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { historyPatroliId } = await req.json();

  // Calculate duration
  const patrol = await prisma.historyPatroli.findUnique({
    where: { id: historyPatroliId },
  });

  if (!patrol)
    return NextResponse.json({ error: "Patrol not found" }, { status: 404 });

  const endTime = new Date();
  const duration = Math.floor(
    (endTime.getTime() - new Date(patrol.tanggal).getTime()) / 1000,
  );

  const updatedPatrol = await prisma.historyPatroli.update({
    where: { id: historyPatroliId },
    data: {
      status: "COMPLETED",
      durasi: duration,
    },
  });

  return NextResponse.json(updatedPatrol);
}
