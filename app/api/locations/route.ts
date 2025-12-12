import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const locations = await prisma.dataTempat.findMany({
    orderBy: { urutan: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { namaLokasi, latitude, longitude, radius, urutan } = body;

  const location = await prisma.dataTempat.create({
    data: {
      namaLokasi,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseInt(radius),
      urutan: parseInt(urutan),
    },
  });

  return NextResponse.json(location);
}
