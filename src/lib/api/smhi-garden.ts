// SMHI API för trädgårdsdata
// Helt gratis - ingen registrering behövs!

export interface GardenData {
  soilTemperature: number;
  airTemperature: {
    current: number;
    min: number;
    max: number;
  };
  precipitation: number;
  humidity: number;
  windSpeed: number;
  sunHours: number;
  frostRisk: boolean;
  lastFrostDate: string | null;
  plantingAdvice: string[];
  seasonalTips: string[];
}

interface SMHIParameter {
  name: string;
  levelType: string;
  level: number;
  unit: string;
  values: number[]; // SMHI returnerar bara en array med nummer
}

interface SMHIResponse {
  approvedTime: string;
  referenceTime: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  timeSeries: Array<{
    validTime: string;
    parameters: SMHIParameter[];
  }>;
}

// Norrköping koordinater
const NORRKOPING_LAT = 58.5877;
const NORRKOPING_LON = 16.1826;

// SMHI API URL för punktprognos
const SMHI_API_URL = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${NORRKOPING_LON}/lat/${NORRKOPING_LAT}/data.json`;

function getParameterValue(
  parameters: SMHIParameter[],
  parameterName: string
): number | null {
  const param = parameters.find((p) => p.name === parameterName);
  return param && param.values && param.values.length > 0
    ? param.values[0]
    : null;
}

function calculateSoilTemperature(airTemp: number): number {
  // Beräkna rimlig jordtemperatur baserat på lufttemperatur och säsong
  const now = new Date();
  const month = now.getMonth(); // 0-11

  // Jordtemperatur är vanligtvis 2-5°C lägre än lufttemperatur beroende på säsong
  let tempDiff: number;

  if (month >= 4 && month <= 9) {
    // Maj-Oktober (växtsäsong)
    tempDiff = 2; // Mindre skillnad under växtsäsong
  } else if (month >= 2 && month <= 3) {
    // Mars-April (vårens början)
    tempDiff = 4; // Jorden är fortfarande kall
  } else {
    // November-Februari (vinter)
    tempDiff = 3; // Jorden håller värme bättre än luften
  }

  const soilTemp = airTemp - tempDiff;

  // Säkerställ rimliga värden för Norrköping
  return Math.max(-10, Math.min(25, soilTemp));
}

function calculateFrostRisk(minTemp: number, currentTemp: number): boolean {
  // Risk för frost om mintemperatur under 2°C eller nuvarande temp under 4°C
  return minTemp <= 2 || currentTemp <= 4;
}

function getLastFrostDate(): string | null {
  // Beräkna ungefärligt sista frostdatum baserat på säsong
  const now = new Date();
  const year = now.getFullYear();

  // Typiska sista frostdatum för Norrköping (zon 3)
  if (now.getMonth() < 4) {
    // Före maj
    return `${year}-04-20`; // Ungefär 20 april
  } else if (now.getMonth() === 4 && now.getDate() < 20) {
    // Tidigt i maj
    return `${year}-04-20`;
  } else {
    return `${year}-04-15`; // Frost redan passerad
  }
}

function getPlantingAdvice(
  soilTemp: number,
  airTemp: number,
  frostRisk: boolean
): string[] {
  const advice: string[] = [];

  if (frostRisk) {
    advice.push("⚠️ Frostrisik - vänta med känsliga växter");
    advice.push("🛡️ Täck över plantor på natten");
  }

  if (soilTemp < 8) {
    advice.push("🌱 För kallt för potatis (vänta till 8°C)");
  } else if (soilTemp >= 8 && soilTemp < 12) {
    advice.push("🥔 Bra tid för potatis-plantering");
  }

  if (soilTemp >= 10) {
    advice.push("🌿 Bra tid för de flesta grönsaker");
  }

  if (airTemp >= 15 && !frostRisk) {
    advice.push("🌺 Säkert att plantera ut sommarblommor");
  }

  if (advice.length === 0) {
    advice.push("🌱 Kontrollera väderprognosen innan plantering");
  }

  return advice;
}

function getSeasonalTips(): string[] {
  const now = new Date();
  const month = now.getMonth(); // 0-11

  switch (month) {
    case 2: // Mars
      return [
        "🌱 Förkultivera tomater och paprika inomhus",
        "🧅 Plantera lök och vitlök",
        "✂️ Beskär fruktträd",
      ];
    case 3: // April
      return [
        "🥬 Så spenat och rädisa i växthus",
        "🌿 Förbered odlingsbäddar",
        "🌸 Plantera ut härdiga växter",
      ];
    case 4: // Maj
      return [
        "🥔 Plantera potatis när jorden är varm",
        "🌱 Så morötter och ärtor direkt",
        "🌺 Plantera ut efter sista frost",
      ];
    case 5: // Juni
      return [
        "🍅 Plantera ut tomater och gurkor",
        "💧 Börja regelbunden vattning",
        "🌿 Så bönor och squash",
      ];
    case 6: // Juli
      return [
        "💧 Vattna regelbundet i värmen",
        "🥒 Skörda tidiga grönsaker",
        "🌱 Så höstgrönsaker",
      ];
    case 7: // Augusti
      return [
        "🍅 Skörda tomater och gurkor",
        "🌱 Så vintergrönsaker",
        "💧 Extra vattning vid torka",
      ];
    case 8: // September
      return [
        "🍎 Skörda äpplen och päron",
        "🥔 Skörda potatis",
        "🌱 Plantera vinterlök",
      ];
    case 9: // Oktober
      return [
        "🍂 Rensa och kompostera",
        "🌿 Skörda rotfrukter",
        "🛡️ Förbered för vintern",
      ];
    case 10: // November
      return [
        "🍂 Sista skörd av kål",
        "🛡️ Täck känsliga växter",
        "📋 Planera nästa års odling",
      ];
    case 11: // December
      return [
        "📚 Läs odlingsböcker",
        "🌱 Beställ frön för nästa år",
        "🛠️ Underhåll trädgårdsverktyg",
      ];
    case 0: // Januari
      return [
        "📋 Planera årets odling",
        "🌱 Beställ frön och plantor",
        "🛠️ Reparera växthus",
      ];
    case 1: // Februari
      return [
        "🌱 Förkultivera chili och paprika",
        "💡 Kontrollera belysning i växthus",
        "📚 Läs om nya odlingsmetoder",
      ];
    default:
      return ["🌱 Kontrollera väderprognosen för trädgårdsarbete"];
  }
}

export async function fetchGardenData(): Promise<GardenData> {
  try {
    console.log("🌱 Hämtar SMHI-data för trädgård...");

    const response = await fetch(SMHI_API_URL);

    if (!response.ok) {
      throw new Error(`SMHI API error: ${response.status}`);
    }

    const data: SMHIResponse = await response.json();

    // Ta första timserien (närmaste prognos)
    const currentForecast = data.timeSeries[0];
    const todayForecasts = data.timeSeries.slice(0, 24); // Första 24 timmarna

    if (!currentForecast) {
      throw new Error("Ingen prognosdata tillgänglig");
    }

    // Extrahera parametrar
    const currentTemp = getParameterValue(currentForecast.parameters, "t") || 0;
    const soilTemp = calculateSoilTemperature(currentTemp);
    const humidity = getParameterValue(currentForecast.parameters, "r") || 70;
    const windSpeed = getParameterValue(currentForecast.parameters, "ws") || 3;
    const precipitation =
      getParameterValue(currentForecast.parameters, "pcat") || 0;

    // Beräkna min/max temperatur för dagen
    let minTemp = currentTemp;
    let maxTemp = currentTemp;
    let totalSunHours = 0;

    todayForecasts.forEach((forecast) => {
      const temp = getParameterValue(forecast.parameters, "t");
      if (temp !== null) {
        minTemp = Math.min(minTemp, temp);
        maxTemp = Math.max(maxTemp, temp);
      }

      // Uppskatta solskenstimmar baserat på molnighet
      const cloudCover =
        getParameterValue(forecast.parameters, "tcc_mean") || 50;
      const sunFactor = Math.max(0, (100 - cloudCover) / 100);
      totalSunHours += sunFactor;
    });

    const frostRisk = calculateFrostRisk(minTemp, currentTemp);
    const lastFrostDate = getLastFrostDate();
    const plantingAdvice = getPlantingAdvice(soilTemp, currentTemp, frostRisk);
    const seasonalTips = getSeasonalTips();

    console.log(
      `✅ SMHI trädgårdsdata hämtad - Jordtemp: ${soilTemp}°C, Frost: ${frostRisk}`
    );

    return {
      soilTemperature: Math.round(soilTemp * 10) / 10,
      airTemperature: {
        current: Math.round(currentTemp * 10) / 10,
        min: Math.round(minTemp * 10) / 10,
        max: Math.round(maxTemp * 10) / 10,
      },
      precipitation: Math.round(precipitation * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10,
      sunHours: Math.round(totalSunHours * 10) / 10,
      frostRisk,
      lastFrostDate,
      plantingAdvice,
      seasonalTips,
    };
  } catch (error) {
    console.error("❌ Fel vid hämtning av SMHI trädgårdsdata:", error);

    // Fallback med rimliga värden
    return {
      soilTemperature: 6.0,
      airTemperature: {
        current: 8.0,
        min: 4.0,
        max: 12.0,
      },
      precipitation: 0.0,
      humidity: 75,
      windSpeed: 3.5,
      sunHours: 6.0,
      frostRisk: true,
      lastFrostDate: "2025-04-20",
      plantingAdvice: [
        "⚠️ SMHI-data ej tillgänglig",
        "🌱 Kontrollera väderprognosen",
      ],
      seasonalTips: getSeasonalTips(),
    };
  }
}
