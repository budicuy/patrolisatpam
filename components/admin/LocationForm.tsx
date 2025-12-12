"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import {
  type ActionState as ActionStateType,
  createLocation,
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

// Dynamically import MapPicker with no SSR
const LocationMapPicker = dynamic(
  () => import("@/components/LocationMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        Loading Map...
      </div>
    ),
  },
);

const initialState: ActionStateType = {
  error: "",
  success: false,
};

export default function LocationForm() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Custom wrapper for createLocation to include lat/lng
  const handleCreate = async (prevState: any, formData: FormData) => {
    // Pass null as prevState to the server action since we wrap it
    // Actually, we should call the action correctly.
    // If we use useActionState, the action receives (state, payload).
    // Here we intercept.
    if (lat) formData.append("lat", lat.toString());
    if (lng) formData.append("lng", lng.toString());
    return await createLocation(prevState, formData);
  };

  const [state, formAction, pending] = useActionState(
    handleCreate,
    initialState,
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Lokasi Baru</CardTitle>
          <CardDescription>
            Klik pada peta untuk menentukan koordinat titik patroli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Gedung / Lokasi</Label>
              <Input
                id="name"
                name="name"
                placeholder="Contoh: Gedung A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input value={lat || ""} disabled placeholder="Pilih di peta" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input value={lng || ""} disabled placeholder="Pilih di peta" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius Toleransi (meter)</Label>
              <Input
                id="radius"
                name="radius"
                type="number"
                defaultValue="5"
                min="1"
                required
              />
            </div>

            {state?.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-green-500 text-sm">
                Lokasi berhasil ditambahkan!
              </p>
            )}

            <Button type="submit" className="w-full" disabled={!lat || pending}>
              {pending ? "Menyimpan..." : "Simpan Lokasi"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peta Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationMapPicker
            onLocationSelect={(l, lg) => {
              setLat(l);
              setLng(lg);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
