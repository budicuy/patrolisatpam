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
  Map as MapIcon,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { submitPatrolReport } from "@/app/actions/patrol";
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
  id: string;
  name: string;
  username: string;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  order: number;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function PatrolInterface({
  user,
  locations,
  shifts,
}: {
  user: User;
  locations: Location[];
  shifts: Shift[];
}) {
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null); // The next location to visit
  const [visitedLocations, setVisitedLocations] = useState<string[]>([]);
  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Batch Submission State
  const [logs, setLogs] = useState<
    {
      locationId: string;
      checkInTime: Date;
      status: "aman" | "tidak_aman";
      notes?: string;
      imageData?: string;
    }[]
  >([]);
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
  const [isUploading, setIsUploading] = useState(false);

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
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
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
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    );
  };

  const handleStartPatrol = () => {
    if (!selectedShift) {
      alert("Pilih shift terlebih dahulu!");
      return;
    }
    setPatrolStartTime(new Date());
    setLogs([]); // Reset logs
    setVisitedLocations([]); // Reset visited
    setIsPatrolling(true);
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

    // Check original size to warn only extreme cases (allow compression to fix it)
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (max 10MB input)");
      return;
    }

    setIsCompressing(true);
    try {
      let fileToProcess = file;

      // Only compress if larger than 100KB
      if (file.size > 100 * 1024) {
        const options = {
            maxSizeMB: 0.1, // 100KB target
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        };
        try {
            fileToProcess = await imageCompression(file, options);
        } catch (cErr) {
            console.error("Compression failed", cErr);
            alert("Gagal mengkompres gambar. Menggunakan file asli.");
        }
      }

      // Final Check post-compression
      // Note: imageCompression returns a Blob/File.
      if (fileToProcess.size > 150 * 1024) {
          // Allow slight tolerance (150KB) or strictly enforce? User said 100kb.
          // Let's warn but proceed or fail?
          // User: "maksimal 100kb saja ketika di upload"
          if (fileToProcess.size > 105 * 1024) { // strict 100kb + epsilon
             alert(`Gagal kompresi. Ukuran (${Math.round(fileToProcess.size/1024)}KB) masih > 100KB.`);
             setIsCompressing(false);
             return;
          }
      }

      setCheckInImageFile(fileToProcess);
      setCheckInImagePreview(URL.createObjectURL(fileToProcess));
      setIsCompressing(false);
    } catch (error) {
      console.error("Image processing error:", error);
      alert("Gagal memproses gambar.");
      setIsCompressing(false);
    }
  };

  const confirmCheckIn = async () => {
    if (!targetLocation) return;
    
    if (checkInStatus === "tidak_aman" && !checkInNote) {
       alert("Mohon isi alasan kondisi tidak aman.");
       return;
    }

    setIsUploading(true);
    let finalImageUrl: string | undefined = undefined;

    try {
        if (checkInStatus === "tidak_aman" && checkInImageFile) {
            const formData = new FormData();
            formData.append("file", checkInImageFile);
            finalImageUrl = await uploadImage(formData);
        }

        const newLog = {
          locationId: targetLocation.id,
          checkInTime: new Date(),
          status: checkInStatus,
          notes: checkInNote || undefined,
          imageData: finalImageUrl,
        };

        setLogs((prev) => [...prev, newLog]);
        setVisitedLocations((prev) => [...prev, targetLocation.id]);
        setShowCheckInModal(false);
    } catch (error) {
        console.error("Check-in error:", error);
        alert("Gagal melakukan check-in (Upload error). Silakan coba lagi.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleFinishPatrol = async () => {
    const confirmed = confirm(
      "Apakah Anda yakin ingin mengakhiri patroli dan menyimpan laporan?",
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await submitPatrolReport(user.id, selectedShift, logs);

      if (result.error) {
        alert(result.error);
        return;
      }

      setPatrolEndTime(new Date());
      setShowSummary(true);
      // setIsPatrolling(false); // keep true to show modal overlay
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan laporan.");
    } finally {
      setLoading(false);
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setIsPatrolling(false);
    setPatrolStartTime(null);
    setPatrolEndTime(null);
    setLogs([]);
    setVisitedLocations([]);
    setSelectedShift("");
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
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
            {shifts.map((s) => (
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
    <div className="flex flex-col h-dvh bg-gray-100 dark:bg-gray-900 relative">
      {/* Top Status Bar */}
      <div className="bg-white p-4 shadow-md z-10 dark:bg-gray-800 absolute top-4 left-4 right-4 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
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
              className="rounded-full p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              title="Refresh Lokasi"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <div
              className={`h-3 w-3 rounded-full ${currentPosition ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-xs font-mono">
              {currentPosition
                ? distanceToTarget !== null
                  ? `${Math.round(distanceToTarget)}m`
                  : "Standby"
                : "GPS..."}
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
                onClick={handleCheckInClick}
                disabled={
                  !distanceToTarget ||
                  distanceToTarget > (targetLocation.radius || 5) ||
                  loading
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-sm active:scale-95"
              >
                CHECK IN
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-700 font-bold flex items-center justify-center dark:text-green-400 mb-2">
              <CheckCircle className="mr-2 h-5 w-5" />
              Semua Lokasi Terkunjungi!
            </p>
            <button
              type="button"
              onClick={handleFinishPatrol}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "SELESAI & SIMPAN LAPORAN"
              )}
            </button>
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
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 dark:bg-gray-800 animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Patroli Selesai!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Laporan berhasil disimpan.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 dark:bg-gray-700/50 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2 dark:border-gray-600">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Durasi Patroli</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {getPatrolDuration()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapIcon className="h-4 w-4 mr-2" />
                  <span>Total Lokasi</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {logs.length} Titik
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Riwayat Kunjungan
              </p>
              {logs.map((log) => {
                const loc = locations.find((l) => l.id === log.locationId);
                return (
                  <div
                    key={log.checkInTime.getTime()}
                    className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0 dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {loc?.name || "Unknown"}
                    </span>
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${log.status === "aman" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {log.status === "aman" ? "Aman" : "Bahaya"}
                    </span>
                  </div>
                );
              })}
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
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  checkInStatus === "aman"
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20"
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
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  checkInStatus === "tidak_aman"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20"
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
                    className="w-full min-h-[80px] rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
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
                      className="cursor-pointer flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                    <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img 
                        src={checkInImagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
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
                disabled={checkInStatus === 'tidak_aman' && (!checkInNote || isCompressing || isUploading)}
                className={checkInStatus === 'aman' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
              ) : (
                checkInStatus === 'aman' ? 'Check In Aman' : 'Lapor Bahaya'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
