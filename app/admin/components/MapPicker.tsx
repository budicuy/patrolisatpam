"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useState } from "react";

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

export default function MapPicker({
  initialLat,
  initialLng,
  onLocationSelect,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLat,
    initialLng,
  ]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="h-96 w-full rounded-lg border overflow-hidden">
      <MapContainer
        center={position}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={handleSelect} position={position} />
      </MapContainer>
    </div>
  );
}
