import OLMap from "ol/Map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { View } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { GeoJSON as GeoJSONFormat } from "ol/format";
import type { FeatureCollection, GeoJSON } from "geojson";
import { Modify } from "ol/interaction";
import { createEventHook } from "@vueuse/core";

// Set up sources and layers
const sources = {
  topo4: new XYZ({
    url: "https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4&zoom={z}&x={x}&y={y}",
    attributions: ['<a href="http://www.kartverket.no/">Kartverket</a>']
  }),
  topo4grayscale: new XYZ({
    url: "https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=topo4graatone&zoom={z}&x={x}&y={y}",
    attributions: '<a href="http://www.kartverket.no/">Kartverket</a>'
  }),
  osm: new OSM(),
  satellite: new XYZ({
    transition: 0, // should be set to 0 when opacity is < 1
    attributions:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  })
};
const wayPointsLayer = new VectorLayer({
  source: new VectorSource({}),
  style: {
    "circle-radius": 6,
    "circle-fill-color": "rgba(255,0,0,0.8)"
  }
});

const gjs = new GeoJSONFormat({
  featureProjection: "EPSG:3857",
  dataProjection: "EPSG:4326"
});

const onModifyEventHook = createEventHook<FeatureCollection>();

const obstaclesLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "red" }
});

const preprocessedLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "green", "fill-color": "rgba(188,35,65,0.6)" }
});

const pathLayer = new VectorLayer({
  source: new VectorSource({}),
  style: { "stroke-color": "blue", "stroke-width": 2 }
});

const tileLayerA = new TileLayer({
  source: sources.osm
});

const layers = [tileLayerA, obstaclesLayer, preprocessedLayer, pathLayer, wayPointsLayer];

function drawPath(path: GeoJSON) {
  pathLayer.getSource()?.clear();
  pathLayer.getSource()?.addFeatures(gjs.readFeatures(path));
}

function drawObstacles(obstacles: GeoJSON) {
  obstaclesLayer.getSource()?.clear();
  obstaclesLayer.getSource()?.addFeatures(gjs.readFeatures(obstacles));
}

function drawPreprocessedGeometry(obstacles: GeoJSON) {
  preprocessedLayer.getSource()?.clear();
  preprocessedLayer.getSource()?.addFeatures(gjs.readFeatures(obstacles));
}

function drawWayPoints(wayPoints: GeoJSON) {
  wayPointsLayer.getSource()?.clear();
  wayPointsLayer.getSource()?.addFeatures(gjs.readFeatures(wayPoints));
}

function fitMap() {
  const extent = obstaclesLayer.getSource()?.getExtent();
  extent &&
    olMap.getView().fit(extent, {
      padding: [10, 10, 10, 10]
    });
}

function getWayPoints() {
  return gjs.writeFeaturesObject(wayPointsLayer.getSource()?.getFeatures() || []);
}

const modify = new Modify({
  source: wayPointsLayer.getSource()!
});

modify.on("modifyend", (event) => {
  onModifyEventHook.trigger(getWayPoints());
  console.log("modifyend", event);
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
    onModify: onModifyEventHook.on
  };
}
