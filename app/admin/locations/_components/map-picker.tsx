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
import { Loader2, Locate, Maximize, Minimize } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Simple coordinate interface for external use
interface LatLng {
  lat: number;
  lng: number;
}

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
  position: LatLng | null;
  onPositionChange: (pos: LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} title="Lokasi Terpilih">
      <Popup>Location Selected</Popup>
    </Marker>
  );
}

function UserLocationMarker({
  onUserLocationFound,
}: {
  onUserLocationFound: (pos: LatLng, accuracy: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      onUserLocationFound({ lat: e.latlng.lat, lng: e.latlng.lng }, e.accuracy);
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
  position: LatLng | null;
  onPositionChange: (pos: LatLng) => void;
}) {
  const [userPosition, setUserPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleUserLocationFound = (pos: LatLng, acc: number) => {
    setUserPosition(pos);
    setAccuracy(acc);
    onPositionChange(pos);
  };

  // Get center coordinates
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : userPosition
      ? [userPosition.lat, userPosition.lng]
      : [-3.549532, 114.730076]; // Default Location

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        minZoom={5}
        maxBounds={[
          [-12, 94], // Southwest corner
          [15, 142], // Northeast corner
        ]}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <LocationMarker
          position={position}
          onPositionChange={onPositionChange}
        />
        <UserLocationMarker onUserLocationFound={handleUserLocationFound} />
        <MyLocationButton />
        <FullscreenButton />
      </MapContainer>
      {accuracy && (
        <div className="absolute bottom-2 left-2 z-1000 bg-white/90 px-2 py-1 rounded text-xs text-gray-600 shadow">
          GPS Akurasi: ~{Math.round(accuracy)}m
        </div>
      )}
    </div>
  );
}

function FullscreenButton() {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current);
      L.DomEvent.disableScrollPropagation(divRef.current);
    }
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const container = map.getContainer();

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`,
          );
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen to fullscreen change events (e.g. user pressing ESC)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Force map to resize/invalidate size after transition
      setTimeout(() => map.invalidateSize(), 100);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [map]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Overlay intentionally blocks map interactions
    // biome-ignore lint/a11y/noStaticElementInteractions: Overlay intentionally blocks map interactions
    <div
      ref={divRef}
      className="absolute top-16 right-4 z-1000"
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
        onClick={toggleFullscreen}
        className="flex items-center justify-center rounded-md bg-white p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
      >
        {isFullscreen ? (
          <Minimize className="h-5 w-5 text-gray-700" />
        ) : (
          <Maximize className="h-5 w-5 text-gray-700" />
        )}
      </button>
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
        className="flex items-center justify-center rounded-md bg-white p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        title="Lokasi Saya (High Accuracy GPS)"
      >
        {isLocating ? (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        ) : (
          <Locate className="h-5 w-5 text-gray-700" />
        )}
      </button>
    </div>
  );
}
