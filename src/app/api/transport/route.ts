import { NextRequest, NextResponse } from "next/server";

// Trafiklab Realtime API konfiguration
const BASE_URL = "https://realtime-api.trafiklab.se/v1";

// Cache för Klinga hållplats-ID
let KLINGA_STOP_ID: string | null = null;

// TypeScript-typer för Trafiklab Realtime APIs
interface TrafiklabStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  municipality: string;
}

interface TrafiklabStopsResponse {
  timestamp: string;
  query: {
    queryTime: string;
    query: string | null;
  };
  stop_groups: TrafiklabStopGroup[];
}

interface TrafiklabStopGroup {
  id: string;
  name: string;
  area_type: string;
  average_daily_stop_times: number;
  transport_modes: string[];
  stops: TrafiklabStop[];
}

// Trafiklab Realtime API response structures (based on documentation)
interface TrafiklabDeparture {
  scheduled: string;
  realtime: string;
  delay: number;
  canceled: boolean;
  route: {
    name: string;
    designation: string;
    transport_mode_code: number;
    transport_mode: string;
    direction: string;
    origin: {
      id: string;
      name: string;
    };
    destination: {
      id: string;
      name: string;
    };
  };
  trip: {
    trip_id: string;
    start_date: string;
    technical_number: number;
  };
  agency: {
    id: string;
    name: string;
    operator: string;
  };
  stop: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  scheduled_platform?: {
    id: string;
    designation: string;
  };
  realtime_platform?: {
    id: string;
    designation: string;
  };
  alerts: any[];
  is_realtime: boolean;
}

interface TrafiklabArrival {
  scheduled: string;
  realtime: string;
  delay: number;
  canceled: boolean;
  route: {
    name: string;
    designation: string;
    transport_mode_code: number;
    transport_mode: string;
    direction: string;
    origin: {
      id: string;
      name: string;
    };
    destination: {
      id: string;
      name: string;
    };
  };
  trip: {
    trip_id: string;
    start_date: string;
    technical_number: number;
  };
  agency: {
    id: string;
    name: string;
    operator: string;
  };
  stop: {
    id: string;
    name: string;
    lat: number;
    lon: number;
  };
  scheduled_platform?: {
    id: string;
    designation: string;
  };
  realtime_platform?: {
    id: string;
    designation: string;
  };
  alerts: any[];
  is_realtime: boolean;
}

interface TrafiklabDeparturesResponse {
  timestamp: string;
  query: {
    queryTime: string;
    query: string;
  };
  stops: any[];
  departures: TrafiklabDeparture[];
}

interface TrafiklabArrivalsResponse {
  timestamp: string;
  query: {
    queryTime: string;
    query: string;
  };
  stops: any[];
  arrivals: TrafiklabArrival[];
}

// Våra interna typer
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

// Funktion för att hitta Klinga hållplats-ID
async function findKlingaStopId(): Promise<string | null> {
  // Returnera cached ID om vi redan har det
  if (KLINGA_STOP_ID) {
    console.log("🎯 Using cached Klinga stop ID:", KLINGA_STOP_ID);
    return KLINGA_STOP_ID;
  }

  const apiKey = process.env.NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ CRITICAL: Trafiklab Realtime API key missing from environment variables"
    );
    console.error(
      "❌ Expected environment variable: NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY"
    );
    return null;
  }

  console.log("🔑 API Key found, length:", apiKey.length, "characters");
  console.log("🔑 API Key prefix:", apiKey.substring(0, 8) + "...");

  try {
    // Sök efter Klinga med korrekt API-struktur
    const searchValue = "Klinga";
    const searchUrl = `${BASE_URL}/stops/name/${encodeURIComponent(
      searchValue
    )}?key=${apiKey}`;

    console.log("🔍 === STOP LOOKUP API REQUEST ===");
    console.log("🔍 Full URL:", searchUrl.replace(apiKey, "***API_KEY***"));
    console.log("🔍 Search query:", searchValue);
    console.log("🔍 Base URL:", BASE_URL);
    console.log("🔍 Endpoint: /stops/name/" + searchValue);

    const requestStart = Date.now();
    const response = await fetch(searchUrl);
    const requestDuration = Date.now() - requestStart;

    console.log("📡 === STOP LOOKUP API RESPONSE ===");
    console.log("📡 Status Code:", response.status);
    console.log("📡 Status Text:", response.statusText);
    console.log("📡 Request Duration:", requestDuration + "ms");
    console.log(
      "📡 Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ === STOP LOOKUP API ERROR ===");
      console.error("❌ Status:", response.status);
      console.error("❌ Status Text:", response.statusText);
      console.error("❌ Error Body:", errorText);

      if (response.status === 401) {
        console.error("❌ AUTHENTICATION ERROR: API key is invalid or expired");
        console.error(
          "❌ Check your Trafiklab account and API key permissions"
        );
      } else if (response.status === 403) {
        console.error(
          "❌ AUTHORIZATION ERROR: API key lacks permissions for this endpoint"
        );
      } else if (response.status === 429) {
        console.error("❌ RATE LIMIT ERROR: Too many requests, quota exceeded");
      } else if (response.status >= 500) {
        console.error("❌ SERVER ERROR: Trafiklab API is experiencing issues");
      }

      return null;
    }

    const data: TrafiklabStopsResponse = await response.json();
    console.log("📍 === STOP LOOKUP API SUCCESS ===");
    console.log("📍 Response Data Structure:", {
      hasStopGroups: !!data.stop_groups,
      stopGroupsIsArray: Array.isArray(data.stop_groups),
      stopGroupsCount: data.stop_groups?.length || 0,
      timestamp: data.timestamp,
      query: data.query,
    });
    console.log("📍 Full Response:", JSON.stringify(data, null, 2));

    // Leta efter Klinga hållplats i stop_groups
    if (data.stop_groups && Array.isArray(data.stop_groups)) {
      console.log("🔍 === SEARCHING FOR KLINGA STOP GROUP ===");
      console.log("🔍 Total stop groups found:", data.stop_groups.length);

      data.stop_groups.forEach((stopGroup, index) => {
        console.log(`🔍 Stop Group ${index + 1}:`, {
          id: stopGroup.id,
          name: stopGroup.name,
          area_type: stopGroup.area_type,
          transport_modes: stopGroup.transport_modes,
          stops_count: stopGroup.stops?.length || 0,
          matchesKlinga: stopGroup.name?.toLowerCase().includes("klinga"),
        });
      });

      for (const stopGroup of data.stop_groups) {
        if (stopGroup.name && stopGroup.name.toLowerCase().includes("klinga")) {
          console.log("✅ === KLINGA STOP GROUP FOUND ===");
          console.log("✅ Stop Group Name:", stopGroup.name);
          console.log("✅ Stop Group ID:", stopGroup.id);
          console.log("✅ Area Type:", stopGroup.area_type);
          console.log("✅ Transport Modes:", stopGroup.transport_modes);
          console.log("✅ Child Stops:", stopGroup.stops?.length || 0);

          // Cacha resultatet
          KLINGA_STOP_ID = stopGroup.id;
          return stopGroup.id;
        }
      }
    } else {
      console.error("❌ === INVALID RESPONSE STRUCTURE ===");
      console.error("❌ Expected 'stop_groups' array in response");
      console.error("❌ Actual response structure:", typeof data);
    }

    console.warn("❌ === NO KLINGA STOP FOUND ===");
    console.warn("❌ No stop matching 'klinga' found in search results");
    console.warn(
      "❌ Try searching with different terms or check stop name spelling"
    );
    return null;
  } catch (error) {
    console.error("❌ === STOP LOOKUP NETWORK ERROR ===");
    console.error(
      "❌ Error Type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "❌ Error Message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("❌ Full Error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("❌ NETWORK ERROR: Unable to connect to Trafiklab API");
      console.error(
        "❌ Check internet connection and API endpoint availability"
      );
    }

    return null;
  }
}

// Konvertera Trafiklab transport_mode till vårt format
function getTransportType(
  mode: string | null | undefined
): "bus" | "train" | "tram" {
  if (!mode) return "bus"; // Default till bus om mode är null/undefined

  switch (mode.toLowerCase()) {
    case "bus":
      return "bus";
    case "train":
    case "rail":
      return "train";
    case "tram":
    case "light_rail":
      return "tram";
    default:
      return "bus"; // Default till bus för Östgötatrafiken
  }
}

// Konvertera delay till status (delay är nu i sekunder)
function getStatus(delaySeconds: number): "onTime" | "delayed" | "cancelled" {
  if (delaySeconds === 0) return "onTime";
  if (delaySeconds > 0) return "delayed";
  return "cancelled"; // Negativ delay kan betyda inställt
}

// Konvertera Trafiklab departures till vårt format
function convertDepartures(
  trafiklabDepartures: TrafiklabDeparture[]
): Departure[] {
  return trafiklabDepartures.map((dep) => ({
    id: dep.trip.trip_id,
    line: dep.route.designation || dep.route.name,
    destination: dep.route.destination.name,
    departureTime: dep.scheduled,
    realTime: dep.realtime,
    delay: dep.delay,
    status: getStatus(dep.delay),
    platform:
      dep.realtime_platform?.designation || dep.scheduled_platform?.designation,
    type: getTransportType(dep.route.transport_mode),
  }));
}

// Konvertera Trafiklab arrivals till vårt format
function convertArrivals(trafiklabArrivals: TrafiklabArrival[]): Arrival[] {
  return trafiklabArrivals.map((arr) => ({
    id: arr.trip.trip_id,
    line: arr.route.designation || arr.route.name,
    origin: arr.route.origin.name,
    arrivalTime: arr.scheduled,
    realTime: arr.realtime,
    delay: arr.delay,
    status: getStatus(arr.delay),
    platform:
      arr.realtime_platform?.designation || arr.scheduled_platform?.designation,
    type: getTransportType(arr.route.transport_mode),
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") as "departures" | "arrivals";

  if (!direction || !["departures", "arrivals"].includes(direction)) {
    return NextResponse.json(
      {
        error:
          'Invalid direction parameter. Must be "departures" or "arrivals"',
      },
      { status: 400 }
    );
  }

  console.log(`🚌 === FETCHING ${direction.toUpperCase()} DATA ===`);
  console.log(`🚌 Direction: ${direction}`);
  console.log(`🚌 API: Trafiklab Realtime (Server-side)`);

  // Kontrollera API-nyckel
  const apiKey = process.env.NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY;
  if (!apiKey) {
    console.error(`❌ === API KEY MISSING ===`);
    console.error(
      `❌ Environment variable NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY not found`
    );
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  console.log(`🔑 === API KEY VALIDATION ===`);
  console.log(`🔑 API Key length: ${apiKey.length} characters`);
  console.log(`🔑 API Key prefix: ${apiKey.substring(0, 8)}...`);

  try {
    // Hitta Klinga hållplats-ID
    console.log(`🔍 === FINDING KLINGA STOP ID ===`);
    const stopId = await findKlingaStopId();
    if (!stopId) {
      console.error(`❌ === STOP ID LOOKUP FAILED ===`);
      console.error(`❌ Could not find Klinga stop ID`);
      return NextResponse.json(
        { error: "Could not find Klinga stop ID" },
        { status: 404 }
      );
    }

    console.log(`✅ === STOP ID FOUND ===`);
    console.log(`✅ Klinga Stop ID: ${stopId}`);

    // Gör API-anrop för avgångar/ankomster med korrekt URL-struktur
    const endpoint = direction === "departures" ? "departures" : "arrivals";
    const timetableParams = new URLSearchParams({
      key: apiKey,
      limit: "5",
    });
    const url = `${BASE_URL}/${endpoint}/${stopId}?${timetableParams.toString()}`;

    console.log(`🔗 === TIMETABLES API REQUEST ===`);
    console.log(`🔗 Stop ID: ${stopId}`);
    console.log(`🔗 Endpoint: ${endpoint}`);
    console.log(`🔗 Limit: 5`);
    console.log(`🔗 Full URL: ${url.replace(apiKey, "***API_KEY***")}`);
    console.log(`🔗 Base URL: ${BASE_URL}`);
    console.log(`🔗 API Path: /${endpoint}/${stopId}`);

    const requestStart = Date.now();
    const response = await fetch(url);
    const requestDuration = Date.now() - requestStart;

    console.log(`📡 === TIMETABLES API RESPONSE ===`);
    console.log(`📡 Status Code: ${response.status}`);
    console.log(`📡 Status Text: ${response.statusText}`);
    console.log(`📡 Request Duration: ${requestDuration}ms`);
    console.log(
      `📡 Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ === TIMETABLES API ERROR ===`);
      console.error(`❌ Status: ${response.status}`);
      console.error(`❌ Status Text: ${response.statusText}`);
      console.error(`❌ Error Body: ${errorText}`);

      if (response.status === 401) {
        console.error(`❌ AUTHENTICATION ERROR: API key is invalid or expired`);
        return NextResponse.json(
          { error: "API authentication failed" },
          { status: 401 }
        );
      } else if (response.status === 403) {
        console.error(
          `❌ AUTHORIZATION ERROR: API key lacks permissions for timetables endpoint`
        );
        return NextResponse.json(
          { error: "API authorization failed" },
          { status: 403 }
        );
      } else if (response.status === 404) {
        console.error(
          `❌ NOT FOUND ERROR: Stop ID ${stopId} not found or invalid`
        );
        return NextResponse.json({ error: "Stop not found" }, { status: 404 });
      } else if (response.status === 429) {
        console.error(`❌ RATE LIMIT ERROR: Too many requests, quota exceeded`);
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      } else if (response.status >= 500) {
        console.error(`❌ SERVER ERROR: Trafiklab API is experiencing issues`);
        return NextResponse.json(
          { error: "External API error" },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ === TIMETABLES API SUCCESS ===`);
    console.log(`✅ Response Data Structure:`, {
      hasDepartures: !!(
        data as TrafiklabDeparturesResponse | TrafiklabArrivalsResponse
      ).departures,
      hasArrivals: !!(
        data as TrafiklabDeparturesResponse | TrafiklabArrivalsResponse
      ).arrivals,
      departuresCount:
        (data as TrafiklabDeparturesResponse).departures?.length || 0,
      arrivalsCount: (data as TrafiklabArrivalsResponse).arrivals?.length || 0,
      dataKeys: Object.keys(data),
    });
    console.log(`✅ Full Response:`, JSON.stringify(data, null, 2));

    // Konvertera och filtrera data
    let transportData: Departure[] | Arrival[];

    console.log(`🔄 === CONVERTING API DATA ===`);
    if (direction === "departures") {
      const trafiklabData = data as TrafiklabDeparturesResponse;
      console.log(`🔄 Raw departures data:`, trafiklabData.departures);
      console.log(
        `🔄 Departures count:`,
        trafiklabData.departures?.length || 0
      );

      if (
        !trafiklabData.departures ||
        !Array.isArray(trafiklabData.departures)
      ) {
        console.warn(`⚠️ No departures array found in response`);
        console.warn(`⚠️ Response structure:`, Object.keys(data));
      }

      transportData = convertDepartures(trafiklabData.departures || []);
    } else {
      const trafiklabData = data as TrafiklabArrivalsResponse;
      console.log(`🔄 Raw arrivals data:`, trafiklabData.arrivals);
      console.log(`🔄 Arrivals count:`, trafiklabData.arrivals?.length || 0);

      if (!trafiklabData.arrivals || !Array.isArray(trafiklabData.arrivals)) {
        console.warn(`⚠️ No arrivals array found in response`);
        console.warn(`⚠️ Response structure:`, Object.keys(data));
      }

      transportData = convertArrivals(trafiklabData.arrivals || []);
    }

    console.log(`🔄 Converted transport data:`, transportData);
    console.log(`🔄 Converted data count:`, transportData.length);

    // Filtrera endast bussar som går till/från Söder Tull
    console.log(`🎯 === FILTERING FOR SÖDER TULL ===`);
    let filteredData: Departure[] | Arrival[];

    if (direction === "departures") {
      const departures = transportData as Departure[];
      console.log(`🎯 Filtering departures for Norrköping destinations`);

      departures.forEach((departure, index) => {
        console.log(`🎯 Departure ${index + 1}:`, {
          line: departure.line,
          destination: departure.destination,
          matchesNorrkoping:
            departure.destination?.toLowerCase().includes("norrköping") ||
            departure.destination?.toLowerCase().includes("östra station") ||
            departure.destination?.toLowerCase().includes("söder tull"),
          departureTime: departure.departureTime,
          realTime: departure.realTime,
        });
      });

      filteredData = departures.filter(
        (departure) =>
          departure.destination &&
          (departure.destination.toLowerCase().includes("norrköping") ||
            departure.destination.toLowerCase().includes("östra station") ||
            departure.destination.toLowerCase().includes("söder tull"))
      );
    } else {
      const arrivals = transportData as Arrival[];
      console.log(`🎯 Filtering arrivals from Norrköping origins`);

      arrivals.forEach((arrival, index) => {
        console.log(`🎯 Arrival ${index + 1}:`, {
          line: arrival.line,
          origin: arrival.origin,
          matchesNorrkoping:
            arrival.origin?.toLowerCase().includes("norrköping") ||
            arrival.origin?.toLowerCase().includes("östra station") ||
            arrival.origin?.toLowerCase().includes("söder tull"),
          arrivalTime: arrival.arrivalTime,
          realTime: arrival.realTime,
        });
      });

      filteredData = arrivals.filter(
        (arrival) =>
          arrival.origin &&
          (arrival.origin.toLowerCase().includes("norrköping") ||
            arrival.origin.toLowerCase().includes("östra station") ||
            arrival.origin.toLowerCase().includes("söder tull"))
      );
    }

    console.log(`🎯 === FILTERING RESULTS ===`);
    console.log(`🎯 Original ${direction} count:`, transportData.length);
    console.log(`🎯 Filtered ${direction} count:`, filteredData.length);
    console.log(`🎯 Filtered data:`, filteredData);

    if (filteredData.length === 0) {
      console.warn(`⚠️ === NO SÖDER TULL ROUTES FOUND ===`);
      console.warn(`⚠️ No ${direction} found going to/from Söder Tull`);
      console.warn(`⚠️ This could indicate:`);
      console.warn(`⚠️ - No buses currently scheduled to/from Söder Tull`);
      console.warn(`⚠️ - Incorrect destination/origin names in API data`);
      console.warn(`⚠️ - Different naming convention than expected`);
    }

    console.log(`✅ === FETCH COMPLETE ===`);
    console.log(`✅ Returning ${filteredData.length} ${direction} items`);

    return NextResponse.json(filteredData);
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
      console.error(`❌ NETWORK ERROR: Unable to connect to Trafiklab API`);
      console.error(
        `❌ Check internet connection and API endpoint availability`
      );
    } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error(`❌ JSON PARSE ERROR: Invalid JSON response from API`);
      console.error(`❌ API may be returning HTML error page instead of JSON`);
    }

    console.warn(`🔄 === RETURNING ERROR RESPONSE ===`);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
