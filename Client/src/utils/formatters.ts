/**
 * Formatting utilities for maritime intelligence metrics, coordinates, and times.
 */

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);

  const latDeg = Math.floor(absLat);
  const latMin = ((absLat - latDeg) * 60).toFixed(2);

  const lonDeg = Math.floor(absLon);
  const lonMin = ((absLon - lonDeg) * 60).toFixed(2);

  return `${latDeg}°${latMin}'${latDir}, ${lonDeg}°${lonMin}'${lonDir}`;
}

export function formatDecimalCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

export function formatAreaKm2(areaKm2: number): string {
  if (areaKm2 < 0.1) {
    return `${(areaKm2 * 100).toFixed(1)} ha`;
  }
  return `${areaKm2.toFixed(2)} km²`;
}

export function formatSpeedKnots(speedKnots: number): string {
  return `${speedKnots.toFixed(1)} kts`;
}

export function formatDistanceKm(distKm: number): string {
  const nm = (distKm * 0.539957).toFixed(1);
  return `${distKm.toFixed(1)} km (${nm} NM)`;
}

export function formatPercentage(val: number): string {
  const pct = val > 1 ? val : val * 100;
  return `${pct.toFixed(1)}%`;
}

export function formatUtcTime(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}
