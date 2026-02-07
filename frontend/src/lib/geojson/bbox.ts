export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

function extendBbox(bbox: BBox | null, lng: number, lat: number): BBox {
  if (!bbox) {
    return { minLng: lng, minLat: lat, maxLng: lng, maxLat: lat };
  }
  return {
    minLng: Math.min(bbox.minLng, lng),
    minLat: Math.min(bbox.minLat, lat),
    maxLng: Math.max(bbox.maxLng, lng),
    maxLat: Math.max(bbox.maxLat, lat),
  };
}

function extendFromCoords(bbox: BBox | null, coords: unknown): BBox | null {
  if (!Array.isArray(coords)) return bbox;

  // Leaf: [lng, lat]
  if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
    return extendBbox(bbox, coords[0], coords[1]);
  }

  // Recurse: nested arrays
  let next: BBox | null = bbox;
  for (const child of coords) {
    next = extendFromCoords(next, child);
  }
  return next;
}

export function geometryBbox(geometry: GeoJSON.Geometry | null | undefined): BBox | null {
  if (!geometry) return null;

  switch (geometry.type) {
    case "Point":
    case "MultiPoint":
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      return extendFromCoords(null, geometry.coordinates);
    case "GeometryCollection": {
      let bbox: BBox | null = null;
      for (const g of geometry.geometries) {
        const child = geometryBbox(g);
        if (!child) continue;
        bbox = extendBbox(bbox, child.minLng, child.minLat);
        bbox = extendBbox(bbox, child.maxLng, child.maxLat);
      }
      return bbox;
    }
    default:
      return null;
  }
}

export function bboxToBoundsLike(bbox: BBox): [[number, number], [number, number]] {
  return [
    [bbox.minLng, bbox.minLat],
    [bbox.maxLng, bbox.maxLat],
  ];
}

