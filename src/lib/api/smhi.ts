import {
  WeatherData,
  WeatherForecast,
  WeatherWarning,
  SMHIResponse,
  SMHIWarningsResponse,
} from "../../types/weather";
import { cache, CACHE_DURATIONS } from "../utils/cache";
import { getRefreshInterval, getShortDayName } from "../utils/timeUtils";

// Norrköping koordinater
const LAT = 58.5942;
const LON = 16.1826;

const SMHI_FORECAST_URL = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${LON}/lat/${LAT}/data.json`;
const SMHI_WARNINGS_URL =
  "https://opendata-download-warnings.smhi.se/api/version/2/alerts.json";

// Väder symboler till beskrivningar
const WEATHER_SYMBOLS: Record<number, string> = {
  1: "Klart",
  2: "Mestadels klart",
  3: "Växlande molnighet",
  4: "Halvklart",
  5: "Molnigt",
  6: "Mulet",
  7: "Dimma",
  8: "Lätt regnskur",
  9: "Måttlig regnskur",
  10: "Kraftig regnskur",
  11: "Åska",
  12: "Lätt snöblandat regn",
  13: "Måttligt snöblandat regn",
  14: "Kraftigt snöblandat regn",
  15: "Lätt snöfall",
  16: "Måttligt snöfall",
  17: "Kraftigt snöfall",
  18: "Regn",
  19: "Regn",
  20: "Regn",
  21: "Åska",
  22: "Snöblandat regn",
  23: "Snöblandat regn",
  24: "Snöblandat regn",
  25: "Snöfall",
  26: "Snöfall",
  27: "Snöfall",
};

function getWeatherDescription(symbol: number): string {
  return WEATHER_SYMBOLS[symbol] || "Okänt väder";
}

function parseWeatherData(data: SMHIResponse): WeatherData {
  const currentData = data.timeSeries[0];

  // Extrahera aktuell väderdata
  const getParameter = (name: string) => {
    const param = currentData.parameters.find((p) => p.name === name);
    return param ? param.values[0] : 0;
  };

  const current = {
    temperature: Math.round(getParameter("t")),
    humidity: Math.round(getParameter("r")),
    windSpeed: Math.round(getParameter("ws") * 3.6), // m/s till km/h
    windDirection: Math.round(getParameter("wd")),
    visibility: Math.round(getParameter("vis")), // Sikt i km
    weatherSymbol: Math.round(getParameter("Wsymb2")),
    description: getWeatherDescription(Math.round(getParameter("Wsymb2"))),
  };

  // Skapa 7-dagars prognos
  const forecast: WeatherForecast[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyData = new Map<string, any>();

  // Gruppera data per dag
  data.timeSeries.forEach((entry) => {
    const date = new Date(entry.validTime);
    const dateKey = date.toDateString();

    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        date: date.toISOString().split("T")[0],
        dayName: getShortDayName(date),
        temps: [],
        symbols: [],
      });
    }

    const dayData = dailyData.get(dateKey);
    const temp = entry.parameters.find((p) => p.name === "t")?.values[0];
    const symbol = entry.parameters.find((p) => p.name === "Wsymb2")?.values[0];

    if (temp !== undefined) dayData.temps.push(temp);
    if (symbol !== undefined) dayData.symbols.push(symbol);
  });

  // Skapa prognosobjekt
  Array.from(dailyData.values())
    .slice(0, 7)
    .forEach((day) => {
      if (day.temps.length > 0) {
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        const mostCommonSymbol =
          day.symbols.length > 0
            ? day.symbols
                .sort(
                  (a: number, b: number) =>
                    day.symbols.filter((v: number) => v === a).length -
                    day.symbols.filter((v: number) => v === b).length
                )
                .pop()
            : 1;

        forecast.push({
          date: day.date,
          dayName: day.dayName,
          maxTemp,
          minTemp,
          weatherSymbol: mostCommonSymbol,
          description: getWeatherDescription(mostCommonSymbol),
        });
      }
    });

  return {
    current,
    forecast,
    warnings: [], // Kommer fyllas i från warnings API
  };
}

async function fetchWeatherWarnings(): Promise<WeatherWarning[]> {
  try {
    const response = await fetch(SMHI_WARNINGS_URL, {
      mode: "cors",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) return [];

    const data: SMHIWarningsResponse = await response.json();
    const warnings: WeatherWarning[] = [];

    data.alert?.forEach((alert) => {
      alert.info?.forEach((info) => {
        warnings.push({
          id: alert.identifier,
          title: info.headline,
          description: info.description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          severity: info.severity.toLowerCase() as any,
          validFrom: info.effective,
          validTo: info.expires,
        });
      });
    });

    return warnings;
  } catch (error) {
    console.warn(
      "Failed to fetch weather warnings (CORS issue), skipping warnings:",
      error
    );
    return []; // Returnera tom array istället för att krascha
  }
}

export async function fetchWeatherData(): Promise<WeatherData> {
  const cacheKey = "weather_data";

  // Kontrollera cache först
  const cached = cache.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Hämta väderdata med CORS-hantering
    const [forecastResponse, warnings] = await Promise.all([
      fetch(SMHI_FORECAST_URL, {
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
      }),
      fetchWeatherWarnings(),
    ]);

    if (!forecastResponse.ok) {
      throw new Error(`SMHI API error: ${forecastResponse.status}`);
    }

    const forecastData: SMHIResponse = await forecastResponse.json();
    const weatherData = parseWeatherData(forecastData);
    weatherData.warnings = warnings;

    // Cacha resultatet
    const cacheTime = getRefreshInterval(CACHE_DURATIONS.WEATHER);
    cache.set(cacheKey, weatherData, cacheTime);

    return weatherData;
  } catch (error) {
    console.warn("Error fetching weather data (using mock data):", error);

    // Returnera mock-data vid fel
    return getMockWeatherData();
  }
}

function getMockWeatherData(): WeatherData {
  const today = new Date();

  return {
    current: {
      temperature: 8,
      humidity: 72,
      windSpeed: 12,
      windDirection: 225,
      visibility: 15,
      weatherSymbol: 3,
      description: "Växlande molnighet",
    },
    forecast: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      return {
        date: date.toISOString().split("T")[0],
        dayName: getShortDayName(date),
        maxTemp: Math.round(8 + Math.random() * 10),
        minTemp: Math.round(2 + Math.random() * 6),
        weatherSymbol: Math.floor(Math.random() * 6) + 1,
        description: getWeatherDescription(Math.floor(Math.random() * 6) + 1),
      };
    }),
    warnings: [],
  };
}
