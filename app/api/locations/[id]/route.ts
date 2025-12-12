import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { namaLokasi, latitude, longitude, radius, urutan } = body;

  const location = await prisma.dataTempat.update({
    where: { id },
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.dataTempat.delete({
    where: { id },
  });
  return NextResponse.json({ message: "Deleted" });
}
