"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { getUnpatrolledLocations } from "@/app/actions/stats";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [shiftStatuses, setShiftStatuses] = useState<ShiftStatus[]>([]);
  const [isPending, startTransition] = useTransition();

  const [expandedShift, setExpandedShift] = useState<number | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getUnpatrolledLocations(selectedDate);
      setShiftStatuses(result);
    });
  }, [selectedDate]);

  const formattedDate = format(new Date(selectedDate), "EEEE, d MMMM yyyy", {
    locale: id,
  });

  const allComplete = shiftStatuses.every((s) => s.isFullyComplete);

  const toggleExpand = (id: number) => {
    setExpandedShift(expandedShift === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <Label htmlFor="warning-date" className="text-gray-500 font-medium mb-1.5 block">
            Filter Tanggal
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              id="warning-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-[180px] h-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all font-medium"
            />
            <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-md hidden sm:block">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm font-medium">Memuat data patroli...</p>
        </div>
      ) : allComplete ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-green-50/50 border border-green-100 text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-800 mb-1">Semua Aman! 🎉</h3>
          <p className="text-green-600">
            Semua shift sudah menyelesaikan {shiftStatuses[0]?.totalRounds || 5} putaran patroli pada tanggal ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {shiftStatuses.map((status) => {
            const progressPercent = Math.round(
              (status.completedRounds / status.totalRounds) * 100
            );
            const isExpanded = expandedShift === status.shift.id;

            return (
              <div
                key={status.shift.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl bg-white border transition-all duration-200",
                  status.isFullyComplete
                    ? "border-green-100 shadow-sm hover:shadow-md hover:border-green-200"
                    : "border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200"
                )}
              >
                {/* Status Bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    status.isFullyComplete ? "bg-green-500" : "bg-amber-500"
                  )}
                />

                <div className="p-5 pl-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "rounded-xl p-3 shrink-0",
                          status.isFullyComplete ? "bg-green-50" : "bg-amber-50"
                        )}
                      >
                        <Clock
                          className={cn(
                            "h-6 w-6",
                            status.isFullyComplete ? "text-green-600" : "text-amber-600"
                          )}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">
                          {status.shift.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {status.shift.startTime} - {status.shift.endTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className={cn(
                          "text-2xl font-bold font-sans",
                          status.isFullyComplete ? "text-green-600" : "text-amber-600"
                        )}>
                          {status.completedRounds}<span className="text-sm font-medium text-gray-400">/{status.totalRounds}</span>
                        </p>
                        <p className="text-xs font-medium text-gray-400">Putaran Selesai</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(status.shift.id)}
                        className={cn(
                          "bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg h-10 w-10 p-0",
                          isExpanded && "bg-gray-100"
                        )}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        status.isFullyComplete ? "bg-green-500" : "bg-amber-500"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 pl-7 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {status.rounds.map((round) => (
                        <div
                          key={round.roundNumber}
                          className={cn(
                            "relative overflow-hidden rounded-lg border bg-white p-3 transition-all",
                            round.isComplete
                              ? "border-green-100 bg-green-50/10"
                              : "border-amber-100 bg-amber-50/10"
                          )}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className={cn(
                              "text-sm font-bold px-2 py-0.5 rounded-md",
                              round.isComplete
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            )}>
                              Putaran {round.roundNumber}
                            </span>
                            {round.isComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>

                          {round.isComplete ? (
                            <p className="text-xs font-medium text-gray-500">Semua {status.totalLocations} titik selesai.</p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-500">
                                {round.patrolledCount}/{status.totalLocations} titik dipatroli
                              </p>
                              {round.unpatrolledLocations.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {round.unpatrolledLocations.slice(0, 3).map(loc => (
                                    <span key={loc.id} className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-600">
                                      <MapPin className="h-2 w-2 mr-1 text-gray-400" />
                                      {loc.name}
                                    </span>
                                  ))}
                                  {round.unpatrolledLocations.length > 3 && (
                                    <span className="text-[10px] text-gray-400 font-medium py-0.5">
                                      +{round.unpatrolledLocations.length - 3} lainnya
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
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
