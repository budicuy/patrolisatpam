"use client";

import { MapContainer, Marker, TileLayer, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import { Locate } from "lucide-react";

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

function LocationMarker({ position, onPositionChange }: any) {
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
  onUserLocationFound: (pos: L.LatLng) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      onUserLocationFound(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={userIcon} title="Lokasi Saya">
      <Popup>Lokasi Saya</Popup>
    </Marker>
  );
}

export default function MapPicker({
  position,
  onPositionChange,
}: {
  position: any;
  onPositionChange: (pos: any) => void;
}) {
  const [userPosition, setUserPosition] = useState<any>(null);

  return (
    <MapContainer
      center={position || userPosition || [-6.2088, 106.8456]} // Default Jakarta
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} onPositionChange={onPositionChange} />
      <UserLocationMarker onUserLocationFound={setUserPosition} />
      <MyLocationButton />
    </MapContainer>
  );
}

function MyLocationButton() {
  const map = useMap();
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current);
      L.DomEvent.disableScrollPropagation(divRef.current);
    }
  }, []);

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    map.locate({ setView: true });
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Overlay intentionally blocks map interactions
    // biome-ignore lint/a11y/noStaticElementInteractions: Overlay intentionally blocks map interactions
    <div
      ref={divRef}
      className="absolute top-4 right-4 z-999"
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
        className="flex items-center justify-center rounded-md bg-white p-2 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:hover:bg-gray-700"
        title="Lokasi Saya"
      >
        <Locate className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>
    </div>
  );
}
