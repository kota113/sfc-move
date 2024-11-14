export type PointId = "sfc" | "shonandai" | "sfcHonkan";

export interface Point {
  id: PointId;
  name: string;
}

export const points: Record<PointId, Point> = {
  sfc: {
    id: "sfc",
    name: "SFC"
  },
  sfcHonkan: {
    id: "sfcHonkan",
    name: "本館前"
  },
  shonandai: {
    id: "shonandai",
    name: "湘南台駅"
  }
}
