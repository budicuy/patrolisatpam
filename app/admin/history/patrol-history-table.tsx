"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";

type PatrolLog = {
  id: string;
  checkInTime: Date;
  userId: string | null;
  userName: string | null;
  locationName: string | null;
  shiftName: string | null;
};

type Props = {
  history: PatrolLog[];
};

export function PatrolHistoryTable({ history }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<{
    userName: string;
    date: Date;
    checkInTimes: Date[];
  } | null>(null);

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
            checkInTimes: [] as Date[],
          };
        }

        if (log.locationName) acc[key].locations.add(log.locationName);
        if (log.shiftName) acc[key].shifts.add(log.shiftName);
        acc[key].checkInTimes.push(new Date(log.checkInTime));
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
          checkInTimes: Date[];
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
                        onClick={() =>
                          setSelectedGroup({
                            userName: group.userName,
                            date: group.date,
                            checkInTimes: group.checkInTimes,
                          })
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm underline decoration-blue-600/30 hover:decoration-blue-600 transition-all"
                      >
                        Lihat Detail ({group.checkInTimes.length} Check-in)
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
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detail Check-In
                </h3>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
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
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedGroup.userName} •{" "}
                {format(selectedGroup.date, "dd MMMM yyyy", { locale: id })}
              </div>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                {selectedGroup.checkInTimes
                  .sort((a, b) => b.getTime() - a.getTime())
                  .map((time, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300"
                    >
                      {format(time, "HH:mm:ss", { locale: id })}
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-md transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
