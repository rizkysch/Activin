import { Weather } from "../types/weather";

const MALANG_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-7.9666&longitude=112.6326&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FJakarta";

interface OpenMeteoCurrentResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
}

function isWeatherResponse(value: unknown): value is OpenMeteoCurrentResponse {
  if (typeof value !== "object" || value === null || !("current" in value)) {
    return false;
  }

  const current = value.current;
  if (typeof current !== "object" || current === null) {
    return false;
  }

  return (
    "temperature_2m" in current &&
    typeof current.temperature_2m === "number" &&
    "relative_humidity_2m" in current &&
    typeof current.relative_humidity_2m === "number" &&
    "apparent_temperature" in current &&
    typeof current.apparent_temperature === "number" &&
    "weather_code" in current &&
    typeof current.weather_code === "number" &&
    "wind_speed_10m" in current &&
    typeof current.wind_speed_10m === "number" &&
    "time" in current &&
    typeof current.time === "string"
  );
}

function describeWeatherCode(code: number): string {
  if (code === 0) return "Cerah";
  if ([1, 2, 3].includes(code)) return "Berawan";
  if ([45, 48].includes(code)) return "Berkabut";
  if ([51, 53, 55, 56, 57].includes(code)) return "Gerimis";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Hujan";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Salju";
  if ([95, 96, 99].includes(code)) return "Hujan badai";
  return "Kondisi tidak diketahui";
}

export async function fetchMalangWeather(): Promise<Weather> {
  // Pre-built Async Function: fetch() requests current weather data from Open-Meteo.
  const response = await fetch(MALANG_WEATHER_URL);
  if (!response.ok) {
    throw new Error(`Gagal mengambil cuaca Malang (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isWeatherResponse(data)) {
    throw new Error("Format data cuaca dari Open-Meteo tidak sesuai.");
  }

  const current = data.current;

  // Nilai current dari JSON Open-Meteo dipetakan ke object bertipe Weather.
  return {
    location: "Malang",
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    description: describeWeatherCode(current.weather_code),
    observedAt: current.time,
  };
}
