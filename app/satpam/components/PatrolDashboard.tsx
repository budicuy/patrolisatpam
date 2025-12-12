"use client";

import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Play,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { calculateDistance } from "@/app/lib/geoloc";

interface Location {
  id: string;
  namaLokasi: string;
  latitude: number;
  longitude: number;
  radius: number;
  urutan: number;
}

interface Shift {
  id: string;
  namaShift: string;
  jamMulai: string;
  jamSelesai: string;
}

interface Props {
  initialLocations: Location[];
  shifts: Shift[];
  userId: string;
}

export default function PatrolDashboard({
  initialLocations,
  shifts,
  userId,
}: Props) {
  const [status, setStatus] = useState<"IDLE" | "ONGOING">("IDLE");
  const [patrolId, setPatrolId] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);

  // Initial check for ongoing patrol
  useEffect(() => {
    checkCurrentPatrol();
    if (shifts.length > 0) setSelectedShift(shifts[0].id);

    // Start GPS watch
    startWatchingPosition();

    return () => {
      if (watchId.current !== null)
        navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const startWatchingPosition = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
    );
  };

  const checkCurrentPatrol = async () => {
    try {
      const res = await fetch("/api/patrol/start"); // GET endpoint
      const data = await res.json();
      if (data && data.status === "ONGOING") {
        setStatus("ONGOING");
        setPatrolId(data.id);
        if (data.checkpoints) {
          setCheckedIds(
            new Set(data.checkpoints.map((c: any) => c.dataTempatId)),
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startPatrol = async () => {
    if (!selectedShift) return alert("Pilih shift terlebih dahulu");
    setLoading(true);
    try {
      const res = await fetch("/api/patrol/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: selectedShift }),
      });
      const data = await res.json();
      if (data.id) {
        setStatus("ONGOING");
        setPatrolId(data.id);
      }
    } catch (e) {
      alert("Gagal memulai patroli");
    } finally {
      setLoading(false);
    }
  };

  const finishPatrol = async () => {
    if (!confirm("Apakah anda yakin ingin menyelesaikan patroli?")) return;
    setLoading(true);
    try {
      await fetch("/api/patrol/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyPatroliId: patrolId }),
      });
      setStatus("IDLE");
      setPatrolId(null);
      setCheckedIds(new Set());
    } catch (e) {
      alert("Gagal menyelesaikan patroli");
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (locationId: string) => {
    if (!currentPos || !patrolId) return;
    setCheckingId(locationId);
    try {
      const res = await fetch("/api/patrol/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historyPatroliId: patrolId,
          dataTempatId: locationId,
          latitude: currentPos.latitude,
          longitude: currentPos.longitude,
        }),
      });

      if (res.ok) {
        setCheckedIds((prev) => new Set(prev).add(locationId));
      } else {
        const err = await res.json();
        alert(err.error || "Gagal check-in");
      }
    } catch (e) {
      alert("Error connection");
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* GPS Status Alert */}
      {gpsError && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          <AlertCircle className="inline mr-2" /> GPS Error: {gpsError}
        </div>
      )}

      {/* Control Panel */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">
          Status Patroli
        </h2>

        {status === "IDLE" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pilih Shift
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaShift} ({s.jamMulai} - {s.jamSelesai})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={startPatrol}
              disabled={loading || !currentPos}
              className="flex w-full items-center justify-center rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <Play className="mr-2" />
              )}
              MULAI PATROLI
            </button>
            {!currentPos && (
              <p className="text-xs text-red-500 text-center">
                Menunggu sinyal GPS...
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 p-4 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              <span className="font-bold flex items-center">
                <Loader2 className="animate-spin mr-2 h-4 w-4" /> SEDANG PATROLI
              </span>
              <span className="text-sm">
                Lokasi dicek: {checkedIds.size} / {initialLocations.length}
              </span>
            </div>
            <button
              onClick={finishPatrol}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-700"
            >
              <Square className="mr-2 fill-current" />
              SELESAI PATROLI
            </button>
          </div>
        )}
      </div>

      {/* Location List */}
      <div className="space-y-4">
        {initialLocations.map((loc) => {
          const isChecked = checkedIds.has(loc.id);
          const distance = currentPos
            ? calculateDistance(currentPos, {
                latitude: loc.latitude,
                longitude: loc.longitude,
              })
            : null;
          const isNear = distance !== null && distance <= loc.radius;
          const canCheck = status === "ONGOING" && !isChecked && isNear;

          return (
            <div
              key={loc.id}
              className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all ${
                isChecked
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                      {loc.urutan}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {loc.namaLokasi}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1 h-4 w-4" />
                    {distance !== null ? `${distance}m` : "Wait GPS..."}
                    <span className="mx-2">•</span>
                    Radius: {loc.radius}m
                  </div>
                </div>

                {isChecked ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <button
                    onClick={() => checkIn(loc.id)}
                    disabled={!canCheck || checkingId === loc.id}
                    className={`rounded-lg px-4 py-2 font-bold text-white transition-colors ${
                      canCheck
                        ? "bg-blue-600 hover:bg-blue-700 shadow-md"
                        : "bg-gray-300 cursor-not-allowed text-gray-500"
                    }`}
                  >
                    {checkingId === loc.id ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      "CHECK"
                    )}
                  </button>
                )}
              </div>

              {!isChecked && status === "ONGOING" && !isNear && currentPos && (
                <div className="mt-2 text-xs text-amber-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Terlalu jauh untuk check-in
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
