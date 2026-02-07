/**
 * Unit tests for core service functions in services.ts.
 * These test pure logic directly without going through the API route.
 */

import { describe, it, expect } from "vitest";
import {
  checkJurisdiction,
  getElectedOfficials,
  lookupDistricts,
  getDistrictShapes,
  loadDistricts,
  loadOfficials,
} from "@/lib/services";
import type { Districts } from "@/lib/types";

// Load real data once — these are fast disk reads cached in memory
const districtsData = loadDistricts();
const officialsData = loadOfficials();

describe("checkJurisdiction", () => {
  it("returns true for coordinates inside the sample jurisdiction", () => {
    expect(checkJurisdiction(41.88, -87.63)).toBe(true);
  });

  it("returns true for another in-bounds location", () => {
    expect(checkJurisdiction(39.78, -89.65)).toBe(true);
  });

  it("returns false for out-of-jurisdiction coordinates", () => {
    expect(checkJurisdiction(38.89, -77.03)).toBe(false);
  });

  it("returns false for coordinates north of jurisdiction bounds", () => {
    expect(checkJurisdiction(43.0, -89.0)).toBe(false);
  });

  it("returns false for coordinates south of jurisdiction bounds", () => {
    expect(checkJurisdiction(36.5, -89.0)).toBe(false);
  });

  it("returns false for coordinates east of jurisdiction bounds", () => {
    expect(checkJurisdiction(40.0, -86.0)).toBe(false);
  });

  it("returns false for coordinates west of jurisdiction bounds", () => {
    expect(checkJurisdiction(40.0, -92.0)).toBe(false);
  });
});

describe("getElectedOfficials", () => {
  const sampleDistricts: Districts = {
    congressional: 7,
    state_senate: 3,
    state_house: 6,
    city_ward: 42,
    cook_county: 10,
  };

  it("returns one entry per configured office slot", () => {
    const results = getElectedOfficials(sampleDistricts, officialsData);
    expect(Array.isArray(results)).toBe(true);
    // Current config has 7 slots; this test intentionally fails if slots change without updating.
    expect(results.length).toBe(7);
  });

  it("resolves configured statewide officials from officials.yaml", () => {
    const results = getElectedOfficials(sampleDistricts, officialsData);

    const senate1 = results.find((o) => o.office_id === "us_senate_1");
    const senate2 = results.find((o) => o.office_id === "us_senate_2");

    expect(senate1?.name).toBe("Dick Durbin");
    expect(senate2?.name).toBe("Tammy Duckworth");
  });

  it("returns placeholders for district-based offices not configured in officials.yaml", () => {
    const results = getElectedOfficials(sampleDistricts, officialsData);
    const usHouse = results.find((o) => o.office_id === "us_house");

    expect(usHouse?.district?.layer).toBe("congressional");
    expect(usHouse?.district?.number).toBe(7);
    expect(usHouse?.shape_key).toBe("congressional");
    expect(usHouse?.name).toBeNull();
    expect(typeof usHouse?.note).toBe("string");
  });
});

describe("lookupDistricts", () => {
  it("returns correct districts for downtown sample fixture", () => {
    const districts = lookupDistricts(41.8781, -87.6298, districtsData);
    expect(districts.congressional).not.toBeNull();
    expect(districts.state_senate).not.toBeNull();
    expect(districts.state_house).not.toBeNull();
    expect(districts.city_ward).not.toBeNull();
    expect(districts.cook_county).not.toBeNull();
  });

  it("returns null for city_ward outside the core city fixture (Evanston)", () => {
    const districts = lookupDistricts(42.046292, -87.679702, districtsData);
    expect(districts.city_ward).toBeNull();
    // But should still have legislative districts
    expect(districts.congressional).not.toBeNull();
    expect(districts.state_senate).not.toBeNull();
    expect(districts.state_house).not.toBeNull();
  });

  it("returns all nulls for coordinates outside the configured jurisdiction", () => {
    const districts = lookupDistricts(38.89, -77.03, districtsData);
    expect(districts.congressional).toBeNull();
    expect(districts.state_senate).toBeNull();
    expect(districts.state_house).toBeNull();
    expect(districts.city_ward).toBeNull();
    expect(districts.cook_county).toBeNull();
  });

  it("finds county commissioner district for downtown sample fixture", () => {
    const districts = lookupDistricts(41.8781, -87.6298, districtsData);
    expect(districts.cook_county).not.toBeNull();
    expect(typeof districts.cook_county).toBe("number");
  });

  it("finds Cook County Commissioner district for suburban Cook County", () => {
    // Bridgeview, IL — suburb in Cook County but outside the core city.
    const districts = lookupDistricts(41.7500, -87.8042, districtsData);
    expect(districts.cook_county).not.toBeNull();
    expect(districts.city_ward).toBeNull();
  });
});

describe("getDistrictShapes", () => {
  it("returns simplified geometries for matched districts", () => {
    const districts: Districts = {
      congressional: 7,
      state_senate: 3,
      state_house: 6,
      city_ward: 42,
      cook_county: 10,
    };
    const shapes = getDistrictShapes(districts, districtsData);
    expect(shapes).toHaveProperty("congressional");
    expect(shapes).toHaveProperty("state_senate");
    expect(shapes).toHaveProperty("state_house");
    expect(shapes).toHaveProperty("city_ward");
    expect(shapes).toHaveProperty("cook_county");
  });

  it("includes statewide boundary shape", () => {
    const districts: Districts = {
      congressional: null,
      state_senate: null,
      state_house: null,
      city_ward: null,
      cook_county: null,
    };
    const shapes = getDistrictShapes(districts, districtsData);
    expect(shapes).toHaveProperty("statewide");
    expect(shapes.statewide.type).toMatch(/Polygon|MultiPolygon/);
  });

  it("skips districts with null values", () => {
    const districts: Districts = {
      congressional: 7,
      state_senate: null,
      state_house: null,
      city_ward: null,
      cook_county: null,
    };
    const shapes = getDistrictShapes(districts, districtsData);
    expect(shapes).toHaveProperty("congressional");
    expect(shapes).not.toHaveProperty("state_senate");
    expect(shapes).not.toHaveProperty("city_ward");
    // statewide is always included
    expect(shapes).toHaveProperty("statewide");
  });
});
