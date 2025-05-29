// Trafiklab Realtime APIs för kollektivtrafik
// Nu via Next.js API route för att undvika CORS-problem

import { cache, CACHE_DURATIONS } from "../utils/cache";
import { getRefreshInterval } from "../utils/timeUtils";

// Våra interna typer (samma som tidigare)
export interface Departure {
  id: string;
  line: string;
  destination: string;
  departureTime: string;
  realTime: string;
  delay: number;
  status: "onTime" | "delayed" | "cancelled";
  platform?: string;
  type: "bus" | "train" | "tram";
}

export interface Arrival {
  id: string;
  line: string;
  origin: string;
  arrivalTime: string;
  realTime: string;
  delay: number;
  status: "onTime" | "delayed" | "cancelled";
  platform?: string;
  type: "bus" | "train" | "tram";
}

// Huvudfunktion för att hämta kollektivtrafikdata (nu via Next.js API route)
export async function fetchTransportData(
  direction: "departures" | "arrivals"
): Promise<Departure[] | Arrival[]> {
  const cacheKey = `trafiklab_transport_${direction}`;

  console.log(`🚌 === FETCHING ${direction.toUpperCase()} DATA ===`);
  console.log(`🚌 Cache Key: ${cacheKey}`);

  // Kontrollera cache först
  const cached = cache.get<Departure[] | Arrival[]>(cacheKey);
  if (cached) {
    console.log(`🎯 === USING CACHED DATA ===`);
    console.log(`🎯 Cached ${direction} count:`, cached.length);
    console.log(`🎯 Cached data:`, cached);
    return cached;
  }

  console.log(`🚌 === FETCHING FRESH DATA ===`);
  console.log(`🚌 Direction: ${direction}`);
  console.log(`🚌 API: Next.js API Route -> Trafiklab Realtime`);

  try {
    // Anropa vår Next.js API route istället för direkta Trafiklab-anrop
    const apiUrl = `/api/transport?direction=${direction}`;

    console.log(`🔗 === API ROUTE REQUEST ===`);
    console.log(`🔗 API URL: ${apiUrl}`);
    console.log(`🔗 Direction: ${direction}`);

    const requestStart = Date.now();
    const response = await fetch(apiUrl);
    const requestDuration = Date.now() - requestStart;

    console.log(`📡 === API ROUTE RESPONSE ===`);
    console.log(`📡 Status Code: ${response.status}`);
    console.log(`📡 Status Text: ${response.statusText}`);
    console.log(`📡 Request Duration: ${requestDuration}ms`);
    console.log(
      `📡 Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ === API ROUTE ERROR ===`);
      console.error(`❌ Status: ${response.status}`);
      console.error(`❌ Status Text: ${response.statusText}`);
      console.error(`❌ Error Data:`, errorData);

      if (response.status === 401) {
        console.error(`❌ AUTHENTICATION ERROR: API key is invalid or expired`);
      } else if (response.status === 403) {
        console.error(`❌ AUTHORIZATION ERROR: API key lacks permissions`);
      } else if (response.status === 404) {
        console.error(`❌ NOT FOUND ERROR: Stop not found or invalid`);
      } else if (response.status === 429) {
        console.error(`❌ RATE LIMIT ERROR: Too many requests, quota exceeded`);
      } else if (response.status >= 500) {
        console.error(`❌ SERVER ERROR: API or server issues`);
      }

      console.warn(`❌ Returning empty array due to API error`);
      return [];
    }

    const transportData = await response.json();
    console.log(`✅ === API ROUTE SUCCESS ===`);
    console.log(`✅ Transport data count:`, transportData.length);
    console.log(`✅ Transport data:`, transportData);

    // Data är redan filtrerad och konverterad av API-routen
    const finalData = Array.isArray(transportData) ? transportData : [];

    console.log(`💾 === CACHING RESULTS ===`);
    console.log(`💾 Final data count:`, finalData.length);
    console.log(`💾 Cache key:`, cacheKey);

    // Cacha resultatet
    const cacheTime = getRefreshInterval(CACHE_DURATIONS.TRANSPORT);
    console.log(`💾 Cache duration:`, cacheTime, "ms");
    cache.set(cacheKey, finalData, cacheTime);

    console.log(`✅ === FETCH COMPLETE ===`);
    console.log(`✅ Returning ${finalData.length} ${direction} items`);
    return finalData;
  } catch (error) {
    console.error(`❌ === FETCH ERROR ===`);
    console.error(
      `❌ Error Type:`,
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      `❌ Error Message:`,
      error instanceof Error ? error.message : String(error)
    );
    console.error(`❌ Full Error:`, error);
    console.error(
      `❌ Stack Trace:`,
      error instanceof Error ? error.stack : "No stack trace"
    );

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`❌ NETWORK ERROR: Unable to connect to API route`);
      console.error(`❌ Check if Next.js server is running`);
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error(
        `❌ JSON PARSE ERROR: Invalid JSON response from API route`
      );
    }

    console.warn(`🔄 === RETURNING EMPTY ARRAY ===`);
    console.warn(`🔄 No fallback data available`);
    console.warn(`🔄 User will see "inga tider hittades" message`);
    return [];
  }
}
