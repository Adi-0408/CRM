/**
 * Geo-Fencing & Office Perimeter Verification Engine
 *
 * Configured Office:
 * Pearl Enclave, MSEB Rd, near Walchand college, Viya Nagar, Vishrambag, Sangli Miraj Kupwad, Maharashtra 416415
 * Radius: 100 meters
 */

export interface OfficeLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
}

export const ITPL_OFFICE_LOCATION: OfficeLocation = {
  name: 'ITPL Head Office (Pearl Enclave)',
  address:
    'Pearl Enclave, MSEB Rd, near Walchand college, Viya Nagar, Vishrambag, Sangli Miraj Kupwad, Maharashtra 416415',
  latitude: 16.84582,
  longitude: 74.60055,
  allowedRadiusMeters: 100, // 100m passable perimeter
};

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula
 * @returns distance in meters (rounded to nearest integer)
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's mean radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeofenceResult {
  isWithinPerimeter: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  officeAddress: string;
  userLat: number;
  userLng: number;
}

export function evaluateGeofence(
  userLat: number,
  userLng: number,
  office: OfficeLocation = ITPL_OFFICE_LOCATION
): GeofenceResult {
  const distanceMeters = calculateDistanceInMeters(
    userLat,
    userLng,
    office.latitude,
    office.longitude
  );

  return {
    isWithinPerimeter: distanceMeters <= office.allowedRadiusMeters,
    distanceMeters,
    allowedRadiusMeters: office.allowedRadiusMeters,
    officeAddress: office.address,
    userLat,
    userLng,
  };
}
