"use client";

import { LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getPatrolState, logout, startPatrolSession } from "@/app/actions";
import { Button } from "@/components/ui/button";

const PatrolMap = dynamic(() => import("@/components/PatrolMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-gray-200 animate-pulse rounded flex items-center justify-center">
      Memuat Peta...
    </div>
  ),
});

// Infer types roughly from what getPatrolState returns
// Ideally shared types, but inline is fine for now
interface PatrolState {
  session: any; // Using any for brevity as exact shape matches PatrolMap expectations
  locations: any[];
}

export default function PatrolPage() {
  const [data, setData] = useState<PatrolState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await getPatrolState();
      // Type assertion since getPatrolState returns { session, locations } or null
      setData(res as PatrolState);
    } catch (error) {
      console.error("Failed to fetch patrol state", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStart = async () => {
    await startPatrolSession();
    fetchData();
  };

  if (loading)
    return <div className="p-4 flex justify-center">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="flex justify-between items-center mb-4 bg-white p-4 rounded shadow">
        <div>
          <h1 className="text-xl font-bold">Patroli Satpam</h1>
          <p className="text-sm text-gray-500">
            {data?.session
              ? `Sesi Berjalan: ${data.session.startTime}`
              : "Siap Patroli"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout()}
          className="text-red-600"
        >
          <LogOut />
        </Button>
      </header>

      <main>
        {!data?.session ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Mulai Patroli</h2>
              <p className="text-gray-600 max-w-xs mx-auto">
                Pastikan Anda berada di area kantor dan siap berkeliling. GPS
                akan dilacak.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full max-w-sm h-16 text-xl bg-blue-600 hover:bg-blue-700"
              onClick={handleStart}
            >
              MULAI SESI
            </Button>
            <p className="text-xs text-gray-400">Pastikan GPS Aktif</p>
          </div>
        ) : (
          <PatrolMap
            session={data.session}
            locations={data.locations}
            onUpdate={fetchData}
          />
        )}
      </main>
    </div>
  );
}
