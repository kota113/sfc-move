export type BusScheduleType = "weekday" | "saturday" | "holiday";

export interface BusTimeApiRes {
  time: string;
  scheduleType: BusScheduleType;
  routeCode: string[];
  dest: string;
  start: string;
  additionalInfo: string;
  metadata: string;
}

// New API (sfc-bus-schedule) types
export interface FlatBusStopArrival {
  name: string;
  cumulative_time?: number;
  arrival: { time: number; minute: number };
}

export interface FlatBusEntryMeta {
  stops: FlatBusStopArrival[];
}

export interface FlatBusEntry {
  id: string;
  time: number; // hour
  minute: number; // minute
  scheduleType?: BusScheduleType; // optional for special schedules
  routeCode: string; // e.g., sho19
  routeName: string; // e.g., 湘19
  name: string; // e.g., 湘南台駅西口行
  origin: string; // e.g., 慶応大学
  destination: string; // e.g., 湘南台駅西口
  via?: string;
  metadata: FlatBusEntryMeta;
}

export interface SpecialScheduleMetaItem {
  date: string; // YYYY-MM-DD
  description: string;
  type: string; // e.g., special_20250705
}
