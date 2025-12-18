import { redirect } from "next/navigation";
import { getLocations } from "@/app/actions/locations";
import { getActiveShiftId } from "@/app/actions/patrol";
import { getShifts } from "@/app/actions/shifts";
import { auth } from "@/lib/auth";
import PatrolInterface from "./_components/patrol-interface";

interface PatrolUser {
  id: string;
  name: string;
  username: string;
}

export default async function PatrolPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locations = await getLocations();
  const shifts = await getShifts();

  // Calculate active shift on server-side (SECURE)
  const initialActiveShiftId = await getActiveShiftId(shifts);
  const serverTime = new Date().toISOString();

  // Cast session user to PatrolUser type
  const user: PatrolUser = {
    id: session.user.id as string,
    name: session.user.name as string,
    username: (session.user as { username?: string }).username as string,
  };

  // Pass user info to client component
  return (
    <PatrolInterface
      user={user}
      locations={locations}
      shifts={shifts}
      initialActiveShiftId={initialActiveShiftId}
      serverTime={serverTime}
    />
  );
}
