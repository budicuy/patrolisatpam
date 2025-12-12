import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { namaShift, jamMulai, jamSelesai } = body;

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      namaShift,
      jamMulai,
      jamSelesai,
    },
  });

  return NextResponse.json(shift);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.shift.delete({
    where: { id },
  });
  return NextResponse.json({ message: "Deleted" });
}
