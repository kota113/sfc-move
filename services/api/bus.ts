import {BusScheduleType, FlatBusEntry, SpecialScheduleMetaItem} from "../../types/busTime";
import {PointId} from "../../types/points";

export type Direction = "from_sfc" | "to_sfc";

export interface NormalizedBusItem {
  destination: string;
  type: "express" | "local";
  time: Date;
}

const BASE = "https://sugijotaro.github.io/sfc-bus-schedule/data/v1";

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getCurrentScheduleType = (): BusScheduleType => {
  const day = new Date().getDay();
  return day === 0 ? "holiday" : day === 6 ? "saturday" : "weekday";
};

export const getDirection = (dep: PointId): Direction => {
  return dep === "shonandai" ? "to_sfc" : "from_sfc";
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.json() as T;
}

export async function getTodaySpecialType(): Promise<string | null> {
  try {
    const metas = await fetchJson<SpecialScheduleMetaItem[]>(`${BASE}/special_schedules.json`);
    const today = toDateStr(new Date());
    const hit = metas.find(m => m.date === today);
    return hit ? hit.type : null;
  } catch (e) {
    // On error (e.g., 404), treat as no special schedule
    return null;
  }
}

export async function fetchFlatEntries(direction: Direction, scheduleType: BusScheduleType) {
  const url = `${BASE}/flat/${direction}_${scheduleType}.json`;
  return fetchJson<FlatBusEntry[]>(url);
}

export async function fetchSpecialEntries(type: string, direction: Direction) {
  const url = `${BASE}/special/${type}/${direction}_sfc.json`;
  return fetchJson<FlatBusEntry[]>(url);
}

export async function loadEntries(direction: Direction, scheduleType: BusScheduleType) {
  const special = await getTodaySpecialType();
  if (special) {
    try {
      return await fetchSpecialEntries(special, direction);
    } catch (_) {
      // fall back to normal if special fetch fails
    }
  }
  return fetchFlatEntries(direction, scheduleType);
}

function matchesStopName(stopName: string, station: "sfc" | "sfcHonkan"): boolean {
  if (station === "sfcHonkan") {
    return stopName.includes("本館");
  }
  // Prefer names that indicate SFC main campus but not honkan
  if (stopName.includes("本館")) return false;
  return stopName.includes("慶応大学") || stopName.includes("慶應大学") || stopName.includes("慶應義塾大学") || stopName.includes("慶応義塾大学");
}

function matchesShonandai(stopName: string): boolean {
  return stopName.includes("湘南台");
}

function getTimeAtTargetStop(entry: FlatBusEntry, direction: Direction, station: "sfc" | "sfcHonkan", arr: PointId): { hour: number; minute: number } | null {
  const stops = entry.metadata?.stops ?? [];

  if (direction === "from_sfc") {
    // Departure from SFC or Honkan
    const departStop = stops.find(s => matchesStopName(s.name, station));
    if (departStop?.arrival) return {hour: departStop.arrival.time, minute: departStop.arrival.minute};
    // Fallback: top-level
    return {hour: entry.time, minute: entry.minute};
  } else {
    // Departure from Shonandai, ensure it reaches target (SFC or Honkan)
    const targetStation: "sfc" | "sfcHonkan" = arr === "sfcHonkan" ? "sfcHonkan" : "sfc";
    const reachesTarget = stops.some(s => matchesStopName(s.name, targetStation));
    if (!reachesTarget) return null;
    const departStop = stops.find(s => matchesShonandai(s.name));
    if (departStop?.arrival) return {hour: departStop.arrival.time, minute: departStop.arrival.minute};
    // Fallback to top-level
    return {hour: entry.time, minute: entry.minute};
  }
}

function isExpress(entry: FlatBusEntry): boolean {
  return !!(
    (entry.routeName && /急/.test(entry.routeName)) ||
    (entry.name && (/急/.test(entry.name) || /急行/.test(entry.name)))
  );
}

export function toUpcoming(items: FlatBusEntry[], opts: { direction: Direction; station: "sfc" | "sfcHonkan"; arr: PointId; now?: Date }): NormalizedBusItem[] {
  const now = opts.now ?? new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const unique = new Set<string>();
  const list: NormalizedBusItem[] = [];

  for (const e of items) {
    const t = getTimeAtTargetStop(e, opts.direction, opts.station, opts.arr);
    if (!t) continue;
    const minutes = t.hour * 60 + t.minute;
    if (minutes < nowMinutes) continue;

    const date = new Date(now);
    date.setHours(t.hour, t.minute, 0, 0);

    const express = isExpress(e);
    const destination = opts.direction === "from_sfc" ? (e.destination || e.name) : (opts.arr === "sfcHonkan" ? "本館前" : "SFC");
    const key = `${date.getTime()}-${destination}-${express ? "express" : "local"}`;
    if (unique.has(key)) continue;
    unique.add(key);
    list.push({
      destination,
      type: express ? "express" : "local",
      time: date,
    });
  }

  list.sort((a, b) => {
    const diff = a.time.getTime() - b.time.getTime();
    if (diff !== 0) return diff;
    return a.type === "express" && b.type !== "express" ? -1 : 1;
  });

  return list.slice(0, 7);
}
