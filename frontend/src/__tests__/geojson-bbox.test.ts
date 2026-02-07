import { describe, it, expect } from "vitest";
import { geometryBbox } from "@/lib/geojson/bbox";

describe("geometryBbox", () => {
  it("computes bbox for a Polygon", () => {
    const geometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-87.7, 41.8],
          [-87.5, 41.8],
          [-87.5, 42.0],
          [-87.7, 42.0],
          [-87.7, 41.8],
        ],
      ],
    };

    const bbox = geometryBbox(geometry);
    expect(bbox).not.toBeNull();
    expect(bbox?.minLng).toBe(-87.7);
    expect(bbox?.maxLng).toBe(-87.5);
    expect(bbox?.minLat).toBe(41.8);
    expect(bbox?.maxLat).toBe(42.0);
  });

  it("computes bbox for a MultiPolygon", () => {
    const geometry: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-88.0, 41.0],
            [-87.9, 41.0],
            [-87.9, 41.1],
            [-88.0, 41.1],
            [-88.0, 41.0],
          ],
        ],
        [
          [
            [-87.0, 42.0],
            [-86.9, 42.0],
            [-86.9, 42.1],
            [-87.0, 42.1],
            [-87.0, 42.0],
          ],
        ],
      ],
    };

    const bbox = geometryBbox(geometry);
    expect(bbox).not.toBeNull();
    expect(bbox?.minLng).toBe(-88.0);
    expect(bbox?.maxLng).toBe(-86.9);
    expect(bbox?.minLat).toBe(41.0);
    expect(bbox?.maxLat).toBe(42.1);
  });
});

