<script setup lang="ts">
import { useMap } from "@/geo";
import data from "./data/falkland-islands.json";
import Worker from "./worker?worker";

import type { FeatureCollection } from "geojson";
import { onMounted, ref } from "vue";
import { buffer, featureCollection, point } from "@turf/turf";

const obstacles = data as FeatureCollection;
const {
  drawPath,
  fitMap,
  drawObstacles,
  drawPreprocessedGeometry,
  drawWayPoints,
  getWayPoints,
  onModify
} = useMap();
const w = new Worker();
const isWorking = ref(false);
const resolution = ref(400);
const bufferValue = ref(100);
const panelOpen = ref(true);

let postObstacles = buffer(obstacles, bufferValue.value, { units: "meters" }) as any;
function doPostObstacles() {
  postObstacles = buffer(obstacles, bufferValue.value, { units: "meters" }) as any;
}
w.onmessage = (e) => {
  const path = e.data;
  drawPath(path);
  isWorking.value = false;
};

const waypoints = featureCollection([
  point([-58.55677448923045, -51.94755355800907]),
  point([-59.01345502988934, -51.79266691194229])
]);

onMounted(() => {
  drawObstacles(obstacles);
  drawPreprocessedGeometry(postObstacles);
  drawWayPoints(waypoints);
  fitMap([50, 50, 50, 50]);
  doPath();
});

onModify((param) => {
  doPath();
});

function doPath() {
  isWorking.value = true;
  const waypointsFeatureCollection = getWayPoints();
  const start = waypointsFeatureCollection.features[0].geometry;
  const end = waypointsFeatureCollection.features[1].geometry;
  doPostObstacles();
  drawPreprocessedGeometry(postObstacles);
  w.postMessage({
    start,
    end,
    resolution: resolution.value,
    obstacles: postObstacles
  });
}
</script>

<template>
  <div
    class="absolute top-2 sm:top-6 right-2 sm:right-6 border rounded-md bg-opacity-80 bg-gray-200 p-4 max-w-xs"
  >
    <header class="flex items-center justify-between">
      <a
        aria-label="Github"
        target="_blank"
        href="https://github.com/orbat-mapper/experiment-shortest-path"
        rel="noopener, noreferrer"
        class="btn btn-sm btn-ghost drawer-button btn-square normal-case"
        ><svg
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          class="inline-block h-5 w-5 fill-current md:h-6 md:w-6"
        >
          <path
            d="M256,32C132.3,32,32,134.9,32,261.7c0,101.5,64.2,187.5,153.2,217.9a17.56,17.56,0,0,0,3.8.4c8.3,0,11.5-6.1,11.5-11.4,0-5.5-.2-19.9-.3-39.1a102.4,102.4,0,0,1-22.6,2.7c-43.1,0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1,1.4-14.1h.1c22.5,2,34.3,23.8,34.3,23.8,11.2,19.6,26.2,25.1,39.6,25.1a63,63,0,0,0,25.6-6c2-14.8,7.8-24.9,14.2-30.7-49.7-5.8-102-25.5-102-113.5,0-25.1,8.7-45.6,23-61.6-2.3-5.8-10-29.2,2.2-60.8a18.64,18.64,0,0,1,5-.5c8.1,0,26.4,3.1,56.6,24.1a208.21,208.21,0,0,1,112.2,0c30.2-21,48.5-24.1,56.6-24.1a18.64,18.64,0,0,1,5,.5c12.2,31.6,4.5,55,2.2,60.8,14.3,16.1,23,36.6,23,61.6,0,88.2-52.4,107.6-102.3,113.3,8,7.1,15.2,21.1,15.2,42.5,0,30.7-.3,55.5-.3,63,0,5.4,3.1,11.5,11.4,11.5a19.35,19.35,0,0,0,4-.4C415.9,449.2,480,363.1,480,261.7,480,134.9,379.7,32,256,32Z"
          ></path></svg
      ></a>
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
      <div class="divider font-mono text-sm">
        <a href="https://turfjs.org/docs/api/buffer" target="_blank" class="link"
          >turf.buffer(...)</a
        >
      </div>
      <label class="input input-bordered flex items-center gap-2 input-sm">
        radius:
        <input type="text" class="grow" v-model="bufferValue" />
      </label>
      <div class="divider font-mono text-sm">
        <a href="https://turfjs.org/docs/api/shortestPath" target="_blank" class="link"
          >turf.shortestPath(...)</a
        >
      </div>
      <label class="input input-bordered flex items-center gap-2 mt-2 input-sm">
        resolution:
        <input type="text" class="grow" v-model="resolution" />
      </label>

      <footer class="flex items-center justify-end mt-4">
        <button type="submit" class="btn btn-xs btn-primary" @click="doPath">
          Find shortest path
        </button>
      </footer>
    </form>
  </div>
</template>
