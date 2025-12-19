"use client";

import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize, Minimize } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

// Fix icons
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

const visitedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMapEvents({
    // Optional: Keep map centered on user?
  });

  const hasCentered = useRef(false);

  useEffect(() => {
    if (center && !hasCentered.current) {
      map.flyTo(center, 16);
      hasCentered.current = true;
    }
  }, [center, map]);

  return null;
}

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  order: number;
}

interface PatrolMapProps {
  currentPosition: { lat: number; lng: number } | null;
  targetLocation: Location | null;
  locations: Location[];
  visitedLocations: number[];
}

export default function PatrolMap({
  currentPosition,
  targetLocation,
  locations,
  visitedLocations,
}: PatrolMapProps) {
  // Sort locations to draw path
  const sortedLocations = [...locations].sort((a, b) => a.order - b.order);
  const pathPositions = sortedLocations.map((l) => [l.latitude, l.longitude]);

  return (
    <MapContainer
      center={currentPosition || { lat: -3.549532, lng: 114.730076 }}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Route Path */}
      <Polyline
        positions={pathPositions as [number, number][]}
        color="blue"
        dashArray="5, 10"
      />

      {/* Current Position */}
      {currentPosition && (
        <>
          <Marker position={currentPosition} icon={userIcon}>
            <Popup>Posisi Anda</Popup>
          </Marker>
          <MapController center={currentPosition} />
        </>
      )}

      {/* Locations */}
      {sortedLocations.map((loc) => {
        const isVisited = visitedLocations.includes(loc.id);
        const isTarget = targetLocation?.id === loc.id;

        let icon = new L.Icon.Default();
        let circleColor = "gray";

        if (isVisited) {
          icon = visitedIcon;
          circleColor = "green";
        } else if (isTarget) {
          icon = targetIcon;
          circleColor = "red";
        }

        return (
          <Fragment key={loc.id}>
            <Marker position={[loc.latitude, loc.longitude]} icon={icon}>
              <Popup>
                <b>{loc.name}</b>
                <br />
                Urutan: {loc.order}
                <br />
                Radius: {loc.radius || 5}m
                <br />
                Status: {isVisited ? "Sudah Diperiksa" : "Belum Diperiksa"}
              </Popup>
            </Marker>
            <Circle
              center={[loc.latitude, loc.longitude]}
              radius={loc.radius || 5}
              pathOptions={{
                color: circleColor,
                fillColor: circleColor,
                fillOpacity: 0.3,
                weight: 3,
              }}
            />
          </Fragment>
        );
      })}

      <FullscreenButton />
    </MapContainer>
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

  // Listen to fullscreen change events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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
      className="absolute top-20 left-4 z-1000"
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
