"use client";

import { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getDistance } from "geolib";
import L from "leaflet";
import { checkInLocation, finishPatrolSession } from "@/app/actions";
import { Button } from "./ui/button";

// Leaflet Icon Fix
// We need to patch the default icon protocol for Next.js/Leaflet compatibility
const fixLeafletIcon = () => {
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
};
fixLeafletIcon();

// Custom Icon for User
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom Icon for Target
const targetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkedIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function UserTracker({
  setPosition,
}: {
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  useMapEvents({}); // Just to access map context if needed, but primarily to keep component alive

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setPosition]);

  return null;
}

interface PatrolLocation {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius: number;
}

interface PatrolLog {
  locationId: number;
}

interface PatrolSession {
  id: number;
  logs: PatrolLog[];
}

export default function PatrolMap({
  session,
  locations,
  onUpdate,
}: {
  session: PatrolSession;
  locations: PatrolLocation[];
  onUpdate: () => void;
}) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [checkingIn, setCheckingIn] = useState(false);

  // Find next target location (first one not in logs)
  const checkedLocationIds = session.logs.map((l) => l.locationId);
  const nextLocation = locations.find(
    (l) => !checkedLocationIds.includes(l.id),
  );
  const isFinished = !nextLocation && locations.length > 0;

  const handleCheckIn = async (locationId: number) => {
    setCheckingIn(true);
    await checkInLocation(session.id, locationId);
    setCheckingIn(false);
    onUpdate();
  };

  const handleFinish = async () => {
    await finishPatrolSession(session.id);
    onUpdate();
  };

  // Calculate distance to next target
  let distanceToTarget: number | null = null;
  let canCheckIn = false;

  if (userPos && nextLocation) {
    distanceToTarget = getDistance(
      { latitude: userPos.lat, longitude: userPos.lng },
      {
        latitude: parseFloat(nextLocation.latitude),
        longitude: parseFloat(nextLocation.longitude),
      },
    );
    // Check radius (default 5m or location specific)
    canCheckIn = distanceToTarget <= (nextLocation.radius || 5);
  }

  // Default center
  const center: [number, number] = userPos
    ? [userPos.lat, userPos.lng]
    : locations[0]
      ? [parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)]
      : [-6.2, 106.8]; // Default JKT

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="bg-white p-4 rounded-lg shadow border">
        {isFinished ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Patroli Selesai!
            </h3>
            <Button onClick={handleFinish} className="w-full bg-green-600">
              Selesaikan Sesi
            </Button>
          </div>
        ) : nextLocation ? (
          <div>
            <h3 className="font-bold">Target: {nextLocation.name}</h3>
            <p className="text-sm text-gray-600">
              Jarak:{" "}
              {distanceToTarget !== null
                ? `${distanceToTarget} meter`
                : "Menunggu Lokasi..."}
            </p>
            <div className="mt-2">
              {canCheckIn ? (
                <Button
                  onClick={() => handleCheckIn(nextLocation.id)}
                  disabled={checkingIn}
                  className="w-full bg-blue-600 animate-pulse"
                >
                  {checkingIn ? "Absen..." : "ABSEN SEKARANG"}
                </Button>
              ) : (
                <div className="p-2 bg-yellow-100 text-yellow-800 text-sm rounded text-center">
                  Anda belum berada di lokasi (Radius {nextLocation.radius}m)
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Tidak ada lokasi patroli.</p>
        )}
      </div>

      {/* MAP */}
      <MapContainer
        center={center}
        zoom={18}
        style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <UserTracker setPosition={setUserPos} />

        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>Posisi Anda</Popup>
            <Circle
              center={userPos}
              radius={10}
              pathOptions={{
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.1,
              }}
            />
          </Marker>
        )}

        {locations.map((loc) => {
          const isChecked = checkedLocationIds.includes(loc.id);
          const isNext = nextLocation?.id === loc.id;

          return (
            <Marker
              key={loc.id}
              position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
              icon={isChecked ? checkedIcon : targetIcon}
              opacity={isChecked ? 0.6 : 1}
            >
              <Popup>
                <b>{loc.name}</b>
                <br />
                Status: {isChecked ? "Sudah Absen" : "Belum Absen"}
              </Popup>
              <Circle
                center={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                radius={loc.radius || 5}
                pathOptions={{
                  color: isNext ? "red" : isChecked ? "green" : "gray",
                  fillColor: isNext ? "red" : isChecked ? "green" : "gray",
                  fillOpacity: 0.2,
                }}
              />
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
