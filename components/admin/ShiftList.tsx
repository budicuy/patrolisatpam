"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteShift } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Using inline type since inferred schema types might need export
interface ShiftProps {
  id: number;
  name: string;
  startTime: string; // Time strings from DB
  endTime: string;
}

export default function ShiftList({ shifts }: { shifts: ShiftProps[] }) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus shift ini?")) return;
    setDeletingId(id);
    await deleteShift(id);
    setDeletingId(null);
    // In a real app we might want to revalidatePath or router.refresh()
    // But server actions usually handle revalidation if configured
    // For now we assume actions.ts handles it or we force reload
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Shift</CardTitle>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada shift.</p>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{shift.name}</p>
                  <p className="text-sm text-gray-500">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(shift.id)}
                  disabled={deletingId === shift.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
