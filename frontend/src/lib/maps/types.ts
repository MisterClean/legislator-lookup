import type { Coordinates } from "../types";

export type MapProviderName = "protomaps" | "mapbox" | "google-maps";

export interface DistrictMapMountOptions {
  container: HTMLElement;
  geometry: GeoJSON.Geometry;
  focus: Coordinates;
}

export interface MapAdapter {
  provider: MapProviderName;
  mountDistrictMap(options: DistrictMapMountOptions): () => void;
}

