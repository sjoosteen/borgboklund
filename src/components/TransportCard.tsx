"use client";

import { useState, useEffect } from "react";
import { TransportSkeleton } from "./Skeleton";

// Hårdkodade station-ID:n
const STATION_IDS = {
  KLINGA: "740055002",
  SODER_TULL: "740011132",
} as const;

interface BusDeparture {
  id: string;
  tripId: string;
  line: string;
  destination: string;
  departureTime: string;
  realTime: string;
  delay: number;
  status: string;
  minutesUntil: number;
  type: string;
}

export default function TransportCard() {
  const [klingaDepartures, setKlingaDepartures] = useState<BusDeparture[]>([]);
  const [soderTullDepartures, setSoderTullDepartures] = useState<
    BusDeparture[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStationDepartures = async (stationId: string) => {
    const response = await fetch(`/api/departures/${stationId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  };

  const calculateMinutesUntil = (
    timeString: string,
    useCurrentTime: boolean = false
  ): number => {
    const now = useCurrentTime ? currentTime : new Date();
    const departureTime = new Date(timeString);
    return Math.round((departureTime.getTime() - now.getTime()) / (1000 * 60));
  };

  const formatMinutesUntil = (minutes: number): string => {
    if (minutes < -10) {
      return `${Math.abs(minutes)} min sedan`;
    } else if (minutes < 0) {
      return `${Math.abs(minutes)} min sedan`;
    } else if (minutes === 0) {
      return "Nu";
    } else {
      return `${minutes} min`;
    }
  };

  const calculateNextRefreshTime = (
    departures: BusDeparture[]
  ): Date | null => {
    const now = new Date();
    const futureDepartures = departures.filter((dep) => {
      const depTime = new Date(dep.realTime);
      return depTime.getTime() > now.getTime();
    });

    if (futureDepartures.length === 0) return null;

    // Hitta närmaste avgång
    const nextDeparture = futureDepartures.reduce((closest, current) => {
      const closestTime = new Date(closest.realTime).getTime();
      const currentTime = new Date(current.realTime).getTime();
      return currentTime < closestTime ? current : closest;
    });

    // Uppdatera 1 minut efter avgång, sätt sekunder till 0
    const refreshTime = new Date(nextDeparture.realTime);
    refreshTime.setMinutes(refreshTime.getMinutes() + 1);
    refreshTime.setSeconds(0);
    refreshTime.setMilliseconds(0);

    return refreshTime;
  };

  const formatTime = (timeString: string): string => {
    return new Date(timeString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeWithDelay = (departure: BusDeparture): React.JSX.Element => {
    const delayMinutes = Math.round(departure.delay / 60);
    const isDelayed = delayMinutes > 0;
    const isEarly = delayMinutes < 0;

    return (
      <span>
        {formatTime(departure.realTime)}
        {isDelayed && (
          <span className="text-red-400 ml-1 text-xs font-medium">
            (+{delayMinutes} min)
          </span>
        )}
        {isEarly && (
          <span className="text-green-400 ml-1 text-xs font-medium">
            ({delayMinutes} min)
          </span>
        )}
      </span>
    );
  };

  const getDelayWarnings = (
    departures: BusDeparture[]
  ): React.JSX.Element | null => {
    const warnings: string[] = [];

    departures.slice(0, 2).forEach((dep) => {
      const delayMinutes = Math.round(dep.delay / 60);
      if (delayMinutes > 2) {
        warnings.push(`Linje ${dep.line} är ${delayMinutes} min försenad`);
      } else if (delayMinutes < -1) {
        warnings.push(
          `Linje ${dep.line} går ${Math.abs(delayMinutes)} min för tidigt`
        );
      }
    });

    if (warnings.length === 0) return null;

    return (
      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-yellow-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-yellow-200 text-sm">
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getLineColor = (line: string, delay: number = 0): string => {
    const delayMinutes = Math.round(delay / 60);
    const isDelayed = delayMinutes > 2; // Försenad om > 2 min

    if (isDelayed) {
      return "bg-red-600"; // Röd för förseningar
    }

    switch (line) {
      case "480":
        return "bg-green-600";
      case "482":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const calculateRealTravelTime = (
    departure: BusDeparture,
    fromStation: "klinga" | "soder"
  ): number => {
    // Hitta samma buss på andra stationen
    const otherStationDepartures =
      fromStation === "klinga" ? soderTullDepartures : klingaDepartures;
    const matchingTrip = otherStationDepartures.find(
      (dep) => dep.tripId === departure.tripId
    );

    if (matchingTrip) {
      const fromTime = new Date(departure.realTime);
      const toTime = new Date(matchingTrip.realTime);

      // Beräkna skillnaden i minuter
      const diffMinutes =
        Math.abs(toTime.getTime() - fromTime.getTime()) / (1000 * 60);

      // Logga för debug
      console.log(
        `🕐 Verklig restid för trip ${departure.tripId}: ${Math.round(
          diffMinutes
        )} min`
      );

      return Math.round(diffMinutes);
    }

    // Fallback till uppskattad tid om vi inte hittar matchande resa
    return getTravelTimeFallback(departure.line);
  };

  const getTravelTimeFallback = (line: string): number => {
    // Fallback-restid om vi inte kan beräkna verklig tid
    switch (line) {
      case "480":
        return 10; // 8-12 min normalt
      case "482":
        return 12; // Lite längre för 482
      default:
        return 10;
    }
  };

  const getTravelTime = (
    departure: BusDeparture,
    fromStation: "klinga" | "soder"
  ): number => {
    // Försök beräkna verklig restid först
    const realTime = calculateRealTravelTime(departure, fromStation);

    // Om verklig tid verkar rimlig (5-20 min), använd den
    if (realTime >= 5 && realTime <= 20) {
      return realTime;
    }

    // Annars använd fallback
    console.log(
      `⚠️ Verklig restid ${realTime} min verkar orimlig, använder fallback`
    );
    return getTravelTimeFallback(departure.line);
  };

  const getDestinationForDisplay = (
    _departure: BusDeparture,
    fromStation: "klinga" | "soder"
  ): string => {
    // Visa bara slutdestinationen för vår resa
    if (fromStation === "klinga") {
      return "Söder Tull";
    } else {
      return "Klinga";
    }
  };

  const calculateArrivalTime = (
    departure: BusDeparture,
    fromStation: "klinga" | "soder"
  ): string => {
    const departureTime = new Date(departure.realTime);
    const travelMinutes = getTravelTime(departure, fromStation);
    const arrival = new Date(
      departureTime.getTime() + travelMinutes * 60 * 1000
    );

    return arrival.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // MANUAL refresh - ingen automatisk uppdatering
  const loadTransportData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🚀 MANUAL API-anrop");

      const [klingaData, soderTullData] = await Promise.all([
        fetchStationDepartures(STATION_IDS.KLINGA),
        fetchStationDepartures(STATION_IDS.SODER_TULL),
      ]);

      // Filtrera för relevanta busslinjerna och säkerställ 2 avgångar från Klinga
      const filteredKlinga = klingaData.filter(
        (dep: any) =>
          ["480", "482", "486"].includes(dep.line) &&
          (dep.destination?.toLowerCase().includes("norrköping") ||
            dep.destination?.toLowerCase().includes("östra station") ||
            dep.destination?.toLowerCase().includes("söder tull"))
      );

      const processedKlinga = filteredKlinga
        .map((dep: any) => ({
          ...dep,
          minutesUntil: calculateMinutesUntil(dep.realTime, false),
        }))
        .filter((dep: BusDeparture) => dep.minutesUntil > -10) // Visa bussar som gått < 10 min
        .filter((dep: BusDeparture, index: number, arr: BusDeparture[]) => {
          // Ta bort dubbletter baserat på tid och destination
          return (
            arr.findIndex(
              (d) =>
                d.realTime === dep.realTime &&
                d.destination === dep.destination &&
                d.line === dep.line
            ) === index
          );
        })
        .sort(
          (a: BusDeparture, b: BusDeparture) =>
            new Date(a.realTime).getTime() - new Date(b.realTime).getTime()
        );

      // Filtrera för relevanta busslinjerna och säkerställ 2 avgångar från Söder Tull
      const filteredSoderTull = soderTullData.filter(
        (dep: any) =>
          ["480", "482", "486"].includes(dep.line) &&
          (dep.destination?.toLowerCase().includes("klinga") ||
            dep.destination?.toLowerCase().includes("skärblacka") ||
            dep.destination?.toLowerCase().includes("kimstad") ||
            dep.destination?.toLowerCase().includes("strömporten"))
      );

      const processedSoderTull = filteredSoderTull
        .map((dep: any) => ({
          ...dep,
          minutesUntil: calculateMinutesUntil(dep.realTime, false),
        }))
        .filter((dep: BusDeparture) => dep.minutesUntil > -10) // Visa bussar som gått < 10 min
        .filter((dep: BusDeparture, index: number, arr: BusDeparture[]) => {
          // Ta bort dubbletter baserat på tid och destination
          return (
            arr.findIndex(
              (d) =>
                d.realTime === dep.realTime &&
                d.destination === dep.destination &&
                d.line === dep.line
            ) === index
          );
        })
        .sort(
          (a: BusDeparture, b: BusDeparture) =>
            new Date(a.realTime).getTime() - new Date(b.realTime).getTime()
        );

      console.log(
        `📊 Klinga: ${klingaData.length} raw → ${processedKlinga.length} processed`
      );
      console.log(
        `📊 Söder Tull: ${soderTullData.length} raw → ${processedSoderTull.length} processed`
      );

      setKlingaDepartures(processedKlinga);
      setSoderTullDepartures(processedSoderTull);
      setLastUpdated(new Date());

      // Beräkna nästa refresh-tid
      const allDepartures = [...processedKlinga, ...processedSoderTull];
      const nextRefresh = calculateNextRefreshTime(allDepartures);
      setNextRefreshTime(nextRefresh);

      if (nextRefresh) {
        console.log(
          `🕐 Nästa auto-refresh: ${nextRefresh.toLocaleTimeString("sv-SE")}`
        );
      }
    } catch (error) {
      console.error("Transport data error:", error);
      setError("API-kvot slut eller fel - klicka för att försöka igen");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch vid sidladdning
  useEffect(() => {
    console.log("🚀 Initial fetch vid sidladdning");
    loadTransportData();
  }, []); // Kör bara en gång vid mount

  // Uppdatera klienttid varje minut för att hålla "X min" aktuellt
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Varje minut

    return () => clearInterval(interval);
  }, []);

  // Kombinerad smart auto-refresh: 5 min + när bussar går
  useEffect(() => {
    // Huvudintervall: var 5:e minut
    const mainInterval = setInterval(() => {
      console.log("🕐 5-minuters auto-refresh");
      loadTransportData();
    }, 5 * 60 * 1000);

    return () => clearInterval(mainInterval);
  }, []);

  // Smart refresh när bussar går + hantera realtime-ändringar
  useEffect(() => {
    if (!nextRefreshTime) return;

    const now = new Date();
    const timeUntilRefresh = nextRefreshTime.getTime() - now.getTime();

    // Bara om det är inom 15 minuter (utökat för realtime-ändringar)
    if (timeUntilRefresh <= 0 || timeUntilRefresh > 15 * 60 * 1000) return;

    console.log(
      `⏰ Smart refresh aktiverad, uppdaterar om ${Math.round(
        timeUntilRefresh / 1000 / 60
      )} minuter (${nextRefreshTime.toLocaleTimeString("sv-SE")})`
    );

    const timeout = setTimeout(() => {
      console.log("🚌 Smart refresh - buss går nu eller realtime-uppdatering!");
      loadTransportData();
    }, timeUntilRefresh);

    return () => clearTimeout(timeout);
  }, [nextRefreshTime]);

  // Extra kontroll för realtime-ändringar var 2:a minut
  useEffect(() => {
    const realtimeCheck = setInterval(() => {
      // Bara om vi har avgångar och nästa är inom 5 minuter
      const allDepartures = [...klingaDepartures, ...soderTullDepartures];
      const now = new Date();
      const soonDepartures = allDepartures.filter((dep) => {
        const depTime = new Date(dep.realTime);
        const minutesUntil = (depTime.getTime() - now.getTime()) / (1000 * 60);
        return minutesUntil > 0 && minutesUntil <= 5;
      });

      if (soonDepartures.length > 0) {
        console.log("🔄 Realtime-kontroll: Buss inom 5 min, uppdaterar...");
        loadTransportData();
      }
    }, 2 * 60 * 1000); // Var 2:a minut

    return () => clearInterval(realtimeCheck);
  }, [klingaDepartures, soderTullDepartures]);

  if (loading) {
    return <TransportSkeleton />;
  }

  return (
    <div className="card-glass rounded-2xl p-6 h-full shadow-2xl text-slate-100 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Östgötatrafiken logga - mindre på mobil */}
          <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center">
            <img
              src="https://www.ostgotatrafiken.se/favicon.ico"
              alt="Östgötatrafiken"
              className="w-4 h-4 md:w-6 md:h-6"
              onError={(e) => {
                // Fallback till generisk bussikon
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget
                  .nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove("hidden");
              }}
            />
            <svg
              className="w-3 h-3 md:w-5 md:h-5 text-blue-600 hidden"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100">
            Östgötatrafiken
          </h2>
        </div>

        <button
          onClick={loadTransportData}
          disabled={loading}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {loading ? "Laddar..." : "Uppdatera"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Varningsruta för förseningar/tidiga avgångar */}
      {getDelayWarnings([...klingaDepartures, ...soderTullDepartures])}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-3">
            Från Klinga
          </h3>
          {klingaDepartures.length === 0 ? (
            <p className="text-white/60 text-sm">
              Klicka "Uppdatera" för att hämta avgångar
            </p>
          ) : (
            <div className="space-y-2">
              {klingaDepartures.length === 0 ? (
                <p className="text-white/60 text-sm">
                  Inga avgångar tillgängliga
                </p>
              ) : (
                klingaDepartures.slice(0, 2).map((departure, index) => {
                  const currentMinutes = calculateMinutesUntil(
                    departure.realTime,
                    true
                  );
                  const hasLeft = currentMinutes < 0;
                  const uniqueKey = `klinga-${departure.line}-${departure.realTime}-${index}`;
                  return (
                    <div
                      key={uniqueKey}
                      className={`bg-white/5 rounded-lg p-3 border border-white/10 relative ${
                        hasLeft ? "opacity-60" : ""
                      }`}
                    >
                      {/* Genomstruken linje för bussar som gått */}
                      {hasLeft && (
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-0.5 bg-red-400"></div>
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 rounded-full text-white text-sm font-bold ${getLineColor(
                              departure.line,
                              departure.delay
                            )}`}
                          >
                            {departure.line}
                          </span>
                          <div className="text-white">
                            <div className="font-semibold">
                              {formatMinutesUntil(currentMinutes)}
                            </div>
                            <div className="text-xs text-white/60">
                              till{" "}
                              {getDestinationForDisplay(departure, "klinga")}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <div className="flex items-center space-x-1 text-white/80 mb-1">
                            <span className="text-xs">Restid:</span>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {getTravelTime(departure, "klinga")} min
                            </span>
                          </div>
                          <div className="text-white/80 mb-1">
                            <span className="text-xs">Avgång: </span>
                            {formatTimeWithDelay(departure)}
                          </div>
                          <div className="text-white/80">
                            <span className="text-xs">Ankomst: </span>
                            {calculateArrivalTime(departure, "klinga")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Från Söder Tull
          </h3>
          {soderTullDepartures.length === 0 ? (
            <p className="text-white/60 text-sm">
              Klicka "Uppdatera" för att hämta avgångar
            </p>
          ) : (
            <div className="space-y-2">
              {soderTullDepartures.length === 0 ? (
                <p className="text-white/60 text-sm">
                  Inga avgångar tillgängliga
                </p>
              ) : (
                soderTullDepartures.slice(0, 2).map((departure, index) => {
                  const currentMinutes = calculateMinutesUntil(
                    departure.realTime,
                    true
                  );
                  const hasLeft = currentMinutes < 0;
                  const uniqueKey = `soder-${departure.line}-${departure.realTime}-${index}`;
                  return (
                    <div
                      key={uniqueKey}
                      className={`bg-white/5 rounded-lg p-3 border border-white/10 relative ${
                        hasLeft ? "opacity-60" : ""
                      }`}
                    >
                      {/* Genomstruken linje för bussar som gått */}
                      {hasLeft && (
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-0.5 bg-red-400"></div>
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 rounded-full text-white text-sm font-bold ${getLineColor(
                              departure.line,
                              departure.delay
                            )}`}
                          >
                            {departure.line}
                          </span>
                          <div className="text-white">
                            <div className="font-semibold">
                              {formatMinutesUntil(currentMinutes)}
                            </div>
                            <div className="text-xs text-white/60">
                              till{" "}
                              {getDestinationForDisplay(departure, "soder")}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <div className="flex items-center space-x-1 text-white/80 mb-1">
                            <span className="text-xs">Restid:</span>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{getTravelTime(departure, "soder")} min</span>
                          </div>
                          <div className="text-white/80 mb-1">
                            <span className="text-xs">Avgång: </span>
                            {formatTimeWithDelay(departure)}
                          </div>
                          <div className="text-white/80">
                            <span className="text-xs">Ankomst: </span>
                            {calculateArrivalTime(departure, "soder")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="text-center text-white/60 text-sm">
          <span>Auto-uppdatering: 5 min + smart refresh</span>
          {lastUpdated && (
            <div className="mt-1 text-xs">
              Senast uppdaterad: {lastUpdated.toLocaleTimeString("sv-SE")}
            </div>
          )}
          {nextRefreshTime && (
            <div className="mt-1 text-xs text-green-400">
              Nästa smart refresh: {nextRefreshTime.toLocaleTimeString("sv-SE")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
