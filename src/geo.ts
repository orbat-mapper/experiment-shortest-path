import OLMap from "ol/Map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON as GeoJSONFormat } from "ol/format";
import type { Feature, FeatureCollection, GeoJSON, Geometry, LineString } from "geojson";
import { Modify } from "ol/interaction";
import { createEventHook } from "@vueuse/core";

// Set up sources and layers
const sources = {
  osm: new OSM()
};
const wayPointsLayer = new VectorLayer({
  source: new VectorSource({}),
  style: {
    "circle-radius": 8,
    "circle-fill-color": "rgba(255,0,0,0.9)",
    "circle-stroke-color": "rgba(19,19,19,0.52)",
    "circle-stroke-width": 2
  }
});

const intersectionsLayer = new VectorLayer({
  source: new VectorSource({}),
  style: {
    "circle-radius": 7,
    "circle-stroke-color": "#fff248",
    "circle-stroke-width": 3
  }
});

const gjs = new GeoJSONFormat({
  featureProjection: "EPSG:3857",
  dataProjection: "EPSG:4326"
});

const onModifyEventHook = createEventHook<FeatureCollection>();

const obstaclesLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "green", "stroke-width": 2 }
});

const preprocessedLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "red", "fill-color": "rgba(188,35,65,0.6)" }
});

const pathLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "blue", "stroke-width": 3 }
});

const postprocessedLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "#ff002e", "stroke-width": 3 }
});

const tileLayerA = new TileLayer({
  source: sources.osm
});

const layers = [
  tileLayerA,
  preprocessedLayer,
  obstaclesLayer,
  pathLayer,
  postprocessedLayer,
  wayPointsLayer,
  intersectionsLayer
];

function drawGeoJsonLayer<T extends GeoJSON>(layer: VectorLayer<any>, geoJson?: T | null) {
  layer.getSource()?.clear();
  geoJson && layer.getSource()?.addFeatures(gjs.readFeatures(geoJson));
}

function drawPath(path?: Feature<LineString> | null) {
  drawGeoJsonLayer(pathLayer, path);
}

function drawObstacles(obstacles: GeoJSON) {
  drawGeoJsonLayer(obstaclesLayer, obstacles);
}

function drawPreprocessedGeometry(obstacles: GeoJSON) {
  drawGeoJsonLayer(preprocessedLayer, obstacles);
}

function drawPostprocessedGeometry(path?: Feature<LineString> | null) {
  drawGeoJsonLayer(postprocessedLayer, path);
}

function drawWayPoints(wayPoints?: GeoJSON) {
  drawGeoJsonLayer(wayPointsLayer, wayPoints);
}

function drawIntersections(intersections?: GeoJSON | null) {
  drawGeoJsonLayer(intersectionsLayer, intersections);
}

function fitMap(padding = [10, 10, 10, 10]) {
  const extent = obstaclesLayer.getSource()?.getExtent();
  extent &&
    olMap.getView().fit(extent, {
      padding
    });
}

function getWayPoints() {
  return gjs.writeFeaturesObject(wayPointsLayer.getSource()?.getFeatures() || []);
}

const modify = new Modify({
  source: wayPointsLayer.getSource()!,
  pixelTolerance: 40
});

modify.on("modifyend", (event) => {
  onModifyEventHook.trigger(getWayPoints());
});

const olMap = new OLMap({
  layers,
  view: new View({ center: [0, 0], zoom: 2 })
});

olMap.addInteraction(modify);

export function useMap(target?: string | HTMLElement) {
  if (target) olMap.setTarget(target);
  return {
    olMap,
    gjs,
    drawPath,
    fitMap,
    drawObstacles,
    drawPreprocessedGeometry,
    drawWayPoints,
    getWayPoints,
    onModifyWaypoints: onModifyEventHook.on,
    drawIntersections,
    drawPostprocessedGeometry
  };
}
