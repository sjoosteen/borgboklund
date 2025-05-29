import { NextResponse } from "next/server";
import { fetchGardenData } from "../../../lib/api/smhi-garden";

export async function GET() {
  try {
    console.log("🌱 API: Hämtar trädgårdsdata från SMHI...");
    
    const gardenData = await fetchGardenData();
    
    console.log("✅ API: Trädgårdsdata hämtad framgångsrikt");
    
    return NextResponse.json(gardenData);
  } catch (error) {
    console.error("❌ API: Fel vid hämtning av trädgårdsdata:", error);
    
    return NextResponse.json(
      { error: "Kunde inte hämta trädgårdsdata" },
      { status: 500 }
    );
  }
}
