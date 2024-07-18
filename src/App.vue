<script setup lang="ts">
import { useMap } from "@/geo";
import { onMounted, ref } from "vue";
import MapLogic from "@/MapLogic.vue";

const mapInitialized = ref(false);

onMounted(async () => {
  const { olMap } = useMap("map-container");
  olMap.getView().setCenter([0, 0]);
  mapInitialized.value = true;
});
</script>

<template>
  <div id="map-container" class="w-full h-full"></div>
  <MapLogic v-if="mapInitialized" />
</template>
