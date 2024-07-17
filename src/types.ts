import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";

export interface WorkerData {
  start: Point;
  end: Point;
  resolution?: number;
  bufferValue?: number;
  obstacles: FeatureCollection<Polygon>;
}

export interface WorkerResponse {
  path: Feature<LineString>;
}
