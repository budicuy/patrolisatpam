"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Next.js
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, onPositionChange }: any) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function MapPicker({
  position,
  onPositionChange,
}: {
  position: any;
  onPositionChange: (pos: any) => void;
}) {
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} onPositionChange={onPositionChange} />
      <MyLocationButton onPositionChange={onPositionChange} />
    </MapContainer>
  );
}

import { Locate } from "lucide-react";
import { useMap } from "react-leaflet";

function MyLocationButton({ onPositionChange }: { onPositionChange: (pos: any) => void }) {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", function (e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  };

  return (
    <div className="absolute top-4 right-4 z-[999]">
      <button
        type="button"
        onClick={handleLocate}
        className="flex items-center justify-center rounded-md bg-white p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:hover:bg-gray-700"
        title="Lokasi Saya"
      >
        <Locate className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>
    </div>
  );
}
