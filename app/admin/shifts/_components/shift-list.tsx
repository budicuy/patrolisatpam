"use client";

import { Clock, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { deleteShift } from "@/app/actions/shifts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface ShiftListProps {
  initialShifts: Shift[];
  currentUserRole?: string;
}

export function ShiftList({ initialShifts, currentUserRole }: ShiftListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isHR = currentUserRole === "hr";

  const handleDelete = () => {
    if (deletingId) {
      startTransition(async () => {
        const result = await deleteShift(deletingId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Shift berhasil dihapus");
        }
        setDeletingId(null);
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {initialShifts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Belum ada shift yang terdaftar.
          </p>
        ) : (
          initialShifts.map((shift) => (
            <div
              key={shift.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 gap-4"
            >
              <div className="flex items-center space-x-4 w-full">
                <div className="rounded-full bg-orange-100 p-2 shrink-0">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {shift.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
              </div>

              {!isHR && (
                <button
                  type="button"
                  onClick={() => setDeletingId(shift.id)}
                  disabled={isPending}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors self-end sm:self-center disabled:opacity-50"
                  title="Hapus Shift"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Shift ini dan semua riwayat
              patroli terkait akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
