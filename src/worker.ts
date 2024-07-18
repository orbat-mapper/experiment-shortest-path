import { shortestPath } from "@turf/shortest-path";
import type { WorkerData, WorkerResponse } from "@/types";

onmessage = function (e: MessageEvent<WorkerData>) {
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
