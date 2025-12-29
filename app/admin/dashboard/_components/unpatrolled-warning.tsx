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

interface RoundStatus {
  roundNumber: number;
  patrolledCount: number;
  unpatrolledLocations: Location[];
  isComplete: boolean;
}

interface ShiftStatus {
  shift: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  };
  rounds: RoundStatus[];
  completedRounds: number;
  totalRounds: number;
  totalLocations: number;
  totalPatrolled: number;
  isFullyComplete: boolean;
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

  // Check if all shifts are fully complete
  const allComplete = shiftStatuses.every((s) => s.isFullyComplete);

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
            Semua shift sudah menyelesaikan {shiftStatuses[0]?.totalRounds || 5} putaran patroli! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shiftStatuses.map((status) => {
            const progressPercent = Math.round(
              (status.completedRounds / status.totalRounds) * 100
            );

            return (
              <div
                key={status.shift.id}
                className={`rounded-lg border ${status.isFullyComplete
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                  }`}
              >
                {/* Shift Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${status.isFullyComplete ? "border-green-200" : "border-amber-200"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${status.isFullyComplete ? "bg-green-100" : "bg-amber-100"
                        }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${status.isFullyComplete ? "text-green-600" : "text-amber-600"
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
                      className={`text-sm font-bold ${status.isFullyComplete ? "text-green-600" : "text-amber-600"
                        }`}
                    >
                      {status.completedRounds}/{status.totalRounds} Putaran
                    </p>
                    <p className="text-xs text-gray-500">{progressPercent}%</p>
                  </div>
                </div>

                {/* Round Progress */}
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    {status.rounds.map((round) => (
                      <div
                        key={round.roundNumber}
                        className={`flex-1 h-2 rounded-full ${round.isComplete ? "bg-green-500" : "bg-gray-200"
                          }`}
                        title={`Putaran ${round.roundNumber}: ${round.patrolledCount}/${status.totalLocations}`}
                      />
                    ))}
                  </div>

                  {status.isFullyComplete ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Semua putaran selesai ✓
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {status.rounds.map((round) => {
                        if (round.isComplete) return null;
                        return (
                          <div key={round.roundNumber} className="text-sm">
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="font-medium">
                                Putaran {round.roundNumber}: {round.patrolledCount}/{status.totalLocations} lokasi
                              </span>
                            </div>
                            {round.unpatrolledLocations.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-5">
                                {round.unpatrolledLocations.slice(0, 5).map((loc) => (
                                  <span
                                    key={loc.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-amber-100 text-xs"
                                  >
                                    <MapPin className="h-2 w-2 text-amber-500" />
                                    {loc.name}
                                  </span>
                                ))}
                                {round.unpatrolledLocations.length > 5 && (
                                  <span className="text-xs text-gray-500">
                                    +{round.unpatrolledLocations.length - 5} lainnya
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
