import type { MapAdapter, DistrictMapMountOptions } from "./types";
import { bboxToBoundsLike, geometryBbox } from "../geojson/bbox";
import { buildProtomapsStyleUrl } from "./protomaps-style";

type LngLatLike = [number, number];

type MapLibreMapLike = {
  addControl: (control: unknown) => void;
  on: (event: "load", cb: () => void) => void;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  fitBounds: (bounds: unknown, options: { padding: number; duration: number; maxZoom: number }) => void;
  jumpTo: (options: { center: LngLatLike; zoom: number }) => void;
  remove: () => void;
};

type MapLibreMarkerLike = {
  setLngLat: (lngLat: LngLatLike) => MapLibreMarkerLike;
  addTo: (map: MapLibreMapLike) => MapLibreMarkerLike;
  remove: () => void;
};

type MapLibreLike = {
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: LngLatLike;
    zoom: number;
    attributionControl: boolean;
    interactive: boolean;
    dragRotate: boolean;
    pitchWithRotate: boolean;
  }) => MapLibreMapLike;
  Marker: new (options: { color: string }) => MapLibreMarkerLike;
  AttributionControl: new (options: { compact: boolean }) => unknown;
};

function getEnvOrThrow(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return normalized;
}

export function createProtomapsAdapter(config: { style: "light" | "dark" }): MapAdapter {
  const apiKey = getEnvOrThrow("NEXT_PUBLIC_PROTOMAPS_API_KEY", process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY);
  const styleUrl = buildProtomapsStyleUrl(config.style, apiKey);

  return {
    provider: "protomaps",
    mountDistrictMap(options: DistrictMapMountOptions) {
      const maplibregl = (globalThis as unknown as { maplibregl?: unknown }).maplibregl as MapLibreLike | undefined;
      if (!maplibregl) {
        throw new Error("MapLibre GL is not available (expected global 'maplibregl').");
      }

      const id = Math.random().toString(36).slice(2);
      const sourceId = `district-${id}`;
      const fillId = `district-fill-${id}`;
      const lineId = `district-line-${id}`;

      const map = new maplibregl.Map({
        container: options.container,
        style: styleUrl,
        center: [options.focus.lng, options.focus.lat],
        zoom: 9,
        attributionControl: false,
        interactive: false,
        dragRotate: false,
        pitchWithRotate: false,
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }));

      const marker = new maplibregl.Marker({ color: "#2da9d8" })
        .setLngLat([options.focus.lng, options.focus.lat])
        .addTo(map);

      map.on("load", () => {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: options.geometry,
          },
        });

        map.addLayer({
          id: fillId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#e2504a",
            "fill-opacity": 0.18,
          },
        });

        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#e2504a",
            "line-width": 2,
          },
        });

        const bbox = geometryBbox(options.geometry);
        if (bbox) {
          map.fitBounds(bboxToBoundsLike(bbox), {
            padding: 24,
            duration: 0,
            maxZoom: 11,
          });
        } else {
          map.jumpTo({ center: [options.focus.lng, options.focus.lat], zoom: 10 });
        }
      });

      return () => {
        try {
          marker.remove();
        } catch {
          // ignore
        }
        try {
          map.remove();
        } catch {
          // ignore
        }
      };
    },
  };
}
