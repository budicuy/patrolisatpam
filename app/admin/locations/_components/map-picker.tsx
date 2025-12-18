"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Locate } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const userIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div class="relative flex h-6 w-6 items-center justify-center">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-lg"></span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function LocationMarker({
  position,
  onPositionChange,
}: {
  position: L.LatLng | null;
  onPositionChange: (pos: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} title="Lokasi Terpilih">
      <Popup>Location Selected</Popup>
    </Marker>
  );
}

function UserLocationMarker({
  onUserLocationFound,
}: {
  onUserLocationFound: (pos: L.LatLng, accuracy: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      onUserLocationFound(e.latlng, e.accuracy);
      // Zoom level 18 for better accuracy view
      map.flyTo(e.latlng, 18);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={userIcon} title="Lokasi Saya">
      <Popup>
        Lokasi Saya
        {accuracy && (
          <span className="block text-xs text-gray-500">
            Akurasi: ~{Math.round(accuracy)}m
          </span>
        )}
      </Popup>
    </Marker>
  );
}

export default function MapPicker({
  position,
  onPositionChange,
}: {
  position: L.LatLng | null;
  onPositionChange: (pos: L.LatLng) => void;
}) {
  const [userPosition, setUserPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleUserLocationFound = (pos: L.LatLng, acc: number) => {
    setUserPosition(pos);
    setAccuracy(acc);
    onPositionChange(pos);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={position || userPosition || [-3.549538, 114.730745]} // Default to Kantor Utama
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          onPositionChange={onPositionChange}
        />
        <UserLocationMarker onUserLocationFound={handleUserLocationFound} />
        <MyLocationButton />
      </MapContainer>
      {accuracy && (
        <div className="absolute bottom-2 left-2 z-1000 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 shadow">
          GPS Akurasi: ~{Math.round(accuracy)}m
        </div>
      )}
    </div>
  );
}

function MyLocationButton() {
  const map = useMap();
  const divRef = useRef<HTMLDivElement>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current);
      L.DomEvent.disableScrollPropagation(divRef.current);
    }

    // Listen for location events
    const onLocationFound = () => setIsLocating(false);
    const onLocationError = () => {
      setIsLocating(false);
      alert(
        "Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.",
      );
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map]);

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsLocating(true);

    // Use high accuracy GPS settings
    map.locate({
      setView: true,
      maxZoom: 18,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Overlay intentionally blocks map interactions
    // biome-ignore lint/a11y/noStaticElementInteractions: Overlay intentionally blocks map interactions
    <div
      ref={divRef}
      className="absolute top-4 right-4 z-1000"
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
    >
      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        className="flex items-center justify-center rounded-md bg-white p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50"
        title="Lokasi Saya (High Accuracy GPS)"
      >
        {isLocating ? (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        ) : (
          <Locate className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        )}
      </button>
    </div>
  );
}
