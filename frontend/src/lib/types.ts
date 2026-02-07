export interface Coordinates {
  lat: number;
  lng: number;
}

export type Districts = Record<string, number | null>;

export interface DistrictRef {
  layer: string;
  number: number;
}

export interface ElectedOfficial {
  office_id: string;
  office_label: string;
  name: string | null;
  party?: string;
  url?: string;
  phone?: string;
  district?: DistrictRef | null;
  // Used by the UI to pick a shape out of `district_shapes` for map rendering.
  // Typically a district layer id (ex: "congressional") or "statewide".
  shape_key: string | null;
  note?: string | null;
}

export interface LookupResponse {
  address_used: string | null;
  coordinates: Coordinates;
  districts: Districts;
  officials: ElectedOfficial[];
  district_shapes?: Record<string, GeoJSON.Geometry>;
}

export interface OfficialConfig {
  office_id: string;
  name: string;
  party?: string;
  url?: string;
  phone?: string;
  district?: DistrictRef;
}

export interface AutocompleteSuggestion {
  address: string;
  lat: number;
  lng: number;
}
