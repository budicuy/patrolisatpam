"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Edit, Eye, ImageIcon, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { deletePatrolLog, updatePatrolLog } from "@/app/actions/history";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type Props = {
  history: PatrolLog[];
};

type ShiftGroup = {
  shiftId: string;
  shiftName: string;
  date: string;
  dateFormatted: string;
  logs: PatrolLog[];
};

export function PatrolHistoryTable({ history }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<{
    id: string;
    status: "aman" | "tidak_aman";
    notes: string;
  } | null>(null);

  const handleDelete = async (logId: string) => {
    if (!confirm("Yakin ingin menghapus log ini?")) return;
    try {
      const res = await deletePatrolLog(logId);
      if (res.error) {
        alert(res.error);
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
                      <th className="px-4 py-3 font-semibold text-gray-700 w-12 text-center">
                        No
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Control Location
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Waktu
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Nama Petugas
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Kondisi
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-center">
                        Gambar
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-center">
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
                          className={`hover:bg-gray-50 transition-colors ${
                            log.status === "tidak_aman" ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-center text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {log.locationName || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {format(new Date(log.checkInTime), "dd/MM/yyyy")}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono">
                            {format(new Date(log.checkInTime), "HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
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
                              <span className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 text-gray-400">
                                <ImageIcon className="w-4 h-4" />
                              </span>
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
                                onClick={() => handleDelete(log.id)}
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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedImage(null)}
          role="button"
          tabIndex={0}
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
    </>
  );
}
