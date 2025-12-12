import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shifts = await prisma.shift.findMany();
  return NextResponse.json(shifts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { namaShift, jamMulai, jamSelesai } = body;

  const shift = await prisma.shift.create({
    data: {
      namaShift,
      jamMulai,
      jamSelesai,
    },
  });

  return NextResponse.json(shift);
}
