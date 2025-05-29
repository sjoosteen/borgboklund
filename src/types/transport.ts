export interface TransportData {
  departures: Departure[];
  arrivals: Arrival[];
}

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
  isFallback?: boolean;
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

export interface ResRobotResponse {
  Departure?: Array<{
    name: string;
    type: string;
    stop: string;
    time: string;
    date: string;
    rtTime?: string;
    rtDate?: string;
    track?: string;
    direction: string;
  }>;
  Arrival?: Array<{
    name: string;
    type: string;
    stop: string;
    time: string;
    date: string;
    rtTime?: string;
    rtDate?: string;
    track?: string;
    origin: string;
  }>;
}
