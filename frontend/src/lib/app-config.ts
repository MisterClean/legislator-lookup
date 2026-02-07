import type { GeocodingProviderName } from "./geocoding/types";

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface FocusPoint {
  lat: number;
  lng: number;
}

interface DistrictLayerConfig {
  label: string;
  path: string;
  numberProperty: string;
  numberPropertyAliases?: string[];
}

interface OfficeSlotConfig {
  id: string;
  label: string;
  // If set, this slot is resolved based on the user's district for the configured layer.
  districtLayer?: string;
  // If set, this slot is statewide (no district-based lookup).
  statewide?: boolean;
}

interface AppConfig {
  branding: {
    orgName: string;
    headerSubtitle: string;
    footerBlurb: string;
    attributionName: string;
    attributionUrl: string;
  };
  geography: {
    jurisdictionName: string;
    countryCode: string;
    state: {
      code: string;
      name: string;
      slug: string;
    };
    bounds: Bounds;
    focusPoint: FocusPoint;
    districtMapPack: {
      root: string;
      boundaryPath: string;
      layers: Record<string, DistrictLayerConfig>;
    };
  };
  geocoding: {
    provider: GeocodingProviderName;
    autocompleteLimit: number;
  };
  officials: {
    officeSlots: OfficeSlotConfig[];
  };
  maps: {
    provider: "protomaps" | "mapbox" | "google-maps";
    protomaps: {
      // One of Protomaps hosted styles.
      style: "light" | "dark";
    };
  };
  ui: {
    showDistrictShapes: boolean;
  };
}

// Headless configuration:
// 1) Set the target state metadata and bounds below.
// 2) Add district maps under frontend/data/district-maps/<state-slug>/...
// 3) Map district layers here so officials can reference district layer IDs.
const STATE_SLUG = "illinois";
const DISTRICT_MAP_ROOT = `district-maps/${STATE_SLUG}`;

export const APP_CONFIG: AppConfig = {
  branding: {
    orgName: "Civic Atlas Labs",
    headerSubtitle: "Find your elected officials in seconds",
    footerBlurb: "Headless, self-hostable elected official lookup for civic orgs",
    attributionName: "Civic Atlas Labs",
    attributionUrl: "https://github.com/civic-atlas-labs",
  },
  geography: {
    jurisdictionName: "Illinois (Sample Pack)",
    countryCode: "US",
    state: {
      code: "IL",
      name: "Illinois",
      slug: STATE_SLUG,
    },
    bounds: {
      minLat: 36.97,
      maxLat: 42.51,
      minLng: -91.51,
      maxLng: -87.02,
    },
    focusPoint: { lat: 41.8781, lng: -87.6298 },
    districtMapPack: {
      root: DISTRICT_MAP_ROOT,
      boundaryPath: `${DISTRICT_MAP_ROOT}/boundary/boundary.geojson`,
      layers: {
        congressional: {
          label: "Congressional",
          path: `${DISTRICT_MAP_ROOT}/congressional/districts.geojson`,
          numberProperty: "CD119FP",
          numberPropertyAliases: ["cd119fp"],
        },
        state_senate: {
          label: "State Senate",
          path: `${DISTRICT_MAP_ROOT}/state_senate/districts.geojson`,
          numberProperty: "SLDUST",
          numberPropertyAliases: ["sldust"],
        },
        state_house: {
          label: "State House",
          path: `${DISTRICT_MAP_ROOT}/state_house/districts.geojson`,
          numberProperty: "SLDLST",
          numberPropertyAliases: ["sldlst"],
        },
        city_ward: {
          label: "City Ward",
          path: `${DISTRICT_MAP_ROOT}/chicago_ward/districts.geojson`,
          numberProperty: "ward",
          numberPropertyAliases: ["ward", "ward_id", "WARD"],
        },
        cook_county: {
          label: "Cook County",
          path: `${DISTRICT_MAP_ROOT}/cook_county/districts.geojson`,
          numberProperty: "DISTRICT_INT",
          numberPropertyAliases: ["district_int"],
        },
      },
    },
  },
  geocoding: {
    provider: "geocode-earth",
    autocompleteLimit: 8,
  },
  officials: {
    // These slots drive the UI and API response ordering.
    officeSlots: [
      { id: "us_senate_1", label: "US Senator", statewide: true },
      { id: "us_senate_2", label: "US Senator", statewide: true },
      { id: "us_house", label: "US Representative", districtLayer: "congressional" },
      { id: "state_senate", label: "State Senator", districtLayer: "state_senate" },
      { id: "state_house", label: "State Representative", districtLayer: "state_house" },
      { id: "city_council", label: "City Council", districtLayer: "city_ward" },
      { id: "county_commissioner", label: "County Commissioner", districtLayer: "cook_county" },
    ],
  },
  maps: {
    provider: "protomaps",
    protomaps: { style: "light" },
  },
  ui: {
    // Required for district map embeds on the landing page.
    showDistrictShapes: true,
  },
};
