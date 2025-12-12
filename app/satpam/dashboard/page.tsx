import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import PatrolDashboard from "../components/PatrolDashboard";

export default async function SatpamPage() {
  const session = await auth();

  const locations = await prisma.dataTempat.findMany({
    orderBy: { urutan: "asc" },
  });

  const shifts = await prisma.shift.findMany();

  return (
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Patroli Satpam
          </h1>
          <p className="text-sm text-gray-500">Hai, {session?.user?.name}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="button"
            className="rounded-full bg-white p-2 text-red-500 shadow hover:bg-red-50 dark:bg-gray-800"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>

      <PatrolDashboard
        initialLocations={locations}
        shifts={shifts}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
