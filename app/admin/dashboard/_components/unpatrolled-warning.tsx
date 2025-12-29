"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Calendar, MapPin } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getUnpatrolledLocations } from "@/app/actions/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const today = new Date();
  const [selectedDateString, setSelectedDateString] = useState<string>(format(today, "yyyy-MM-dd"));
  const [shiftStatuses, setShiftStatuses] = useState<ShiftStatus[]>([]);
  const [isPending, startTransition] = useTransition();

  const [expandedShift, setExpandedShift] = useState<number | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getUnpatrolledLocations(selectedDateString);
      setShiftStatuses(result);

      // Default expand the first shift if none is expanded and results exist
      if (result.length > 0) {
        setExpandedShift(result[0].shift.id);
      }
    });
  }, [selectedDateString]);

  const toggleExpand = (id: number) => {
    // Toggle logic: click to expand, click again to collapse
    setExpandedShift(expandedShift === id ? null : id);
  };

  const selectedDate = new Date(selectedDateString);

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="flex flex-col gap-2 mb-4 shrink-0 px-1 pt-1">
        <label className="text-sm font-medium text-gray-500">Filter Tanggal</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDateString}
              onChange={(e) => setSelectedDateString(e.target.value)}
              className="pl-9 w-full sm:w-[150px] bg-white border-gray-200 focus:border-blue-500 transition-all font-medium h-9 text-sm"
            />
          </div>
          <div className="flex-1 flex items-center px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 h-9 truncate">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0 pb-2">
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : (
          shiftStatuses.map((status) => {
            const isExpanded = expandedShift === status.shift.id;

            return (
              <div
                key={status.shift.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden shrink-0"
              >
                <div
                  className={cn(
                    "p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors",
                    isExpanded && "bg-gray-50"
                  )}
                  onClick={() => toggleExpand(status.shift.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                      status.isFullyComplete ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{status.shift.name}</h4>
                      <p className="text-[10px] text-gray-500 font-medium bg-white border border-gray-200 px-1.5 py-0.5 rounded w-fit mt-0.5 whitespace-nowrap">
                        {status.shift.startTime} - {status.shift.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={cn(
                        "text-base font-bold",
                        status.isFullyComplete ? "text-green-600" : "text-orange-500"
                      )}>{status.completedRounds}</span>
                      <span className="text-xs text-gray-400 font-medium">/5</span>
                      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Selesai</p>
                    </div>
                    <div className="h-6 w-6 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Progress Bar Line */}
                <div className="h-1 w-full bg-gray-50">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      status.isFullyComplete ? "bg-green-500" : "bg-orange-500"
                    )}
                    style={{ width: `${(status.completedRounds / 5) * 100}%` }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50/40 p-3 border-t border-gray-100 animate-in slide-in-from-top-1">
                    <div className="space-y-2">
                      {status.rounds.map((round) => (
                        <div
                          key={round.roundNumber}
                          className="text-sm rounded-lg bg-white border border-gray-100 overflow-hidden shadow-sm"
                        >
                          <div className="flex items-center justify-between p-2 bg-gray-50/30 border-b border-gray-100/50">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                round.isComplete
                                  ? "bg-green-100 border-green-200 text-green-700"
                                  : "bg-white border-gray-200 text-gray-500"
                              )}>
                                {round.roundNumber}
                              </div>
                              <span className="font-medium text-xs text-gray-700">Putaran {round.roundNumber}</span>
                            </div>

                            {round.isComplete ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                <CheckCircle className="h-3 w-3" />
                                <span>Selesai</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-gray-400">
                                {round.patrolledCount}/{status.totalLocations} Titik
                              </span>
                            )}
                          </div>

                          {/* Detailed List of Unpatrolled Locations */}
                          {!round.isComplete && round.unpatrolledLocations.length > 0 && (
                            <div className="p-2 bg-white">
                              <div className="flex flex-col gap-1.5">
                                {round.unpatrolledLocations.map(loc => (
                                  <div key={loc.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0 pl-1">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                      <MapPin className="h-3 w-3 text-red-400" />
                                      <span className="font-medium">{loc.name}</span>
                                    </div>
                                    <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">Belum</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
