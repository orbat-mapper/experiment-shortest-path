import { shortestPath } from "@turf/turf";
import type { EventData } from "@/types";

onmessage = function (e: MessageEvent<EventData>) {
  console.log("This is it", e.data);

  const { start, end, resolution = 1000, obstacles } = e.data;
  const path = shortestPath(start, end, {
    obstacles,
    resolution,
    units: "meters"
  });
  postMessage(path);
};

export default class Worker {}
