"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Calendar, MapPin, XCircle } from "lucide-react";
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

      // Auto-expand the first shift by default
      if (result.length > 0) {
        setExpandedShift(result[0].shift.id);
      }
    });
  }, [selectedDateString]);

  const toggleExpand = (id: number) => {
    setExpandedShift(expandedShift === id ? null : id);
  };

  const selectedDate = new Date(selectedDateString);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-500">Filter Tanggal</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={selectedDateString}
              onChange={(e) => setSelectedDateString(e.target.value)}
              className="pl-9 w-full sm:w-[180px] bg-white border-gray-200 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <div className="flex-1 flex items-center px-4 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm font-medium text-gray-600">
            {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm font-medium">Memuat data patroli...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shiftStatuses.map((status) => {
            const isExpanded = expandedShift === status.shift.id;

            return (
              <div
                key={status.shift.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(status.shift.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{status.shift.name}</h4>
                      <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                        {status.shift.startTime} - {status.shift.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-lg font-bold text-orange-500">{status.completedRounds}</span>
                      <span className="text-sm text-gray-400 font-medium">/5</span>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Putaran Selesai</p>
                    </div>
                    <div
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 transition-transform duration-200",
                        isExpanded && "transform rotate-180"
                      )}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Progress Bar Line */}
                <div className="h-1 w-full bg-gray-50">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${(status.completedRounds / 5) * 100}%` }}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50/50 p-6 border-t border-gray-100 animate-in slide-in-from-top-1">
                    <div className="space-y-6">
                      {status.rounds.map((round) => (
                        <div key={round.roundNumber} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold",
                                round.isComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                              )}>
                                {round.roundNumber}
                              </span>
                              <span className="font-bold text-gray-900">
                                Putaran {round.roundNumber}
                              </span>
                            </div>
                            {round.isComplete ? (
                              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                <CheckCircle className="h-3 w-3 mr-1" /> Selesai
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {round.patrolledCount}/{status.totalLocations} Selesai
                              </span>
                            )}
                          </div>

                          {/* Detailed List of Unpatrolled Locations */}
                          {!round.isComplete && round.unpatrolledLocations.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Belum Dipatroli:</p>
                              <div className="divide-y divide-gray-100 border border-gray-100 rounded-md bg-gray-50/50">
                                {round.unpatrolledLocations.map((loc, idx) => (
                                  <div key={loc.id} className="flex items-center gap-3 p-2 text-sm">
                                    <span className="text-gray-400 text-xs w-6 text-center">{idx + 1}</span>
                                    <div className="flex items-center text-gray-700 font-medium">
                                      <XCircle className="h-3 w-3 text-red-400 mr-2" />
                                      {loc.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : round.isComplete ? (
                            <div className="text-center py-2 text-sm text-gray-400 italic">
                              Semua lokasi telah dipatroli pada putaran ini.
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
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
