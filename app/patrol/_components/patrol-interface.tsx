"use client";

import imageCompression from "browser-image-compression";
import { formatDistanceToNow } from "date-fns";
import { id as dateFnsId } from "date-fns/locale";
import { getDistance } from "geolib";
import {
  Camera,
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image"; // Added Import
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { checkInPatrol, getPatrolProgress } from "@/app/actions/patrol";
import { TOTAL_ROUNDS } from "@/lib/constants";
import { uploadImage } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility

// Dynamic import for Map to avoid SSR issues
const PatrolMap = dynamic(() => import("./patrol-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Loading Map...
    </div>
  ),
});

interface User {
  id: string; // Keep as string for display/auth, parse when sending to DB
  name: string;
  username: string;
}

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  order: number;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export default function PatrolInterface({
  user,
  locations,
  shifts,
  initialActiveShiftId,
  serverTime,
}: {
  user: User;
  locations: Location[];
  shifts: Shift[];
  initialActiveShiftId: number | null;
  serverTime: string;
}) {
  const router = useRouter();
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null); // The next location to visit
  const [visitedLocations, setVisitedLocations] = useState<number[]>([]);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);

  const [selectedShift, setSelectedShift] = useState<number | null>(
    initialActiveShiftId,
  );
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [completedRounds, setCompletedRounds] = useState(0);

  const [accuracy, setAccuracy] = useState<number | null>(null);

  // CLOCK LOGIC
  // Initialize with server time to avoid client-side manipulation
  const [now, setNow] = useState(new Date(serverTime));

  useEffect(() => {
    // Tick every second based on previous state (independent of system clock drift/change)
    const timer = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const formattedDate = now.toLocaleDateString("id-ID", {
    timeZone: "Asia/Makassar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Auto-select active shift on mount (redundant but safe if prop updates)
  useEffect(() => {
    if (initialActiveShiftId) {
      setSelectedShift(initialActiveShiftId);
    }
  }, [initialActiveShiftId]);

  // Fetch Patrol Progress (Shared State)
  const fetchProgress = useCallback(async () => {
    if (!selectedShift) return;
    // Don't set global loading here to avoid interrupting UI flow, just background update
    try {
      const progress = await getPatrolProgress(selectedShift);
      setVisitedLocations(progress.visitedLocationIds);
      setCurrentRound(progress.currentRound);
      setCompletedRounds(progress.completedRounds || 0);
    } catch (error) {
      console.error("Failed to fetch progress", error);
    }
  }, [selectedShift]);

  useEffect(() => {
    if (isPatrolling && selectedShift) {
      fetchProgress();
    }
  }, [isPatrolling, selectedShift, fetchProgress]);

  const confirmCheckIn = async () => {
    if (!targetLocation || !selectedShift) return;

    if (checkInStatus === "tidak_aman" && !checkInNote) {
      alert("Mohon isi alasan kondisi tidak aman.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl: string | undefined;

      // 1. Upload Image Immediate if exists
      if (checkInImageFile) {
        const formData = new FormData();
        formData.append("file", checkInImageFile);
        try {
          finalImageUrl = await uploadImage(formData);
        } catch (error) {
          console.error("Upload image failed", error);
          alert("Gagal upload foto, mencoba simpan data tanpa foto...");
        }
      }

      // 2. Immediate DB Insert
      const result = await checkInPatrol(
        Number(user.id),
        selectedShift,
        targetLocation.id,
        currentRound,
        checkInStatus,
        checkInNote,
        finalImageUrl,
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      // 3. Update Local State (Optimistic)
      setVisitedLocations((prev) => [...prev, targetLocation.id]);
      setShowCheckInModal(false);

      // Refresh progress to ensure sync
      fetchProgress();
    } catch (error: unknown) {
      console.error("Check in error", error);
      let msg = "Gagal check in.";
      if (error instanceof Error) msg = error.message;
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Just finish the session locally, logic is already saved in DB
  const handleFinishPatrol = async () => {
    const confirmed = confirm(
      "Apakah Anda yakin ingin mengakhiri sesi patroli? Semua progress sudah tersimpan.",
    );
    if (!confirmed) return;

    setPatrolEndTime(new Date());
    setShowSummary(true);
  };

  const [patrolStartTime, setPatrolStartTime] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [patrolEndTime, setPatrolEndTime] = useState<Date | null>(null);

  // Check In Modal State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<"aman" | "tidak_aman">(
    "aman",
  );
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInImagePreview, setCheckInImagePreview] = useState<string | null>(
    null,
  );
  const [checkInImageFile, setCheckInImageFile] = useState<File | Blob | null>(
    null,
  );
  const [isCompressing, setIsCompressing] = useState(false);

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
        // Suppress repetitive alerts
        if (error.code === error.PERMISSION_DENIED) {
          // alert("Izin lokasi ditolak.");
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isPatrolling, targetLocation]);

  const handleManualRefresh = () => {
    setLoading(true);
    // Sync patrol progress
    fetchProgress().then(() => {
      // Then sync GPS
      navigator.geolocation.getCurrentPosition(
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
          setLoading(false);
        },
        (error) => {
          console.error("GPS Refresh Error", error);
          alert("Gagal refresh GPS. Cek sinyal.");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });
  };

  const handleStartPatrol = () => {
    if (!selectedShift) {
      alert("Pilih shift terlebih dahulu!");
      return;
    }
    setPatrolStartTime(new Date());
    setVisitedLocations([]); // Reset local first, then fetch
    setIsPatrolling(true);
    // Fetch progress will trigger via useEffect
  };

  const handleCheckInClick = () => {
    if (!targetLocation || !distanceToTarget) return;

    // Radius Validation
    if (distanceToTarget > (targetLocation.radius || 5)) {
      alert(
        `Anda belum berada dalam radius lokasi! Jarak: ${distanceToTarget}m`,
      );
      return;
    }

    // Open Modal
    setCheckInStatus("aman");
    setCheckInNote("");
    setCheckInImagePreview(null);
    setCheckInImageFile(null);
    setShowCheckInModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (max 10MB input)");
      return;
    }

    setIsCompressing(true);
    try {
      let fileToProcess = file;
      if (file.size > 100 * 1024) {
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        try {
          fileToProcess = await imageCompression(file, options);
        } catch (cErr) {
          console.error(cErr);
        }
      }
      setCheckInImageFile(fileToProcess);
      setCheckInImagePreview(URL.createObjectURL(fileToProcess));
    } catch (error) {
      alert(`Gagal memproses gambar: ${error}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setIsPatrolling(false);
    setPatrolStartTime(null);
    setPatrolEndTime(null);
    setVisitedLocations([]);
    setVisitedLocations([]);
    setSelectedShift(null);
    router.refresh();
  };

  const getPatrolDuration = () => {
    if (!patrolStartTime || !patrolEndTime) return "-";
    return formatDistanceToNow(patrolStartTime, {
      addSuffix: false,
      locale: dateFnsId,
    });
  };

  if (!isPatrolling) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-6 mx-auto flex h-20 w-48 items-center justify-center">
            <Image src="/logo.webp" alt="Logo" width={210} height={90} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mulai Patroli
          </h1>
          <p className="text-gray-500 mb-6">
            Pilih shift jaga Anda untuk memulai pemantauan.
          </p>

          <div className="mb-6 p-4 bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-gray-200">
            <div className="flex items-center gap-2 mb-1 text-gray-500 text-sm font-medium">
              <Clock className="w-4 h-4" />
              Waktu Sekarang (WITA)
              <br />
            </div>
            <div className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
              {formattedTime}
            </div>
            <div className="text-sm text-gray-400 mt-1">{formattedDate}</div>
          </div>

          <div className="mb-8 space-y-3">
            {shifts.map((shift) => {
              const active = shift.id === initialActiveShiftId;
              return (
                <button
                  type="button"
                  key={shift.id}
                  onClick={() => active && setSelectedShift(shift.id)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && active) {
                      setSelectedShift(shift.id);
                    }
                  }}
                  disabled={!active}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all w-full text-left",
                    selectedShift === shift.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200",
                    !active && "opacity-50 cursor-not-allowed bg-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedShift === shift.id
                          ? "border-blue-600"
                          : "border-gray-300",
                      )}
                    >
                      {selectedShift === shift.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <p
                        className={cn(
                          "font-bold",
                          active ? "text-gray-900" : "text-gray-500",
                        )}
                      >
                        {shift.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                  </div>

                  {!active && (
                    <span className="text-xs font-mono px-2 py-1 bg-gray-200 rounded text-gray-500">
                      Closed
                    </span>
                  )}
                  {active && selectedShift === shift.id && (
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            onClick={handleStartPatrol}
            disabled={!selectedShift || loading}
            className="w-full rounded-xl bg-blue-600 h-14 text-lg font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "MULAI PATROLI"}
          </Button>

          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 w-full flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-lg font-bold text-red-600 transition-all hover:bg-red-100"
          >
            <LogOut className="mr-2 h-5 w-5" />
            LOGOUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-gray-100 relative">
      {/* Top Status Bar */}
      <div className="bg-white p-4 shadow-md z-10 absolute top-4 left-4 right-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {user?.name || "Patroli"}
            </h2>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
              <span>{user.username}</span>
              <span>•</span>
              <span
                className={
                  accuracy && accuracy <= 20
                    ? "text-green-600 font-medium"
                    : "text-amber-600"
                }
              >
                Akurasi: {accuracy ? `${Math.round(accuracy)}m` : "..."}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-full p-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
              title="Refresh Lokasi dan GPS"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <div
              className={`h-3 w-3 rounded-full ${currentPosition ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-xs font-mono text-gray-500">
              {currentPosition
                ? distanceToTarget !== null
                  ? `${Math.round(distanceToTarget)}m`
                  : "Standby"
                : "GPS..."}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="ml-2 rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {targetLocation ? (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                Tujuan Berikutnya
              </p>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Putaran {currentRound}/{TOTAL_ROUNDS}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                {targetLocation.name}
              </span>
              <button
                type="button"
                onClick={handleCheckInClick}
                disabled={
                  !distanceToTarget ||
                  distanceToTarget > (targetLocation.radius || 5) ||
                  loading
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-sm active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "CHECK IN"
                )}
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center p-3 text-gray-500">
            Memuat status patroli...
          </div>
        ) : (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
            {currentRound < TOTAL_ROUNDS ? (
              <>
                <p className="text-green-700 font-bold flex items-center justify-center mb-2">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Putaran {currentRound} Selesai!
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Lanjut ke putaran {currentRound + 1} dari {TOTAL_ROUNDS}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVisitedLocations([]);
                    fetchProgress();
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  Mulai Putaran Berikutnya
                </button>
              </>
            ) : (
              <>
                <p className="text-green-700 font-bold flex items-center justify-center mb-2">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Semua {TOTAL_ROUNDS} Putaran Selesai! 🎉
                </p>
                <button
                  type="button"
                  onClick={handleFinishPatrol}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
                >
                  Lihat Laporan
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 z-0">
        <PatrolMap
          currentPosition={currentPosition}
          targetLocation={targetLocation}
          locations={locations}
          visitedLocations={visitedLocations}
        />
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Patroli Selesai!
              </h3>
              <p className="text-gray-500">Laporan berhasil disimpan.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Durasi Patroli</span>
                </div>
                <span className="font-bold text-gray-900">
                  {getPatrolDuration()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Total Lokasi</span>
                </div>
                <span className="font-bold text-gray-900">
                  {visitedLocations.length} / {locations.length} Titik
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeSummary}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check In Lokasi</DialogTitle>
            <DialogDescription>{targetLocation?.name}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setCheckInStatus("aman")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${checkInStatus === "aman"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-green-200 text-gray-500"
                  }`}
              >
                <CheckCircle
                  className={`h-8 w-8 ${checkInStatus === "aman" ? "fill-green-500 text-white" : ""}`}
                />
                <span className="font-bold">AMAN</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckInStatus("tidak_aman")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${checkInStatus === "tidak_aman"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 hover:border-red-200 text-gray-500"
                  }`}
              >
                <LogOut
                  className={`h-8 w-8 ${checkInStatus === "tidak_aman" ? "fill-red-500 text-white" : ""}`}
                />
                <span className="font-bold">TIDAK AMAN</span>
              </button>
            </div>

            {checkInStatus === "tidak_aman" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Keterangan / Alasan</Label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Jelaskan kondisi tidak aman..."
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto Bukti (Max 100KB - Auto Compress)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="upload-evidence"
                    />
                    <label
                      htmlFor="upload-evidence"
                      className="cursor-pointer flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {isCompressing
                          ? "Mengompres..."
                          : "Ambil / Upload Foto"}
                      </span>
                    </label>
                  </div>

                  {checkInImagePreview && (
                    <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={checkInImagePreview}
                        alt="Preview"
                        width={400}
                        height={300}
                        className="w-full h-32 object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInImagePreview(null);
                          setCheckInImageFile(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCheckInModal(false)}
            >
              Batal
            </Button>
            <Button
              onClick={confirmCheckIn}
              disabled={
                checkInStatus === "tidak_aman" &&
                (!checkInNote || isCompressing)
              }
              className={
                checkInStatus === "aman"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : checkInStatus === "aman" ? (
                "Check In Aman"
              ) : (
                "Lapor Bahaya"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
