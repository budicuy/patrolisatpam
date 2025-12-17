import { redirect } from "next/navigation";
import { getLocations } from "@/app/actions/locations";
import { getShifts } from "@/app/actions/shifts";
import { auth } from "@/lib/auth";
import PatrolInterface from "./_components/patrol-interface";
import { getActiveShiftId } from "@/app/actions/patrol";

export default async function PatrolPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locations = await getLocations();
  const shifts = await getShifts();

  // Calculate active shift on server-side (SECURE)
  const initialActiveShiftId = await getActiveShiftId(shifts);
  const serverTime = new Date().toISOString();

  // Pass user info to client component
  return (
    <PatrolInterface
      user={session.user as any}
      locations={locations}
      shifts={shifts}
      initialActiveShiftId={initialActiveShiftId}
      serverTime={serverTime}
    />
  );
}
