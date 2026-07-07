import AsyncStorage from '@react-native-async-storage/async-storage';

// Open-Meteo: free, keyless, plain JSON. https://open-meteo.com/
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

const CITY_STORAGE_KEY = 'velvet-note-weather-city';
const CACHE_STORAGE_KEY = 'velvet-note-weather-cache';

export const WEATHER_CACHE_TTL_MS = 60 * 60 * 1000;

export type SavedCity = {
  name: string;
  region: string | null;
  latitude: number;
  longitude: number;
};

export type WeatherSnapshot = {
  tempC: number;
  humidity: number;
  precipitationMm: number;
  isDay: boolean;
  fetchedAt: number;
};

type WeatherCache = {
  latitude: number;
  longitude: number;
  snapshot: WeatherSnapshot;
};

export async function searchCities(query: string, limit = 5): Promise<SavedCity[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const url = `${GEOCODING_BASE}?name=${encodeURIComponent(trimmed)}&count=${limit}&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`City search failed (${response.status})`);
  }
  const data = await response.json();
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((row) => Number.isFinite(row?.latitude) && Number.isFinite(row?.longitude) && row?.name)
    .map((row) => ({
      name: String(row.name),
      region: row.admin1 ? String(row.admin1) : row.country ? String(row.country) : null,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    }));
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot> {
  const url =
    `${FORECAST_BASE}?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,is_day';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather fetch failed (${response.status})`);
  }
  const data = await response.json();
  const current = data?.current ?? {};
  const tempC = Number(current.temperature_2m);
  if (!Number.isFinite(tempC)) {
    throw new Error('Weather response missing temperature');
  }
  return {
    tempC,
    humidity: Number.isFinite(Number(current.relative_humidity_2m))
      ? Number(current.relative_humidity_2m)
      : 0,
    precipitationMm: Number.isFinite(Number(current.precipitation))
      ? Number(current.precipitation)
      : 0,
    isDay: current.is_day === 1,
    fetchedAt: Date.now(),
  };
}

export async function loadSavedCity(): Promise<SavedCity | null> {
  try {
    const raw = await AsyncStorage.getItem(CITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.name || !Number.isFinite(parsed?.latitude) || !Number.isFinite(parsed?.longitude)) {
      return null;
    }
    return parsed as SavedCity;
  } catch {
    return null;
  }
}

export async function persistCity(city: SavedCity): Promise<void> {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city));
  await AsyncStorage.removeItem(CACHE_STORAGE_KEY).catch(() => undefined);
}

export async function getWeatherForCity(city: SavedCity): Promise<WeatherSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const cache = JSON.parse(raw) as WeatherCache;
      const fresh =
        cache?.latitude === city.latitude &&
        cache?.longitude === city.longitude &&
        Number.isFinite(cache?.snapshot?.fetchedAt) &&
        Date.now() - cache.snapshot.fetchedAt < WEATHER_CACHE_TTL_MS;
      if (fresh) {
        return cache.snapshot;
      }
    }
  } catch {
    // Fall through to a live fetch on any cache problem.
  }

  const snapshot = await fetchCurrentWeather(city.latitude, city.longitude);
  await AsyncStorage.setItem(
    CACHE_STORAGE_KEY,
    JSON.stringify({ latitude: city.latitude, longitude: city.longitude, snapshot }),
  ).catch(() => undefined);
  return snapshot;
}
