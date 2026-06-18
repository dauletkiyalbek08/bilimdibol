// Геозона офиса для отметки посещаемости.
// Замени координаты на реальные (Google Maps → ПКМ → координаты),
// либо задай через env: NEXT_PUBLIC_OFFICE_LAT / NEXT_PUBLIC_OFFICE_LNG / NEXT_PUBLIC_OFFICE_RADIUS.

export const OFFICE = {
  lat: Number(process.env.NEXT_PUBLIC_OFFICE_LAT ?? 43.32329), // офис (тест)
  lng: Number(process.env.NEXT_PUBLIC_OFFICE_LNG ?? 77.016375),
  radiusM: Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS ?? 250), // радиус «в офисе», метры
};

/** Расстояние между двумя координатами в метрах (формула гаверсинуса). */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
