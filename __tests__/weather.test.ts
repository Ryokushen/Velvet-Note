import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchCurrentWeather,
  getWeatherForCity,
  loadSavedCity,
  persistCity,
  searchCities,
  type SavedCity,
} from '../lib/weather';

const mockFetch = jest.fn();

const city: SavedCity = { name: 'Austin', region: 'Texas', latitude: 30.27, longitude: -97.74 };

function forecastResponse(tempC: number) {
  return {
    ok: true,
    json: async () => ({
      current: {
        temperature_2m: tempC,
        relative_humidity_2m: 55,
        precipitation: 0.4,
        is_day: 1,
      },
    }),
  };
}

describe('weather lib', () => {
  beforeEach(async () => {
    (global as any).fetch = mockFetch;
    mockFetch.mockReset();
    await AsyncStorage.clear();
  });

  it('searchCities maps geocoding results and skips empty queries', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { name: 'Austin', admin1: 'Texas', latitude: 30.27, longitude: -97.74 },
          { name: 'Nowhere' /* missing coordinates — dropped */ },
        ],
      }),
    });

    expect(await searchCities('   ')).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();

    const results = await searchCities('Austin');
    expect(results).toEqual([city]);
  });

  it('fetchCurrentWeather parses the current block and rejects bad payloads', async () => {
    mockFetch.mockResolvedValueOnce(forecastResponse(31.4));
    const snapshot = await fetchCurrentWeather(30.27, -97.74);
    expect(snapshot.tempC).toBe(31.4);
    expect(snapshot.humidity).toBe(55);
    expect(snapshot.precipitationMm).toBe(0.4);
    expect(snapshot.isDay).toBe(true);

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(fetchCurrentWeather(0, 0)).rejects.toThrow('missing temperature');
  });

  it('getWeatherForCity caches within the TTL and refetches for new coordinates', async () => {
    mockFetch.mockResolvedValue(forecastResponse(20));

    await getWeatherForCity(city);
    await getWeatherForCity(city);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await getWeatherForCity({ ...city, name: 'Elsewhere', latitude: 51.5, longitude: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('persistCity round-trips through storage and invalidates the weather cache', async () => {
    mockFetch.mockResolvedValue(forecastResponse(20));
    await getWeatherForCity(city);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await persistCity(city);
    expect(await loadSavedCity()).toEqual(city);

    await getWeatherForCity(city);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('loadSavedCity returns null for missing or malformed entries', async () => {
    expect(await loadSavedCity()).toBeNull();
    await AsyncStorage.setItem('velvet-note-weather-city', '{"name":"x"}');
    expect(await loadSavedCity()).toBeNull();
  });
});
