"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit,
  Eye,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { deletePatrolLog, updatePatrolLog } from "@/app/actions/history";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PatrolLog = {
  id: number;
  checkInTime: Date;
  userId: number | null;
  userName: string | null;
  locationName: string | null;
  shiftId: number | null;
  shiftName: string | null;
  status: "aman" | "tidak_aman" | null;
  notes: string | null;
  imageData: string | null;
  roundNumber: number;
};

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
};

type Location = {
  id: number;
  name: string;
  order: number;
};

type Props = {
  history: PatrolLog[];
  currentPage: number;
  totalPages: number;
  shifts: Shift[];
  locations: Location[];
};

type RoundData = {
  roundNumber: number;
  logs: PatrolLog[];
  unpatrolledLocations: Location[];
  isComplete: boolean;
  patrolledCount: number;
  totalLocations: number;
};

type ShiftGroup = {
  shiftId: number;
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  date: string;
  dateFormatted: string;
  rounds: RoundData[];
  completedRounds: number;
};

export function PatrolHistoryTable({
  history,
  currentPage,
  totalPages,
  shifts,
  locations,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [editingLog, setEditingLog] = useState<{
    id: number;
    status: "aman" | "tidak_aman";
    notes: string;
  } | null>(null);

  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  // Filters State
  const filterDate = searchParams.get("date") || "";
  const filterShiftId = searchParams.get("shiftId") || "";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("?");
  };

  const executeDelete = async () => {
    if (!deletingLogId) return;
    try {
      const res = await deletePatrolLog(deletingLogId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Log berhasil dihapus");
        setDeletingLogId(null);
      }
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const handleUpdate = async () => {
    if (!editingLog) return;
    try {
      const res = await updatePatrolLog(editingLog.id, {
        status: editingLog.status,
        notes: editingLog.notes,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Log berhasil diperbarui");
        setEditingLog(null);
      }
    } catch {
      toast.error("Gagal update");
    }
  };

  // Group by date -> shift -> round
  const groupedData = (): ShiftGroup[] => {
    const groups: Record<string, ShiftGroup> = {};

    for (const log of history) {
      if (!log.shiftId || !log.checkInTime) continue;

      const dateKey = format(new Date(log.checkInTime), "yyyy-MM-dd");
      const key = `${dateKey}-${log.shiftId}`;

      if (!groups[key]) {
        const shift = shifts.find((s) => s.id === log.shiftId);
        groups[key] = {
          shiftId: log.shiftId,
          shiftName: log.shiftName || "Unknown Shift",
          shiftStartTime: shift?.startTime || "",
          shiftEndTime: shift?.endTime || "",
          date: dateKey,
          dateFormatted: format(new Date(log.checkInTime), "EEEE, d MMMM yyyy", {
            locale: id,
          }),
          rounds: [],
          completedRounds: 0,
        };

        // Initialize 5 rounds with location tracking
        for (let i = 1; i <= 5; i++) {
          groups[key].rounds.push({
            roundNumber: i,
            logs: [],
            unpatrolledLocations: [...locations].sort((a, b) => a.order - b.order),
            isComplete: false,
            patrolledCount: 0,
            totalLocations: locations.length,
          });
        }
      }

      // Add log to appropriate round
      const roundIndex = (log.roundNumber || 1) - 1;
      if (roundIndex >= 0 && roundIndex < 5) {
        groups[key].rounds[roundIndex].logs.push(log);
      }
    }

    // Calculate completed rounds and unpatrolled locations
    for (const key in groups) {
      for (const round of groups[key].rounds) {
        // Get patrolled location names
        const patrolledLocationNames = new Set(
          round.logs.map((l) => l.locationName)
        );

        // Filter out patrolled locations
        round.unpatrolledLocations = locations
          .filter((loc) => !patrolledLocationNames.has(loc.name))
          .sort((a, b) => a.order - b.order);

        round.patrolledCount = patrolledLocationNames.size;
        round.isComplete = round.unpatrolledLocations.length === 0 && round.logs.length > 0;

        round.logs.sort(
          (a, b) =>
            new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );
      }
      groups[key].completedRounds = groups[key].rounds.filter(
        (r) => r.isComplete
      ).length;
    }

    return Object.values(groups).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.shiftName.localeCompare(b.shiftName);
    });
  };

  const shiftGroups = groupedData();

  const toggleShift = (key: string) => {
    setExpandedShift(expandedShift === key ? null : key);
  };

  const toggleRound = (key: string) => {
    setExpandedRound(expandedRound === key ? null : key);
  };

  return (
    <>
      {/* Filters */}
      <div className="space-y-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <Label htmlFor="date-filter" className="mb-2 block text-xs">
              Filter Tanggal
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              <Input
                type="date"
                id="date-filter"
                className="pl-9 w-full sm:w-[180px]"
                value={filterDate}
                onChange={(e) => handleFilterChange("date", e.target.value)}
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="shift-filter" className="mb-2 block text-xs">
              Filter Shift
            </Label>
            <Select
              value={filterShiftId || "all"}
              onValueChange={(val) =>
                handleFilterChange("shiftId", val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Semua Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Shift</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id.toString()}>
                    {shift.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterDate || filterShiftId) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              title="Reset Filter"
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Shift Cards */}
      <div className="space-y-4">
        {shiftGroups.length === 0 ? (
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Belum ada data riwayat patroli.</p>
          </div>
        ) : (
          shiftGroups.map((group) => {
            const shiftKey = `${group.date}-${group.shiftId}`;
            const isShiftExpanded = expandedShift === shiftKey;

            return (
              <div
                key={shiftKey}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Shift Header */}
                <button
                  type="button"
                  className={cn(
                    "w-full p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors",
                    isShiftExpanded && "bg-gray-50"
                  )}
                  onClick={() => toggleShift(shiftKey)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        group.completedRounds === 5
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      )}
                    >
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900">
                        {group.shiftName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
                          {group.shiftStartTime} - {group.shiftEndTime}
                        </span>
                        <span>•</span>
                        <span>{group.dateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-xl font-bold",
                          group.completedRounds === 5
                            ? "text-green-600"
                            : "text-blue-600"
                        )}
                      >
                        {group.completedRounds}
                      </span>
                      <span className="text-sm text-gray-400 font-medium">
                        /5
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        Putaran
                      </p>
                    </div>
                    {isShiftExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-100">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      group.completedRounds === 5
                        ? "bg-green-500"
                        : "bg-blue-500"
                    )}
                    style={{ width: `${(group.completedRounds / 5) * 100}%` }}
                  />
                </div>

                {/* Rounds */}
                {isShiftExpanded && (
                  <div className="bg-gray-50/40 p-4 border-t border-gray-100 animate-in slide-in-from-top-1 space-y-2">
                    {group.rounds.map((round) => {
                      const roundKey = `${shiftKey}-${round.roundNumber}`;
                      const isRoundExpanded = expandedRound === roundKey;

                      return (
                        <div
                          key={roundKey}
                          className="rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm"
                        >
                          {/* Round Header */}
                          <button
                            type="button"
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleRound(roundKey)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border",
                                  round.isComplete
                                    ? "bg-green-100 border-green-200 text-green-700"
                                    : "bg-gray-100 border-gray-200 text-gray-400"
                                )}
                              >
                                {round.roundNumber}
                              </div>
                              <span className="font-medium text-sm text-gray-700">
                                Putaran {round.roundNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {round.isComplete ? (
                                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Selesai</span>
                                </div>
                              ) : round.logs.length > 0 ? (
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                  {round.patrolledCount}/{round.totalLocations} Titik
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-gray-400">
                                  Belum ada data
                                </span>
                              )}
                              {isRoundExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Round Logs */}
                          {isRoundExpanded && (
                            <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50/30">
                              {/* Patrolled locations */}
                              {round.logs.map((log) => (
                                <div
                                  key={log.id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg bg-white border",
                                    log.status === "tidak_aman"
                                      ? "border-red-200 bg-red-50/50"
                                      : "border-gray-100"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <MapPin
                                      className={cn(
                                        "h-4 w-4",
                                        log.status === "tidak_aman"
                                          ? "text-red-500"
                                          : "text-green-500"
                                      )}
                                    />
                                    <div>
                                      <p className="font-medium text-sm text-gray-900">
                                        {log.locationName}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>
                                          {format(
                                            new Date(log.checkInTime),
                                            "HH:mm"
                                          )}
                                        </span>
                                        <span>•</span>
                                        <span>{log.userName}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "px-2 py-1 rounded text-xs font-bold uppercase",
                                        log.status === "tidak_aman"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-green-100 text-green-700"
                                      )}
                                    >
                                      {log.status === "tidak_aman"
                                        ? "Unsafe"
                                        : "Safe"}
                                    </span>

                                    {log.imageData && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedImage(log.imageData)
                                        }
                                        className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        title="Lihat Gambar"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingLog({
                                          id: log.id,
                                          status: log.status || "aman",
                                          notes: log.notes || "",
                                        })
                                      }
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
                                      title="Edit"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeletingLogId(log.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* Unpatrolled locations */}
                              {round.unpatrolledLocations.map((loc) => (
                                <div
                                  key={`unpatrolled-${loc.id}`}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100"
                                >
                                  <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-gray-300" />
                                    <p className="font-medium text-sm text-gray-400">
                                      {loc.name}
                                    </p>
                                  </div>
                                  <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                                    Belum
                                  </span>
                                </div>
                              ))}

                              {round.logs.length === 0 && round.unpatrolledLocations.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">Tidak ada data</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm mt-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            type="button"
            onClick={() => {
              if (currentPage > 1) {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage - 1).toString());
                router.push(`?${params.toString()}`);
              }
            }}
            disabled={currentPage <= 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentPage < totalPages) {
                const params = new URLSearchParams(searchParams);
                params.set("page", (currentPage + 1).toString());
                router.push(`?${params.toString()}`);
              }
            }}
            disabled={currentPage >= totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan halaman <span className="font-bold">{currentPage}</span>{" "}
              dari <span className="font-bold">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                type="button"
                onClick={() => {
                  if (currentPage > 1) {
                    const params = new URLSearchParams(searchParams);
                    params.set("page", (currentPage - 1).toString());
                    router.push(`?${params.toString()}`);
                  }
                }}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, startPage + 4);
                if (endPage - startPage < 4) {
                  startPage = Math.max(1, endPage - 4);
                }
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;

                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set("page", pageNum.toString());
                      router.push(`?${params.toString()}`);
                    }}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                      ? "z-10 bg-blue-600 text-white"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  if (currentPage < totalPages) {
                    const params = new URLSearchParams(searchParams);
                    params.set("page", (currentPage + 1).toString());
                    router.push(`?${params.toString()}`);
                  }
                }}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => { }}
            role="dialog"
            tabIndex={-1}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={selectedImage}
              alt="Bukti Patroli"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Log Patroli</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-status" className="text-sm font-medium">
                  Status
                </label>
                <select
                  id="edit-status"
                  className="w-full border rounded-md p-2 bg-white"
                  value={editingLog.status}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      status: e.target.value as "aman" | "tidak_aman",
                    })
                  }
                >
                  <option value="aman">Aman (Safe)</option>
                  <option value="tidak_aman">Tidak Aman (Unsafe)</option>
                </select>
              </div>
              {editingLog.status === "tidak_aman" && (
                <div className="space-y-2">
                  <label htmlFor="edit-notes" className="text-sm font-medium">
                    Keterangan
                  </label>
                  <textarea
                    id="edit-notes"
                    className="w-full border rounded-md p-2 bg-white min-h-[100px]"
                    value={editingLog.notes || ""}
                    onChange={(e) =>
                      setEditingLog({ ...editingLog, notes: e.target.value })
                    }
                    placeholder="Jelaskan kondisi bahaya..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditingLog(null)}
              className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-900"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white"
            >
              Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingLogId} onOpenChange={() => setDeletingLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Data log patroli ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
