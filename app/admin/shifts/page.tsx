import { Clock, Plus, Trash2 } from "lucide-react";
import { createShift, deleteShift, getShifts } from "@/app/actions/shifts";

export default async function ShiftsPage() {
  const shifts = await getShifts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Kelola Shift Jaga</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold">Tambah Shift Baru</h2>
            <form action={createShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama Shift
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Contoh: Shift Pagi"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Simpan Shift
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold">Daftar Shift</h2>
            <div className="space-y-4">
              {shifts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Belum ada shift yang terdaftar.
                </p>
              ) : (
                shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {shift.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    </div>

                    <form action={deleteShift.bind(null, shift.id)}>
                      <button
                        type="submit"
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors dark:hover:bg-red-900/30"
                        title="Hapus Shift"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
