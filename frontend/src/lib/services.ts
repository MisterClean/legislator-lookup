import * as turf from "@turf/turf";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { readFileSync } from "fs";
import { join } from "path";
import type { Geometry } from "geojson";
import yaml from "yaml";
import { APP_CONFIG } from "./app-config";
import {
  DISTRICT_LAYER_CONFIGS,
  DISTRICT_LAYER_IDS,
  JURISDICTION_BOUNDS,
  JURISDICTION_BOUNDARY_FILE,
} from "./config";
import { getGeocodingClient } from "./geocoding";
import type {
  Districts,
  DistrictRef,
  ElectedOfficial,
  OfficialConfig,
} from "./types";

type DistrictGeoJSON = FeatureCollection<Polygon | MultiPolygon>;

// Cache for loaded data (server-side only)
let districtsCache: Map<string, DistrictGeoJSON> | null = null;
let officialsCache: OfficialConfig[] | null = null;
let jurisdictionBoundaryCache: Feature<Polygon | MultiPolygon> | null = null;

function getDataPath(pathFromDataDir: string): string {
  return join(process.cwd(), "data", pathFromDataDir);
}

function getDistrictColumnCandidates(layerId: string): string[] {
  const config = DISTRICT_LAYER_CONFIGS[layerId];
  const base = [
    config.numberProperty,
    config.numberProperty.toLowerCase(),
    config.numberProperty.toUpperCase(),
    ...(config.numberPropertyAliases || []),
    "ward",
    "ward_id",
    "WARD",
  ];
  return Array.from(new Set(base));
}

function getDistrictNumberFromFeatureProperties(
  props: Record<string, unknown>,
  layerId: string
): number | null {
  const columns = getDistrictColumnCandidates(layerId);

  for (const col of columns) {
    if (col in props) {
      const val = props[col];
      const parsed = parseInt(String(val), 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function loadDistricts(): Map<string, DistrictGeoJSON> {
  if (districtsCache) return districtsCache;

  districtsCache = new Map();

  for (const [layerId, layerConfig] of Object.entries(DISTRICT_LAYER_CONFIGS)) {
    try {
      const filepath = getDataPath(layerConfig.path);
      const content = readFileSync(filepath, "utf-8");
      const geojson = JSON.parse(content) as DistrictGeoJSON;
      districtsCache.set(layerId, geojson);
      console.log(`Loaded ${layerId}: ${geojson.features.length} districts`);
    } catch (error) {
      console.warn(`Warning: Could not load layer '${layerId}' from ${layerConfig.path}:`, error);
    }
  }

  return districtsCache;
}

export function loadOfficials(): OfficialConfig[] {
  if (officialsCache) return officialsCache;

  try {
    const filepath = getDataPath("officials.yaml");
    const content = readFileSync(filepath, "utf-8");
    const data = yaml.parse(content) as { officials?: OfficialConfig[] } | null;
    officialsCache = data?.officials || [];
    console.log(`Loaded ${officialsCache.length} officials`);
    return officialsCache;
  } catch (error) {
    console.warn("Warning: Could not load officials.yaml:", error);
    return [];
  }
}

function loadJurisdictionBoundary(): Feature<Polygon | MultiPolygon> {
  if (jurisdictionBoundaryCache) return jurisdictionBoundaryCache;

  const filepath = getDataPath(JURISDICTION_BOUNDARY_FILE);
  const content = readFileSync(filepath, "utf-8");
  const geojson = JSON.parse(content) as FeatureCollection<Polygon | MultiPolygon>;
  jurisdictionBoundaryCache = geojson.features[0];
  return jurisdictionBoundaryCache;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  matchedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const geocoder = getGeocodingClient();
  return geocoder.geocodeAddress(address);
}

export function checkJurisdiction(lat: number, lng: number): boolean {
  return (
    lat >= JURISDICTION_BOUNDS.minLat &&
    lat <= JURISDICTION_BOUNDS.maxLat &&
    lng >= JURISDICTION_BOUNDS.minLng &&
    lng <= JURISDICTION_BOUNDS.maxLng
  );
}

function buildEmptyDistrictResult(): Districts {
  return Object.fromEntries(
    DISTRICT_LAYER_IDS.map((layerId) => [layerId, null])
  ) as Districts;
}

export function lookupDistricts(
  lat: number,
  lng: number,
  districtsData: Map<string, DistrictGeoJSON>
): Districts {
  const point = turf.point([lng, lat]); // GeoJSON uses [lng, lat]
  const result = buildEmptyDistrictResult();

  for (const [layerId, geojson] of districtsData.entries()) {
    for (const feature of geojson.features) {
      if (!turf.booleanPointInPolygon(point, feature)) {
        continue;
      }

      const props = (feature.properties || {}) as Record<string, unknown>;
      const districtNumber = getDistrictNumberFromFeatureProperties(props, layerId);
      if (districtNumber !== null) {
        result[layerId] = districtNumber;
      }
      break; // Found the containing district for this layer.
    }
  }

  return result;
}

function buildDistrictRef(layerId: string, number: number): DistrictRef {
  return { layer: layerId, number };
}

function findOfficial(
  officialsData: OfficialConfig[],
  officeId: string,
  district: DistrictRef | null
): OfficialConfig | null {
  for (const candidate of officialsData) {
    if (candidate.office_id !== officeId) continue;

    const candDistrict = candidate.district || null;
    if (district === null && candDistrict === null) return candidate;
    if (
      district !== null &&
      candDistrict !== null &&
      candDistrict.layer === district.layer &&
      candDistrict.number === district.number
    ) {
      return candidate;
    }
  }
  return null;
}

export function getElectedOfficials(
  districts: Districts,
  officialsData: OfficialConfig[]
): ElectedOfficial[] {
  const result: ElectedOfficial[] = [];

  for (const slot of APP_CONFIG.officials.officeSlots) {
    const slotDistrictLayer = slot.districtLayer;

    let district: DistrictRef | null = null;
    let shapeKey: string | null = null;
    let note: string | null = null;

    if (slot.statewide) {
      shapeKey = "statewide";
    } else if (slotDistrictLayer) {
      const districtNumber = districts[slotDistrictLayer];
      if (typeof districtNumber === "number") {
        district = buildDistrictRef(slotDistrictLayer, districtNumber);
        shapeKey = slotDistrictLayer;
      } else {
        // Still return a placeholder slot; UI can render "Unknown district".
        note = `District not resolved for layer '${slotDistrictLayer}'.`;
      }
    } else {
      note = "Office slot is misconfigured (missing statewide or districtLayer).";
    }

    const match = findOfficial(officialsData, slot.id, district);

    if (!match) {
      result.push({
        office_id: slot.id,
        office_label: slot.label,
        name: null,
        district,
        shape_key: shapeKey,
        note: note || "Official not configured for this office/district.",
      });
      continue;
    }

    result.push({
      office_id: slot.id,
      office_label: slot.label,
      name: match.name,
      party: match.party,
      url: match.url,
      phone: match.phone,
      district,
      shape_key: shapeKey,
      note,
    });
  }

  return result;
}

export function getDistrictShapes(
  districts: Districts,
  districtsData: Map<string, DistrictGeoJSON>
): Record<string, Geometry> {
  const shapes: Record<string, Geometry> = {};

  for (const [layerId, geojson] of districtsData.entries()) {
    const districtNumber = districts[layerId];
    if (districtNumber === null) continue;

    for (const feature of geojson.features) {
      const props = (feature.properties || {}) as Record<string, unknown>;
      const candidateNumber = getDistrictNumberFromFeatureProperties(props, layerId);
      if (candidateNumber !== districtNumber) {
        continue;
      }

      const simplified = turf.simplify(feature, { tolerance: 0.002, highQuality: false });
      shapes[layerId] = simplified.geometry;
      break;
    }
  }

  const boundary = loadJurisdictionBoundary();
  const simplified = turf.simplify(boundary, { tolerance: 0.002, highQuality: false });
  shapes.statewide = simplified.geometry;

  return shapes;
}
