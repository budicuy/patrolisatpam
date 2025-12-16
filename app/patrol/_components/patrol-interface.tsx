"use client";

import { getDistance } from "geolib";
import { CheckCircle, Loader2, LogOut, MapPin, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { checkInPatrol } from "@/app/actions/patrol";

// Dynamic import for Map to avoid SSR issues
const PatrolMap = dynamic(() => import("./patrol-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Loading Map...
    </div>
  ),
});

export default function PatrolInterface({ user, locations, shifts }: any) {
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [targetLocation, setTargetLocation] = useState<any>(null); // The next location to visit
  const [visitedLocations, setVisitedLocations] = useState<string[]>([]);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Initial Logic: Find first unvisited location based on order
  useEffect(() => {
    if (locations.length > 0) {
      // Sort locations by order
      const sortedLocations = [...locations].sort((a, b) => a.order - b.order);

      // Find first location not in visited list
      const next = sortedLocations.find(
        (l) => !visitedLocations.includes(l.id),
      );
      setTargetLocation(next || null);
    }
  }, [locations, visitedLocations]);

  // Geolocation Tracking
  useEffect(() => {
    if (!isPatrolling) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentPosition({ lat: latitude, lng: longitude });
        setAccuracy(accuracy);

        if (targetLocation) {
          const dist = getDistance(
            { latitude, longitude },
            {
              latitude: targetLocation.latitude,
              longitude: targetLocation.longitude,
            },
          );
          setDistanceToTarget(dist);
        }
      },
      (error) => {
        console.error("Error getting location", error);
        let msg = "Gagal mengambil lokasi.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Izin lokasi ditolak. Mohon aktifkan izin lokasi di browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Informasi lokasi tidak tersedia. Coba di area terbuka.";
            break;
          case error.TIMEOUT:
            msg = "Waktu permintaan lokasi habis. Sinyal GPS lemah.";
            break;
          default:
            msg = "Terjadi kesalahan tidak diketahui pada GPS.";
        }
        // Only alert if it's a critical failure not just a temporary timeout in watch
        if (error.code === error.PERMISSION_DENIED) alert(msg);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isPatrolling, targetLocation]);

  const handleManualRefresh = () => {
    setLoading(true);

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCurrentPosition({ lat: latitude, lng: longitude });
      setAccuracy(accuracy);

      if (targetLocation) {
        const dist = getDistance(
          { latitude, longitude },
          {
            latitude: targetLocation.latitude,
            longitude: targetLocation.longitude,
          },
        );
        setDistanceToTarget(dist);
      }
      setLoading(false);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Error forcing location update", error);
      let msg = "Gagal memperbarui lokasi.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = "Izin lokasi ditolak. Cek pengaturan browser.";
          break;
        case error.POSITION_UNAVAILABLE:
          msg = "Lokasi tidak tersedia. Pastikan GPS aktif.";
          break;
        case error.TIMEOUT:
          msg = "Waktu habis. Coba lagi di tempat terbuka.";
          break;
      }
      alert(`${msg} (Code: ${error.code})`);
      setLoading(false);
    };

    // Try High Accuracy first
    navigator.geolocation.getCurrentPosition(
      successCallback,
      (err) => {
        // If High Accuracy fails (e.g. timeout), try Low Accuracy
        console.warn("High accuracy failed, trying low accuracy...", err);
        navigator.geolocation.getCurrentPosition(
          successCallback,
          errorCallback,
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 },
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleStartPatrol = () => {
    if (!selectedShift) {
      alert("Pilih shift terlebih dahulu!");
      return;
    }
    setIsPatrolling(true);
  };

  const handleCheckIn = async () => {
    if (!targetLocation || !distanceToTarget) return;

    // Radius Validation (Allowing slight tolerance, e.g. 5 meters as requested, maybe 10 for GPS drift safety)
    if (distanceToTarget > (targetLocation.radius || 5)) {
      alert(
        `Anda belum berada dalam radius lokasi! Jarak: ${distanceToTarget}m`,
      );
      return;
    }

    setLoading(true);
    try {
      await checkInPatrol(user.id, selectedShift, targetLocation.id);
      setVisitedLocations((prev) => [...prev, targetLocation.id]);
      alert("Check-in berhasil!");
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan check-in.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPatrolling) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
          <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <MapPin className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Mulai Patroli
          </h1>
          <p className="text-gray-500 mb-6">
            Pilih shift jaga Anda untuk memulai pemantauan.
          </p>

          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="mb-8 block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">-- Pilih Shift --</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleStartPatrol}
            disabled={!selectedShift}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            MULAI PATROLI
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 w-full flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-lg font-bold text-red-600 transition-all hover:bg-red-100 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
          >
            <LogOut className="mr-2 h-5 w-5" />
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Top Status Bar */}
      <div className="bg-white p-4 shadow-md z-10 dark:bg-gray-800 absolute top-4 left-4 right-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Patroli Bedas
            </h2>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
              <span>{user.name}</span>
              <span>•</span>
              <span>
                Akurasi: {accuracy ? `${Math.round(accuracy)}m` : "..."}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-full p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              title="Refresh Lokasi"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <div
              className={`h-3 w-3 rounded-full ${distanceToTarget && targetLocation && distanceToTarget <= targetLocation.radius ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-xs font-mono">
              {distanceToTarget ? `${distanceToTarget}m` : "GPS..."}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="ml-2 rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {targetLocation ? (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1 dark:text-blue-400">
              Tujuan Berikutnya
            </p>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {targetLocation.name}
              </span>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={
                  !distanceToTarget ||
                  distanceToTarget > (targetLocation.radius || 5) ||
                  loading
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-sm active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "CHECK IN"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
            <p className="text-green-700 font-bold flex items-center justify-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Patroli Selesai!
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 z-0">
        <PatrolMap
          currentPosition={currentPosition}
          targetLocation={targetLocation}
          locations={locations}
          visitedLocations={visitedLocations}
        />
      </div>
    </div>
  );
}
