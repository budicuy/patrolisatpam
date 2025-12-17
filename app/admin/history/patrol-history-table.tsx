"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
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
  shiftName: string | null;
  status: "aman" | "tidak_aman" | null;
  notes: string | null;
  imageData: string | null;
};

type Props = {
  history: PatrolLog[];
};

export function PatrolHistoryTable({ history }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<{
    userName: string;
    date: Date;
    logs: {
      id: string;
      time: Date;
      locationName: string | null;
      status: "aman" | "tidak_aman" | null;
      notes: string | null;
      imageData: string | null;
    }[];
  } | null>(null);

  // Edit State
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
      } else {
        // Close modal or refresh - simplicity: close modal
        setSelectedGroup(null);
      }
    } catch (e) {
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
        setSelectedGroup(null); // Force refresh by closing
      }
    } catch (e) {
      alert("Gagal update");
    }
  };

  const groupedHistory = Object.values(
    history.reduce(
      (acc, log) => {
        if (!log.userId || !log.checkInTime) return acc;

        const dateKey = format(new Date(log.checkInTime), "yyyy-MM-dd");
        const key = `${log.userId}-${dateKey}`;

        if (!acc[key]) {
          acc[key] = {
            id: key,
            userId: log.userId,
            userName: log.userName || "Unknown",
            date: new Date(log.checkInTime),
            locations: new Set<string>(),
            shifts: new Set<string>(),
            logs: [],
          };
        }

        if (log.locationName) acc[key].locations.add(log.locationName);
        if (log.shiftName) acc[key].shifts.add(log.shiftName);

        acc[key].logs.push({
          id: log.id,
          time: new Date(log.checkInTime),
          locationName: log.locationName,
          status: log.status,
          notes: log.notes,
          imageData: log.imageData,
        });

        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          userId: string;
          userName: string;
          date: Date;
          locations: Set<string>;
          shifts: Set<string>;
          logs: {
            id: string;
            time: Date;
            locationName: string | null;
            status: "aman" | "tidak_aman" | null;
            notes: string | null;
            imageData: string | null;
          }[];
        }
      >,
    ),
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <div className="rounded-xl bg-white shadow-md dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Petugas
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Lokasi
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Shift
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                  Waktu Check-In
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {groupedHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Belum ada data riwayat.
                  </td>
                </tr>
              ) : (
                groupedHistory.map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{group.userName}</span>
                        <span className="text-xs text-gray-500">
                          {format(group.date, "dd MMMM yyyy", { locale: id })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(group.locations).map((loc) => (
                          <span
                            key={loc}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {Array.from(group.shifts).join(", ")}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedGroup({
                            userName: group.userName,
                            date: group.date,
                            logs: group.logs,
                          })
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm underline decoration-blue-600/30 hover:decoration-blue-600 transition-all"
                      >
                        Lihat Detail ({group.logs.length} Check-in)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detail Check-In
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedGroup(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-400 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    role="img"
                    aria-label="Close"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-200">
                  {selectedGroup.userName}
                </span>
                <span>
                  {format(selectedGroup.date, "EEEE, dd MMMM yyyy", {
                    locale: id,
                  })}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
              {selectedGroup.logs
                .sort((a, b) => b.time.getTime() - a.time.getTime())
                .map((log, i) => (
                  <div
                    key={`${i}-${log.time.getTime()}`}
                    className={`flex flex-col p-4 rounded-xl border ${
                      log.status === "tidak_aman"
                        ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/50"
                        : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                    } shadow-sm`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          {log.locationName || "Unknown Location"}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              log.status === "tidak_aman"
                                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {log.status === "tidak_aman" ? "BAHAYA" : "AMAN"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {format(log.time, "HH:mm:ss", { locale: id })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {log.status === "tidak_aman" && (
                      <div className="mt-2 space-y-3 pt-3 border-t border-red-100 dark:border-red-800/30">
                        {log.notes && (
                          <div className="text-sm">
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                              Keterangan:
                            </span>
                            <p className="text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                              {log.notes}
                            </p>
                          </div>
                        )}
                        {log.imageData && (
                          <div>
                            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                              Foto Bukti:
                            </span>
                            <a
                              href={log.imageData}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 group relative"
                            >
                              <img
                                src={log.imageData}
                                alt="Bukti Keamanan"
                                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                  Lihat Full Size
                                </span>
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 justify-end border-t border-gray-100 dark:border-gray-800 pt-2">
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
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl transition-all shadow-sm hover:shadow"
              >
                Tutup
              </button>
            </div>
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
                  <option value="aman">Aman</option>
                  <option value="tidak_aman">Tidak Aman/Bahaya</option>
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
