import { useCallback, useEffect, useState } from 'react';
import {
  getWeatherForCity,
  loadSavedCity,
  persistCity,
  type SavedCity,
  type WeatherSnapshot,
} from '../lib/weather';

/**
 * Saved home city plus a cached current-conditions snapshot. Weather is a
 * refinement: every failure path resolves to a null snapshot so callers can
 * behave exactly as if the feature were absent.
 */
export function useWeather() {
  const [city, setCity] = useState<SavedCity | null>(null);
  const [cityLoaded, setCityLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    loadSavedCity()
      .then((saved) => {
        if (mounted) {
          setCity(saved);
          setCityLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) setCityLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const latitude = city?.latitude;
  const longitude = city?.longitude;

  useEffect(() => {
    if (!city || latitude == null || longitude == null) {
      setSnapshot(null);
      return undefined;
    }
    let mounted = true;
    getWeatherForCity(city)
      .then((next) => {
        if (mounted) setSnapshot(next);
      })
      .catch(() => {
        if (mounted) setSnapshot(null);
      });
    return () => {
      mounted = false;
    };
    // The coordinates are the identity of a saved city.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const selectCity = useCallback((next: SavedCity) => {
    setCity(next);
    setSnapshot(null);
    persistCity(next).catch(() => undefined);
  }, []);

  return { city, cityLoaded, snapshot, selectCity };
}
