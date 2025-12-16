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
import { useEffect, useRef } from "react";

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

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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

export default function PatrolMap({
  currentPosition,
  targetLocation,
  locations,
  visitedLocations,
}: any) {
  // Sort locations to draw path
  const sortedLocations = [...locations].sort((a, b) => a.order - b.order);
  const pathPositions = sortedLocations.map((l) => [l.latitude, l.longitude]);

  return (
    <MapContainer
      center={currentPosition || { lat: -6.2, lng: 106.8 }}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

          {/* Only Center Once or manually! Removing auto-MapController for now 
              or we could make it smarter. For now, let's trust the user to pan.
              If we really want to center, we can add a button on the UI.
          */}
          <MapController center={currentPosition} />
        </>
      )}

      {/* Locations */}
      {sortedLocations.map((loc) => {
        const isVisited = visitedLocations.includes(loc.id);
        const isTarget = targetLocation?.id === loc.id;

        let icon = new L.Icon.Default();
        if (isVisited) icon = visitedIcon;
        else if (isTarget) icon = targetIcon;

        return (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={icon}
          >
            <Popup>
              <b>{loc.name}</b>
              <br />
              Urutan: {loc.order}
              <br />
              Status: {isVisited ? "Sudah Diperiksa" : "Belum Diperiksa"}
            </Popup>
            {isTarget && (
              <Circle
                center={[loc.latitude, loc.longitude]}
                radius={loc.radius || 5}
                pathOptions={{
                  color: "red",
                  fillColor: "red",
                  fillOpacity: 0.2,
                }}
              />
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
