"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getUnpatrolledLocations } from "@/app/actions/stats";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Location {
  id: number;
  name: string;
  order: number;
}

interface ShiftStatus {
  shift: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  };
  unpatrolledLocations: Location[];
  totalLocations: number;
  patrolledCount: number;
}

export function UnpatrolledWarning() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [shiftStatuses, setShiftStatuses] = useState<ShiftStatus[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getUnpatrolledLocations(selectedDate);
      setShiftStatuses(result);
    });
  }, [selectedDate]);

  const formattedDate = format(new Date(selectedDate), "EEEE, d MMMM yyyy", {
    locale: id,
  });

  // Check if all shifts have all locations patrolled
  const allComplete = shiftStatuses.every(
    (s) => s.unpatrolledLocations.length === 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-full sm:w-auto">
          <Label htmlFor="warning-date" className="mb-2 block text-sm">
            Pilih Tanggal
          </Label>
          <Input
            type="date"
            id="warning-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-[200px]"
          />
        </div>
        <p className="text-sm text-gray-500">{formattedDate}</p>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : allComplete ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-green-700 font-medium">
            Semua lokasi sudah dipatroli pada semua shift di tanggal ini! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shiftStatuses.map((status) => {
            const isComplete = status.unpatrolledLocations.length === 0;
            const progress = Math.round(
              (status.patrolledCount / status.totalLocations) * 100,
            );

            return (
              <div
                key={status.shift.id}
                className={`rounded-lg border ${
                  isComplete
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                {/* Shift Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    isComplete ? "border-green-200" : "border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        isComplete ? "bg-green-100" : "bg-amber-100"
                      }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${
                          isComplete ? "text-green-600" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {status.shift.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {status.shift.startTime} - {status.shift.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isComplete ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {status.patrolledCount}/{status.totalLocations}
                    </p>
                    <p className="text-xs text-gray-500">{progress}%</p>
                  </div>
                </div>

                {/* Unpatrolled Locations */}
                {!isComplete && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {status.unpatrolledLocations.length} lokasi belum
                        dipatroli:
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {status.unpatrolledLocations.map((loc) => (
                        <div
                          key={loc.id}
                          className="flex items-center gap-2 p-2 rounded bg-white border border-amber-100"
                        >
                          <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {loc.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div className="p-4 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Semua lokasi sudah dipatroli ✓
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
