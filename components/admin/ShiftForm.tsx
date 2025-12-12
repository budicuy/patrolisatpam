"use client";

import { useActionState } from "react";
import {
  type ActionState as ActionStateType,
  createShift,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionStateType = {
  error: "",
  success: false,
};

export default function ShiftForm() {
  const [state, formAction, pending] = useActionState(
    createShift,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah Shift Baru</CardTitle>
        <CardDescription>Tentukan jam mulai dan selesai jaga.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Shift</Label>
            <Input
              id="name"
              name="name"
              placeholder="Contoh: Shift Pagi"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Jam Mulai</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Jam Selesai</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-green-500 text-sm">
              Shift berhasil ditambahkan!
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Shift"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
