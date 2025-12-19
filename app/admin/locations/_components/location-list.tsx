"use client";

import { MapPin, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { deleteLocation } from "@/app/actions/locations";
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

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  order: number;
}

export default function LocationList({
  initialLocations,
}: {
  initialLocations: Location[];
}) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = () => {
    if (deletingId) {
      startTransition(async () => {
        const res = await deleteLocation(deletingId);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Lokasi berhasil dihapus!");
        }
        setDeletingId(null);
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {initialLocations.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Belum ada lokasi yang ditambahkan.
          </p>
        ) : (
          initialLocations.map((loc) => (
            <div
              key={loc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 gap-4"
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="mt-1 rounded-full bg-blue-100 p-2 shrink-0">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {loc.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Urutan: {loc.order} | Radius: {loc.radius}m
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {loc.latitude}, {loc.longitude}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeletingId(loc.id)}
                disabled={isPending}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors self-end sm:self-center"
                title="Hapus Lokasi"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lokasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Lokasi ini akan dihapus
              permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isPending}
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
