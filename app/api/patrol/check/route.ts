import { type NextRequest, NextResponse } from "next/server";
import { isWithinRadius } from "@/app/lib/geoloc";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { historyPatroliId, dataTempatId, latitude, longitude } =
    await req.json();

  // Validate Location
  const location = await prisma.dataTempat.findUnique({
    where: { id: dataTempatId },
  });

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  // Validate Distance
  const isClose = isWithinRadius(
    { latitude, longitude },
    { latitude: location.latitude, longitude: location.longitude },
    location.radius,
  );

  if (!isClose) {
    return NextResponse.json(
      { error: "Too far from location" },
      { status: 400 },
    );
  }

  // Check if already checked
  const existingCheck = await prisma.patrolCheckpoint.findFirst({
    where: {
      historyPatroliId,
      dataTempatId,
    },
  });

  if (existingCheck) {
    return NextResponse.json({ message: "Already checked" });
  }

  const checkpoint = await prisma.patrolCheckpoint.create({
    data: {
      historyPatroliId,
      dataTempatId,
      waktuCheck: new Date(),
      latitude,
      longitude,
    },
  });

  return NextResponse.json(checkpoint);
}
