"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Locate, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Fix Leaflet marker icon issue in Next.js
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

function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, map, zoom]);
  return null;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function LocationMapPicker({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (position) {
      onLocationSelect(position.lat, position.lng);
    }
  }, [position, onLocationSelect]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setPosition(newPos);
        setMapCenter([newPos.lat, newPos.lng]);
      } else {
        alert("Lokasi tidak ditemukan");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Gagal mencari lokasi");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newPos = { lat: latitude, lng: longitude };
          setPosition(newPos);
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Gagal mendapatkan lokasi saat ini. Pastikan GPS aktif.");
        },
      );
    } else {
      alert("Geolocation tidak didukung di browser ini.");
    }
  };

  // Default center (Jakarta)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];

  return (
    <div className="relative h-[400px] w-full rounded-lg overflow-hidden border">
      {/* Controls Overlay */}
      <div className="absolute top-2 left-2 right-2 z-1000 flex gap-2">
        <form
          onSubmit={handleSearch}
          className="flex-1 flex gap-2 bg-white/90 p-2 rounded-md shadow-sm backdrop-blur-sm"
        >
          <Input
            placeholder="Cari lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white h-9"
          />
          <Button type="submit" size="sm" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>
        <Button
          variant="secondary"
          size="icon"
          className="h-[52px] w-[52px] bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white"
          onClick={handleLocateMe}
          title="Lokasi Saya"
        >
          <Locate className="h-5 w-5 text-blue-600" />
        </Button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} />
        <LocationMarker
          position={position}
          setPosition={(pos) => {
            setPosition(pos);
            // Don't auto-center on click to keep UX smooth, only on search/locate
          }}
        />
      </MapContainer>
    </div>
  );
}
