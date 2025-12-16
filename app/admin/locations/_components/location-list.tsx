"use client";

import { MapPin, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteLocation } from "@/app/actions/locations";

export default function LocationList({
  initialLocations,
}: {
  initialLocations: any[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {initialLocations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          Belum ada lokasi yang ditambahkan.
        </p>
      ) : (
        initialLocations.map((loc) => (
          <div
            key={loc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50 gap-4"
          >
            <div clas sName="flex items-start space-x-3 w-full">
              <div className="mt-1 rounded-full bg-blue-100 p-2 dark:bg-blue-900/30 shrink-0">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {loc.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Urutan: {loc.order} | Radius: {loc.radius}m
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {loc.latitude}, {loc.longitude}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTransition(() => deleteLocation(loc.id))}
              disabled={isPending}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors dark:hover:bg-red-900/30 self-end sm:self-center"
              title="Hapus Lokasi"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
