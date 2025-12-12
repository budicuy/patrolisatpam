"use client";

import { MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteLocation } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationProps {
  id: number;
  name: string;
  latitude: string; // Decimal is string in JS/Drizzle likely
  longitude: string;
  radius: number;
}

export default function LocationList({
  locations,
}: {
  locations: LocationProps[];
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus lokasi ini?")) return;
    setDeletingId(id);
    await deleteLocation(id);
    setDeletingId(null);
    window.location.reload();
  };

  return (
    <Card className="mt-6 md:mt-0">
      <CardHeader>
        <CardTitle>Daftar Lokasi</CardTitle>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada lokasi.</p>
        ) : (
          <div className="space-y-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin size={16} /> {loc.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Lat: {parseFloat(loc.latitude).toFixed(4)}, Lng:{" "}
                    {parseFloat(loc.longitude).toFixed(4)}
                  </p>
                  <p className="text-xs text-blue-600">Radius: {loc.radius}m</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(loc.id)}
                  disabled={deletingId === loc.id}
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
