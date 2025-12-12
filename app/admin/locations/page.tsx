"use client";

import { Edit, MapPin, Plus, Trash } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MapPicker = dynamic(() => import("../components/MapPicker"), {
  ssr: false,
});

interface Location {
  id: string;
  namaLokasi: string;
  latitude: number;
  longitude: number;
  radius: number;
  urutan: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({
    latitude: -6.2,
    longitude: 106.816666,
    radius: 5,
    urutan: 1,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const res = await fetch("/api/locations");
    const data = await res.json();
    setLocations(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/locations/${formData.id}` : "/api/locations";
    const method = isEditing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setIsModalOpen(false);
    fetchLocations();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await fetch(`/api/locations/${id}`, { method: "DELETE" });
      fetchLocations();
    }
  };

  const resetForm = () => {
    setFormData({
      latitude: -6.2,
      longitude: 106.816666,
      radius: 5,
      urutan: locations.length + 1,
    });
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setFormData(loc);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Data Lokasi Patroli
        </h1>
        <button
          onClick={openAddModal}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Tambah Lokasi
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Urutan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Nama Lokasi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Koordinat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Radius
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {locations.map((loc) => (
              <tr key={loc.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {loc.urutan}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {loc.namaLokasi}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {loc.radius}m
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(loc)}
                    className="mr-2 text-blue-600 hover:text-blue-900 dark:text-blue-400"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">
              {isEditing ? "Edit Lokasi" : "Tambah Lokasi"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    urutan
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.urutan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        urutan: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Radius (meter)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.radius}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radius: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLokasi || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, namaLokasi: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Lokasi di Peta
                </label>
                <MapPicker
                  initialLat={formData.latitude || -6.2}
                  initialLng={formData.longitude || 106.816666}
                  onLocationSelect={(lat, lng) =>
                    setFormData({ ...formData, latitude: lat, longitude: lng })
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lat: {formData.latitude?.toFixed(6)}, Lng:{" "}
                  {formData.longitude?.toFixed(6)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
