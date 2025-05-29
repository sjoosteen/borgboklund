"use client";

import { useState, useEffect } from "react";
import { WeatherSkeleton } from "./Skeleton";
import { WeatherData } from "../types/weather";
import { fetchWeatherData } from "../lib/api/smhi";
import { GardenData } from "../lib/api/smhi-garden";
import { getRefreshInterval } from "../lib/utils/timeUtils";

const WEATHER_ICONS_DAY: Record<number, string> = {
  1: "☀️", // Klart
  2: "🌤️", // Lätt molnigt
  3: "⛅", // Halvklart
  4: "☁️", // Molnigt
  5: "☁️", // Mycket molnigt
  6: "☁️", // Mulet
  7: "🌫️", // Dimma
  8: "🌦️", // Lätt regnskur
  9: "🌧️", // Måttlig regnskur
  10: "⛈️", // Kraftig regnskur
  11: "⛈️", // Åska
  12: "🌨️", // Lätt snöblandat regn
  13: "🌨️", // Måttligt snöblandat regn
  14: "❄️", // Kraftigt snöblandat regn
  15: "🌨️", // Lätt snöfall
  16: "❄️", // Måttligt snöfall
  17: "❄️", // Kraftigt snöfall
  18: "🌧️", // Lätt regn
  19: "🌧️", // Måttligt regn
  20: "🌧️", // Kraftigt regn
  21: "⛈️", // Åska
  22: "🌨️", // Lätt snöblandat regn
  23: "🌨️", // Måttligt snöblandat regn
  24: "🌨️", // Kraftigt snöblandat regn
  25: "❄️", // Lätt snöfall
  26: "❄️", // Måttligt snöfall
  27: "❄️", // Kraftigt snöfall
};

const WEATHER_ICONS_NIGHT: Record<number, string> = {
  1: "🌙", // Klart (måne)
  2: "🌙", // Lätt molnigt (måne)
  3: "☁️", // Halvklart (moln)
  4: "☁️", // Molnigt
  5: "☁️", // Mycket molnigt
  6: "☁️", // Mulet
  7: "🌫️", // Dimma
  8: "🌦️", // Lätt regnskur
  9: "🌧️", // Måttlig regnskur
  10: "⛈️", // Kraftig regnskur
  11: "⛈️", // Åska
  12: "🌨️", // Lätt snöblandat regn
  13: "🌨️", // Måttligt snöblandat regn
  14: "❄️", // Kraftigt snöblandat regn
  15: "🌨️", // Lätt snöfall
  16: "❄️", // Måttligt snöfall
  17: "❄️", // Kraftigt snöfall
  18: "🌧️", // Lätt regn
  19: "🌧️", // Måttligt regn
  20: "🌧️", // Kraftigt regn
  21: "⛈️", // Åska
  22: "🌨️", // Lätt snöblandat regn
  23: "🌨️", // Måttligt snöblandat regn
  24: "🌨️", // Kraftigt snöblandat regn
  25: "❄️", // Lätt snöfall
  26: "❄️", // Måttligt snöfall
  27: "❄️", // Kraftigt snöfall
};

function isNightTime(): boolean {
  const now = new Date();
  const hour = now.getHours();
  // Natt mellan 22:00 och 06:00
  return hour >= 22 || hour < 6;
}

function getWeatherIcon(symbol: number, forceDay: boolean = false): string {
  // För prognoser använd alltid dag-ikoner, för aktuellt väder kolla tid
  const useNightIcons = !forceDay && isNightTime();
  const icons = useNightIcons ? WEATHER_ICONS_NIGHT : WEATHER_ICONS_DAY;
  return icons[symbol] || "❓";
}

function convertKmhToMs(kmh: number): number {
  return Math.round((kmh / 3.6) * 10) / 10; // Konvertera km/h till m/s med 1 decimal
}

export default function WeatherCard() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [gardenData, setGardenData] = useState<GardenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadWeatherData = async () => {
    try {
      setError(null);

      // Hämta både väder och trädgårdsdata parallellt
      const [weatherResult, gardenResult] = await Promise.allSettled([
        fetchWeatherData(),
        fetch("/api/garden").then((res) => res.json()),
      ]);

      if (weatherResult.status === "fulfilled") {
        setWeatherData(weatherResult.value);
      } else {
        console.error("Weather data error:", weatherResult.reason);
      }

      if (gardenResult.status === "fulfilled") {
        setGardenData(gardenResult.value);
      } else {
        console.error("Garden data error:", gardenResult.reason);
      }

      // Visa fel bara om båda misslyckas
      if (
        weatherResult.status === "rejected" &&
        gardenResult.status === "rejected"
      ) {
        setError("Kunde inte hämta väder- eller trädgårdsdata");
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError("Kunde inte hämta data");
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();

    // Sätt upp automatisk uppdatering
    const interval = setInterval(
      loadWeatherData,
      getRefreshInterval(10 * 60 * 1000)
    ); // 10 min

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <WeatherSkeleton />;
  }

  if (error || !weatherData) {
    return (
      <div className="bg-white/8 backdrop-blur-md rounded-2xl p-6 border border-white/15 h-full">
        <div className="text-center text-white/70">
          <div className="text-4xl mb-2">⚠️</div>
          <p>{error || "Väderdata ej tillgänglig"}</p>
          <button
            onClick={loadWeatherData}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  const { current, forecast, warnings } = weatherData;

  return (
    <div className="card-glass rounded-2xl p-6 h-full shadow-2xl text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Väderprognos</h2>
        {lastUpdated && (
          <span className="text-sm text-slate-400">
            {lastUpdated.toLocaleTimeString("sv-SE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Varningar */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-xl mr-2">⚠️</span>
            <span className="font-semibold text-white">Vädervarning</span>
          </div>
          {warnings.map((warning) => (
            <div key={warning.id} className="text-sm text-white/90">
              <strong>{warning.title}</strong>
              <p className="text-white/70">{warning.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Aktuellt väder */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-6xl mr-4">
              {getWeatherIcon(current.weatherSymbol)}
            </span>
            <div>
              <div className="text-4xl font-bold text-slate-100">
                {current.temperature}°
              </div>
              <div className="text-slate-400">{current.description}</div>
            </div>
          </div>
        </div>

        {/* Väderdetaljer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-slate-400 text-sm">Vind</div>
            <div className="text-slate-100 font-semibold">
              {convertKmhToMs(current.windSpeed)} m/s
            </div>
            <div className="text-slate-400 text-xs">
              {current.windDirection}°
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-slate-400 text-sm">Luftfuktighet</div>
            <div className="text-slate-100 font-semibold">
              {current.humidity}%
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-slate-400 text-sm">Sikt</div>
            <div className="text-slate-100 font-semibold">
              {Math.round(current.visibility || 0)} km
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-slate-400 text-sm">Norrköping</div>
            <div className="text-slate-100 font-semibold text-xs">SMHI</div>
          </div>
        </div>
      </div>

      {/* 7-dagars prognos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3">
          7-dagars prognos
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {forecast.map((day, index) => (
            <div
              key={`forecast-${index}`}
              className="bg-slate-800/50 rounded-lg p-2 text-center"
            >
              <div className="text-slate-400 text-xs mb-1">
                {index === 0 ? "Idag" : day.dayName}
              </div>
              <div className="text-2xl mb-1">
                {getWeatherIcon(day.weatherSymbol, true)}
              </div>
              <div className="text-slate-100 text-sm font-semibold">
                {day.maxTemp}°
              </div>
              <div className="text-slate-400 text-xs">{day.minTemp}°</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trädgård & Odling sektion */}
      {gardenData && (
        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <span className="mr-2">🌱</span>
            Trädgård & Odling
          </h3>

          {/* Frostvarning */}
          {gardenData.frostRisk && (
            <div className="mb-4 p-3 bg-orange-500/15 border border-orange-500/25 rounded-lg">
              <div className="flex items-center">
                <span className="text-xl mr-2">❄️</span>
                <div>
                  <div className="font-semibold text-slate-100">Frostrisk</div>
                  <div className="text-sm text-slate-300">
                    Mintemp: {gardenData.airTemperature.min}°C - Täck känsliga
                    växter
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trädgårdsdata */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 text-center">
              <div className="text-slate-400 text-xs md:text-sm">Jordtemp</div>
              <div className="text-slate-100 font-semibold text-sm md:text-base">
                {gardenData.soilTemperature}°C
              </div>
              <div className="text-xs text-slate-400">
                {gardenData.soilTemperature < 8 ? "Kallt" : "Bra"}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 text-center">
              <div className="text-slate-400 text-xs md:text-sm">Regn</div>
              <div className="text-slate-100 font-semibold text-sm md:text-base">
                {gardenData.precipitation} mm
              </div>
              <div className="text-xs text-slate-400">
                {gardenData.precipitation < 1 ? "Vatna" : "Naturligt"}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 text-center">
              <div className="text-slate-400 text-xs md:text-sm">Sol</div>
              <div className="text-slate-100 font-semibold text-sm md:text-base">
                {gardenData.sunHours}h
              </div>
              <div className="text-xs text-slate-400">
                {gardenData.sunHours > 6 ? "Bra" : "Lite"}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 md:p-3 text-center">
              <div className="text-slate-400 text-xs md:text-sm">Frost</div>
              <div className="text-slate-100 font-semibold text-xs">
                {gardenData.lastFrostDate
                  ? new Date(gardenData.lastFrostDate).toLocaleDateString(
                      "sv-SE",
                      { month: "short", day: "numeric" }
                    )
                  : "Okänt"}
              </div>
              <div className="text-xs text-slate-400">Sista</div>
            </div>
          </div>

          {/* Planteringsråd */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-100 mb-2">
              💡 Planteringsråd
            </h4>
            <div className="space-y-1">
              {gardenData.plantingAdvice.slice(0, 2).map((advice, index) => (
                <div
                  key={index}
                  className="text-sm text-slate-300 bg-slate-800/50 rounded px-3 py-2"
                >
                  {advice}
                </div>
              ))}
            </div>
          </div>

          {/* Säsongstips */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-2">
              📅 Säsongstips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {gardenData.seasonalTips.slice(0, 2).map((tip, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
