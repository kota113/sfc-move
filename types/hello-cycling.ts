// noinspection SpellCheckingInspection
import {Station} from "./gbfs";

export interface StationExtended extends Station {
  name: string;
  num_docks_available: number;
}

export interface ApiResponse {
  stations: Record<"shonandai_west" | "shonandai_east" | "sfc", StationExtended[]>;
  lastUpdatedAt: Date
}
