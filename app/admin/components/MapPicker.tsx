"use client";

import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useState } from "react";
import { Loader2, Locate } from "lucide-react";

interface MapPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({
  onLocationSelect,
  position,
}: {
  onLocationSelect: any;
  position: [number, number];
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

// Component to handle map view updates when position changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPicker({
  initialLat,
  initialLng,
  onLocationSelect,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLat,
    initialLng,
  ]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const handleCurrentLocation = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoadingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleSelect(latitude, longitude);
        setLoadingLoc(false);
      },
      (err) => {
        alert("Gagal mengambil lokasi: " + err.message);
        setLoadingLoc(false);
      }
    );
  };

  return (
    <div className="relative h-96 w-full rounded-lg border overflow-hidden">
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={loadingLoc}
          className="flex items-center justify-center rounded-lg bg-white p-2 text-gray-700 shadow-md hover:bg-gray-100 disabled:opacity-70 dark:bg-gray-800 dark:text-gray-200"
          title="Gunakan Lokasi Saya"
        >
          {loadingLoc ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Locate className="h-5 w-5" />
          )}
        </button>
      </div>

      <MapContainer
        center={position}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeView center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={handleSelect} position={position} />
      </MapContainer>
    </div>
  );
}
