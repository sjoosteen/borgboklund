import { NextRequest, NextResponse } from "next/server";

// Trafiklab Realtime API configuration
const BASE_URL = "https://realtime-api.trafiklab.se/v1";

// TypeScript interfaces for Trafiklab Realtime API
interface TrafiklabDeparture {
  scheduled: string;
  realtime: string;
  delay: number;
  canceled: boolean;
  route: {
    name: string | null;
    designation: string; // Detta är linjenumret (480)
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
  scheduled_platform: {
    id: string;
    designation: string;
  };
  realtime_platform: {
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
    stopId: string;
  };
  departures: TrafiklabDeparture[];
}

// Our internal departure type
export interface Departure {
  id: string;
  tripId: string; // För att matcha samma buss mellan stationer
  line: string;
  destination: string;
  departureTime: string;
  realTime: string;
  delay: number;
  status: "onTime" | "delayed" | "cancelled";
  platform?: string;
  type: "bus" | "train" | "tram";
}

// Helper functions
function getTransportType(
  mode: string | null | undefined
): "bus" | "train" | "tram" {
  if (!mode) return "bus";

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
      return "bus";
  }
}

function getStatus(delaySeconds: number): "onTime" | "delayed" | "cancelled" {
  if (delaySeconds === 0) return "onTime";
  if (delaySeconds > 0) return "delayed";
  return "early";
}

function convertDepartures(
  trafiklabDepartures: TrafiklabDeparture[]
): Departure[] {
  // Inkludera alla relevanta busslinjerna för Klinga-Norrköping
  const relevantLines = ["480", "482", "486"];

  return trafiklabDepartures
    .filter((dep) => relevantLines.includes(dep.route.designation))
    .map((dep) => ({
      id: dep.trip.trip_id,
      tripId: dep.trip.trip_id, // Samma som id, men tydligare namn
      line: dep.route.designation,
      destination: dep.route.destination.name,
      departureTime: dep.scheduled,
      realTime: dep.realtime,
      delay: dep.delay,
      status: getStatus(dep.delay),
      platform: dep.realtime_platform?.designation || undefined,
      type: getTransportType(dep.route.transport_mode),
    }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  const { stationId } = await params;

  console.log(`🚌 === FETCHING DEPARTURES FOR STATION ${stationId} ===`);

  // Check API key
  const apiKey = process.env.NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY;
  if (!apiKey) {
    console.error(`❌ === TRAFIKLAB API KEY MISSING ===`);
    return NextResponse.json(
      { error: "Trafiklab API key not configured" },
      { status: 500 }
    );
  }

  console.log(`🔑 === API KEY VALIDATION ===`);
  console.log(`🔑 Trafiklab API Key length: ${apiKey.length} characters`);
  console.log(`🔑 API Key prefix: ${apiKey.substring(0, 8)}...`);

  try {
    // Hämta avgångar för idag
    const todayParams = new URLSearchParams({
      key: apiKey,
    });

    const todayUrl = `${BASE_URL}/departures/${stationId}?${todayParams.toString()}`;

    console.log(`🚌 Fetching departures from station ${stationId} (today)`);
    console.log(`🚌 URL: ${todayUrl.replace(apiKey, "***API_KEY***")}`);

    const todayResponse = await fetch(todayUrl);

    if (!todayResponse.ok) {
      const errorText = await todayResponse.text();
      console.error(
        `❌ Today departures API error: ${todayResponse.status} - ${errorText}`
      );
      return NextResponse.json(
        { error: `Departures API failed: ${todayResponse.status}` },
        { status: todayResponse.status }
      );
    }

    const todayData =
      (await todayResponse.json()) as TrafiklabDeparturesResponse;
    let allDepartures = todayData.departures || [];

    console.log(`✅ Found ${allDepartures.length} departures for today`);

    // Använd kombinerad data
    const data = { departures: allDepartures } as TrafiklabDeparturesResponse;
    console.log(
      `✅ Found ${
        data.departures?.length || 0
      } total departures from station ${stationId}`
    );

    // Logga alla linjer som finns
    const allLines = [
      ...new Set(data.departures?.map((dep) => dep.route.designation) || []),
    ];
    console.log(`🚌 All lines found: ${allLines.join(", ")}`);

    // Logga alla destinationer för debugging
    if (data.departures && data.departures.length > 0) {
      console.log(`🚌 Sample departures for debugging:`);
      data.departures.slice(0, 3).forEach((dep, index) => {
        console.log(
          `🚌 Departure ${index + 1}: Line ${dep.route.designation} to ${
            dep.route.destination.name
          } at ${dep.scheduled}`
        );
      });
    }

    const departures = convertDepartures(data.departures || []);
    console.log(
      `🎯 Filtered to ${departures.length} departures (linje 480/482/486)`
    );

    // Deduplicera baserat på tid, destination och linje
    const uniqueDepartures = departures.filter((dep, index, arr) => {
      return (
        arr.findIndex(
          (d) =>
            d.realTime === dep.realTime &&
            d.destination === dep.destination &&
            d.line === dep.line
        ) === index
      );
    });

    console.log(
      `🔄 Deduplicering: ${departures.length} → ${uniqueDepartures.length} avgångar`
    );

    // Sort by departure time and take the next departures
    const sortedDepartures = uniqueDepartures.sort(
      (a, b) => new Date(a.realTime).getTime() - new Date(b.realTime).getTime()
    );

    // Logga antal avgångar
    console.log(
      `📊 Hittade ${sortedDepartures.length} avgångar för station ${stationId}`
    );

    // Ta de närmaste avgångarna (inklusive de som precis gått)
    const finalDepartures = sortedDepartures.slice(0, 10);

    console.log(
      `✅ Returning ${finalDepartures.length} departures for lines 480/482/486`
    );
    finalDepartures.forEach((dep, index) => {
      const delayMinutes = Math.round(dep.delay / 60);
      const delayText =
        delayMinutes !== 0
          ? ` (${delayMinutes > 0 ? "+" : ""}${delayMinutes} min)`
          : "";
      console.log(
        `✅ Departure ${index + 1}: Line ${dep.line} to ${dep.destination} at ${
          dep.realTime
        }${delayText}`
      );
    });

    return NextResponse.json(finalDepartures);
  } catch (error) {
    console.error(`❌ === DEPARTURES API ERROR ===`);
    console.error(`❌ Error:`, error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
