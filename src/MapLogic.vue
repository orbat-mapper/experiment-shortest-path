<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import { buffer } from "@turf/buffer";
import { featureCollection, point, round } from "@turf/helpers";
import { lineIntersect, lineSegment } from "@turf/turf";
import { length as turfLength } from "@turf/length";
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point } from "geojson";

import { useMap } from "@/geo";
import data from "./data/falkland-islands.json";
import Worker from "./worker?worker";
import type { WorkerResponse } from "@/types";
import GithubLink from "@/components/GithubLink.vue";

const {
  drawPath,
  fitMap,
  drawObstacles,
  drawPreprocessedGeometry,
  drawWayPoints,
  getWayPoints,
  onModifyWaypoints,
  drawIntersections
} = useMap();

const isWorking = ref(false);
const resolution = ref(400);
const bufferValue = ref(300);
const panelOpen = ref(true);

const obstacles = data as FeatureCollection<MultiPolygon>;
const calculatedPath = ref<Feature<LineString> | null>(null);
const intersections = ref<FeatureCollection<Point> | null>(null);

const pathLength = computed(() =>
  calculatedPath.value ? round(turfLength(calculatedPath.value, { units: "kilometers" }), 2) : -1
);

const preprocessedObstacles = computed(() => {
  const radius = Math.round(+bufferValue.value);
  if (isNaN(radius)) {
    return obstacles;
  }
  return buffer(obstacles, bufferValue.value, { units: "meters" }) ?? obstacles;
});

const w = new Worker();
w.onmessage = (e: MessageEvent<WorkerResponse>) => {
  const { path } = e.data;
  calculatedPath.value = path;
  isWorking.value = false;
};

const waypoints = featureCollection([
  point([-58.55677448923045, -51.94755355800907]),
  point([-59.01345502988934, -51.79266691194229])
]);

onMounted(() => {
  drawObstacles(obstacles);
  drawPreprocessedGeometry(preprocessedObstacles.value);
  drawWayPoints(waypoints);
  fitMap([50, 50, 50, 50]);
  calculateShortestPath();
});

onModifyWaypoints((param) => {
  calculateShortestPath();
});

watch(calculatedPath, (newPath) => {
  if (!newPath) {
    return;
  }
  intersections.value = lineIntersect(newPath, preprocessedObstacles.value);
});

watchEffect(() => {
  drawPreprocessedGeometry(preprocessedObstacles.value);
  drawIntersections(intersections.value);
  drawPath(calculatedPath.value);
});

function calculateShortestPath() {
  isWorking.value = true;
  const waypointsFeatureCollection = getWayPoints();
  const start = waypointsFeatureCollection.features[0].geometry;
  const end = waypointsFeatureCollection.features[1].geometry;

  w.postMessage({
    start,
    end,
    resolution: resolution.value,
    obstacles: preprocessedObstacles.value
  });
}
</script>

<template>
  <div
    class="absolute top-2 sm:top-6 right-2 sm:right-6 border rounded-md bg-opacity-80 bg-gray-200 p-4 max-w-xs"
  >
    <header class="flex items-center justify-between">
      <GithubLink />
      <div class="flex items-center gap-2">
        <span v-if="isWorking" class="loading loading-dots text-primary"></span>
        <span v-else class="w-6" />
        <button class="btn btn-xs" @click="panelOpen = !panelOpen">Toggle settings</button>
      </div>
    </header>
    <form v-if="panelOpen" class="" @submit.prevent>
      <p class="text-sm mt-2">
        You can drag the start and end markers on the map and change parameters below.
      </p>
      <p class="text-xs font-bold mt-2">Pre-processing</p>
      <div class="divider font-mono text-sm">
        #1
        <a href="https://turfjs.org/docs/api/buffer" target="_blank" class="link"
          >turf.buffer(...)</a
        >
      </div>
      <label class="input input-bordered flex items-center gap-2 input-sm">
        radius:
        <input type="text" class="grow" v-model.lazy="bufferValue" />
      </label>
      <p class="text-xs font-bold mt-4">Processing</p>
      <div class="divider font-mono text-sm">
        #2<a href="https://turfjs.org/docs/api/shortestPath" target="_blank" class="link"
          >turf.shortestPath(...)</a
        >
      </div>
      <label class="input input-bordered flex items-center gap-2 mt-2 input-sm">
        resolution:
        <input type="text" class="grow" v-model="resolution" />
      </label>
      <p class="text-xs font-bold mt-4">Stats</p>
      <table class="table table-xs mt-2">
        <tr>
          <td>Path length</td>
          <td>{{ pathLength }} km</td>
        </tr>
        <tr>
          <td>Intersections</td>
          <td>{{ intersections?.features.length }}</td>
        </tr>
      </table>

      <footer class="flex items-center justify-end mt-4">
        <button type="submit" class="btn btn-xs btn-primary" @click="calculateShortestPath()">
          Find shortest path
        </button>
      </footer>
    </form>
  </div>
</template>
