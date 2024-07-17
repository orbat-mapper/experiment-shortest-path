import { shortestPath } from "@turf/turf";
import type { WorkerData, WorkerResponse } from "@/types";

onmessage = function (e: MessageEvent<WorkerData>) {
  console.log("This is it", e.data);

  const { start, end, resolution = 1000, obstacles } = e.data;
  const path = shortestPath(start, end, {
    obstacles,
    resolution,
    units: "meters"
  });
  const response: WorkerResponse = { path };
  postMessage(response);
};

export default class Worker {}
