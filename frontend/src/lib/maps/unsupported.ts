import type { MapAdapter, MapProviderName } from "./types";

export function createUnsupportedAdapter(provider: MapProviderName): MapAdapter {
  return {
    provider,
    mountDistrictMap() {
      throw new Error(
        `Map provider '${provider}' is not implemented. Switch APP_CONFIG.maps.provider to 'protomaps' or implement an adapter.`
      );
    },
  };
}

