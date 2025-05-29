import { NextRequest, NextResponse } from "next/server";

// Trafiklab Realtime Stop Lookup API
const BASE_URL = "https://realtime-api.trafiklab.se/v1";

interface TrafiklabStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface TrafiklabStopGroup {
  id: string;
  name: string;
  area_type: string;
  average_daily_stop_times: number;
  transport_modes: string[];
  stops: TrafiklabStop[];
}

interface TrafiklabStopLookupResponse {
  timestamp: string;
  query: {
    queryTime: string;
    query: string;
  };
  stop_groups: TrafiklabStopGroup[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  console.log(`🔍 === STOP LOOKUP REQUEST ===`);
  console.log(`🔍 Query: "${query}"`);

  // Check API key
  const apiKey = process.env.NEXT_PUBLIC_TRAFIKLAB_REALTIME_API_KEY;
  if (!apiKey) {
    console.error(`❌ === TRAFIKLAB API KEY MISSING ===`);
    return NextResponse.json(
      { error: "Trafiklab API key not configured" },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
    });

    const url = `${BASE_URL}/stops/name/${encodeURIComponent(
      query
    )}?${params.toString()}`;

    console.log(`🔗 === TRAFIKLAB STOP LOOKUP REQUEST ===`);
    console.log(`🔗 URL: ${url.replace(apiKey, "***API_KEY***")}`);

    const response = await fetch(url);

    console.log(`📡 === TRAFIKLAB STOP LOOKUP RESPONSE ===`);
    console.log(`📡 Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Stop lookup error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Stop lookup failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as TrafiklabStopLookupResponse;

    console.log(`✅ === STOP LOOKUP SUCCESS ===`);
    console.log(`✅ Stop groups found: ${data.stop_groups?.length || 0}`);

    if (data.stop_groups) {
      data.stop_groups.forEach((group, index) => {
        console.log(`✅ Stop Group ${index + 1}:`, {
          name: group.name,
          id: group.id,
          area_type: group.area_type,
          transport_modes: group.transport_modes,
          stops_count: group.stops.length,
        });

        // Also log individual stops
        group.stops.forEach((stop, stopIndex) => {
          console.log(`  ✅ Stop ${stopIndex + 1}:`, {
            name: stop.name,
            id: stop.id,
            lat: stop.lat,
            lon: stop.lon,
          });
        });
      });
    }

    return NextResponse.json(data.stop_groups || []);
  } catch (error) {
    console.error(`❌ === STOP LOOKUP ERROR ===`);
    console.error(`❌ Error:`, error);

    return NextResponse.json(
      { error: "Internal server error during stop lookup" },
      { status: 500 }
    );
  }
}
