"use client";

import { Loader2, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { createLocation } from "@/app/actions/locations"; // We will fix the import if needed

// Dynamically import Map component to avoid SSR issues with Leaflet
const LocationMapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">
      Loading Map...
    </div>
  ),
});

export default function LocationForm() {
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({
    lat: -3.549532,
    lng: 114.730076,
  }); // Default Location

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage(null);

    // Add coordinates to formData
    formData.set("latitude", coordinates.lat.toString());
    formData.set("longitude", coordinates.lng.toString());

    const result = await createLocation(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Lokasi berhasil ditambahkan!" });
      // Reset logic could go here if using a controlled form or ref
    }

    setLoading(false);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
        >
          {message.text}
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Nama Gedung/Lokasi
        </label>
        <input
          type="text"
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Contoh: Gedung A"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="radius"
            className="block text-sm font-medium text-gray-700"
          >
            Radius (Meter)
          </label>
          <input
            type="number"
            name="radius"
            defaultValue={5}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="order"
            className="block text-sm font-medium text-gray-700"
          >
            Urutan Patroli
          </label>
          <input
            type="number"
            name="order"
            defaultValue={1}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="position"
          className="block text-sm font-medium text-gray-700"
        >
          Pilih Titik Lokasi
        </label>
        <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
          <LocationMapPicker
            position={coordinates}
            onPositionChange={setCoordinates}
          />
        </div>
        <p className="text-xs text-gray-500">
          Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Simpan Lokasi
      </button>
    </form>
  );
}
