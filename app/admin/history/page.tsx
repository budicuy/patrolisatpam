import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getPatrolHistory } from "@/app/actions/history";

export default async function HistoryPage() {
  const history = await getPatrolHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Riwayat Patroli</h1>

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
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Belum ada data riwayat.
                  </td>
                </tr>
              ) : (
                history.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {log.user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {log.location.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {log.shift.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(
                        new Date(log.checkInTime),
                        "dd MMMM yyyy, HH:mm:ss",
                        { locale: id },
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
