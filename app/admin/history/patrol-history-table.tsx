"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Edit, Eye, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

type PatrolLog = {
  id: string;
  checkInTime: Date;
  userId: string | null;
  userName: string | null;
  locationName: string | null;
  shiftId: string | null;
  shiftName: string | null;
  status: "aman" | "tidak_aman" | null;
  notes: string | null;
  imageData: string | null;
};

type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

type Props = {
  history: PatrolLog[];
  currentPage: number;
  totalPages: number;
  shifts: Shift[];
};

type ShiftGroup = {
  shiftId: string;
  shiftName: string;
  date: string;
  dateFormatted: string;
  logs: PatrolLog[];
};

export function PatrolHistoryTable({
  history,
  currentPage,
  totalPages,
  shifts,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<{
    id: string;
    status: "aman" | "tidak_aman";
    notes: string;
  } | null>(null);

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
    params.set("page", "1"); // Reset params to page 1
    router.push(`?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("?");
  };

  const handleDeleteClick = (logId: string) => {
    setDeletingLogId(logId);
  };

  // existing code...

  const executeDelete = async () => {
    if (!deletingLogId) return;
    try {
      const res = await deletePatrolLog(deletingLogId);
      if (res.error) {
        alert(res.error);
      } else {
        setDeletingLogId(null);
      }
    } catch {
      alert("Gagal menghapus");
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
        alert(res.error);
      } else {
        setEditingLog(null);
      }
    } catch {
      alert("Gagal update");
    }
  };

  // Group by date then shift
  const groupedByDateAndShift = (): ShiftGroup[] => {
    const groups: Record<string, ShiftGroup> = {};

    for (const log of history) {
      if (!log.shiftId || !log.checkInTime) continue;

      const dateKey = format(new Date(log.checkInTime), "yyyy-MM-dd");
      const key = `${dateKey}-${log.shiftId}`;

      if (!groups[key]) {
        groups[key] = {
          shiftId: log.shiftId,
          shiftName: log.shiftName || "Unknown Shift",
          date: dateKey,
          dateFormatted: format(
            new Date(log.checkInTime),
            "EEEE, d MMMM yyyy",
            {
              locale: id,
            },
          ),
          logs: [],
        };
      }

      groups[key].logs.push(log);
    }

    // Sort logs within each group by time (newest first)
    for (const key in groups) {
      groups[key].logs.sort(
        (a, b) =>
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime(),
      );
    }

    // Sort groups by date (newest first) then by shift name
    return Object.values(groups).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.shiftName.localeCompare(b.shiftName);
    });
  };

  const shiftGroups = groupedByDateAndShift();

  return (
    <>
      <div className="space-y-4 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <Label htmlFor="date-filter" className="mb-2 block text-xs">
              Filter Tanggal
            </Label>
            <Input
              type="date"
              id="date-filter"
              className="w-full sm:w-[200px]"
              value={filterDate}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />
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
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Semua Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Shift</SelectItem>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
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
              className="shrink-0 mb-[2px]"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {shiftGroups.length === 0 ? (
          <div className="rounded-xl bg-white shadow-md p-8 text-center">
            <p className="text-gray-500">Belum ada data riwayat patroli.</p>
          </div>
        ) : (
          shiftGroups.map((group) => (
            <div
              key={`${group.date}-${group.shiftId}`}
              className="rounded-xl bg-white shadow-md overflow-hidden"
            >
              {/* Shift Header */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white">
                  {group.shiftName} : {group.dateFormatted}
                </h2>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700 w-12 text-center text-nowrap">
                        No
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-nowrap">
                        Control Location
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-nowrap text-center">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-nowrap text-center">
                        Waktu
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-nowrap text-center">
                        Nama Petugas
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-nowrap">
                        Kondisi
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-center text-nowrap">
                        Gambar
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-center text-nowrap">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.logs.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                        <td className="px-4 py-4 text-center text-gray-400">
                          -
                        </td>
                      </tr>
                    ) : (
                      group.logs.map((log, index) => (
                        <tr
                          key={log.id}
                          className={`hover:bg-gray-50 transition-colors text-nowrap ${
                            log.status === "tidak_aman" ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-center text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {log.locationName || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-center">
                            {format(new Date(log.checkInTime), "dd/MM/yyyy")}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-center">
                            {format(new Date(log.checkInTime), "HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-gray-900 text-center">
                            {log.userName || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                log.status === "tidak_aman"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {log.status === "tidak_aman" ? "Unsafe" : "Safe"}
                            </span>
                            {log.status === "tidak_aman" && log.notes && (
                              <p className="mt-1 text-xs text-red-600 max-w-[200px] truncate">
                                {log.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.imageData ? (
                              <button
                                type="button"
                                onClick={() => setSelectedImage(log.imageData)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Lihat Gambar"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingLog({
                                    id: log.id,
                                    status: log.status || "aman",
                                    notes: log.notes || "",
                                  })
                                }
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(log.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
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
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan halaman{" "}
              <span className="font-bold">{currentPage}</span> dari{" "}
              <span className="font-bold">{totalPages}</span>
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
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Simple Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                // Shift window if current page is high
                if (totalPages > 5 && currentPage > 3) {
                  p = currentPage - 3 + i + 1;
                  if (p > totalPages)
                    p =
                      totalPages - ((totalPages > 5 ? 5 : totalPages) - 1 - i);
                  // simplified logic: just show surrounding pages
                  p = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                }
                // Correct logic for simple 5 page window centered on current
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
                    aria-current={currentPage === pageNum ? "page" : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
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
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="relative max-w-4xl w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
            role="dialog"
            tabIndex={-1}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Close"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <Image
              src={selectedImage}
              alt="Bukti Patroli"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              unoptimized
            />
            <a
              href={selectedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Buka Full Size
            </a>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingLog}
        onOpenChange={(open) => !open && setEditingLog(null)}
      >
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
                  className="w-full border rounded-md p-2 bg-transparent"
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
                    className="w-full border rounded-md p-2 bg-transparent min-h-[100px]"
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
              Simpan Perubahan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingLogId}
        onOpenChange={() => setDeletingLogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data log patroli ini akan
              dihapus permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
