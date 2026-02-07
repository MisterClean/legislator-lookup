import { APP_CONFIG } from "../app-config";
import type { MapAdapter } from "./types";
import { createUnsupportedAdapter } from "./unsupported";

export async function getMapAdapter(): Promise<MapAdapter> {
  switch (APP_CONFIG.maps.provider) {
    case "protomaps": {
      // Dynamic import keeps maplibre (and other browser-only deps) out of the Node test environment.
      const { createProtomapsAdapter } = await import("./protomaps");
      return createProtomapsAdapter(APP_CONFIG.maps.protomaps);
    }
    case "mapbox":
      return createUnsupportedAdapter("mapbox");
    case "google-maps":
      return createUnsupportedAdapter("google-maps");
    default:
      return createUnsupportedAdapter("protomaps");
  }
}

export type { MapAdapter, MapProviderName, DistrictMapMountOptions } from "./types";
