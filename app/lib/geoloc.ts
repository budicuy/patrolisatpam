import { getDistance } from "geolib";

export const calculateDistance = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  return getDistance(from, to);
};

export const isWithinRadius = (
  current: { latitude: number; longitude: number },
  target: { latitude: number; longitude: number },
  radius: number,
) => {
  const distance = calculateDistance(current, target);
  return distance <= radius;
};
