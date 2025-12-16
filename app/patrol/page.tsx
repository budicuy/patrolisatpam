import { redirect } from "next/navigation";
import { getLocations } from "@/app/actions/locations";
import { getShifts } from "@/app/actions/shifts";
import { auth } from "@/lib/auth";
import PatrolInterface from "./_components/patrol-interface";

export default async function PatrolPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const locations = await getLocations();
  const shifts = await getShifts();

  // Pass user info to client component
  return (
    <PatrolInterface
      user={session.user}
      locations={locations}
      shifts={shifts}
    />
  );
}
