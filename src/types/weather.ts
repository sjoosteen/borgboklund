export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    weatherSymbol: number;
    description: string;
  };
  forecast: WeatherForecast[];
  warnings: WeatherWarning[];
}

export interface WeatherForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  weatherSymbol: number;
  description: string;
}

export interface WeatherWarning {
  id: string;
  title: string;
  description: string;
  severity: "minor" | "moderate" | "severe" | "extreme";
  validFrom: string;
  validTo: string;
}

export interface SMHIResponse {
  timeSeries: Array<{
    validTime: string;
    parameters: Array<{
      name: string;
      levelType: string;
      level: number;
      unit: string;
      values: number[];
    }>;
  }>;
}

export interface SMHIWarningsResponse {
  alert: Array<{
    identifier: string;
    info: Array<{
      headline: string;
      description: string;
      severity: string;
      effective: string;
      expires: string;
    }>;
  }>;
}
