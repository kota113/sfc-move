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
