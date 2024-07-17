import type { FeatureCollection, GeoJSON, Point, Polygon } from "geojson";

export interface EventData {
  start: Point;
  end: Point;
  resolution?: number;
  bufferValue?: number;
  obstacles: FeatureCollection<Polygon>;
}
