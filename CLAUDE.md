# Legislator Lookup

Civic tech app for looking up elected officials by address. Next.js App Router with config-driven, pluggable architecture.

## Commands

All commands run from `frontend/`:

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run test:watch   # Vitest in watch mode
npm run test:fast    # Skip API-dependent tests (excludes lookup-address)
```

## Architecture

- **Next.js App Router** — React 19, Tailwind CSS 4
- **API routes** — `src/app/api/{lookup,autocomplete,reverse,health}/route.ts`
- **Config-driven** — `src/lib/app-config.ts` defines branding, geography, district layers, office slots, geocoding provider, and map provider. `src/lib/config.ts` re-exports derived constants.
- **Pluggable geocoding** — Provider interface in `src/lib/geocoding/types.ts` (`GeocodingClient`). Providers: geocode-earth, mapbox, google-maps, geoapify. Selected via `app-config.ts`.
- **Pluggable maps** — `src/lib/maps/`. Currently protomaps; provider set in `app-config.ts`.
- **District data** — GeoJSON files in `frontend/data/district-maps/<state-slug>/`. Officials in `frontend/data/officials.yaml`.
- **Core types** — `src/lib/types.ts` (Districts, ElectedOfficial, LookupResponse, OfficialConfig)

## Data Flow

Address → geocode (via provider) → bounding-box check → point-in-polygon (Turf.js) per district layer → match officials from `officials.yaml` → return `LookupResponse` with district shapes

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/app-config.ts` | Central config: branding, geography, office slots, providers |
| `src/lib/services.ts` | Server-side logic: geocoding, district lookup, official matching |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/lib/config.ts` | Derived constants from app-config |
| `src/lib/geocoding/` | Geocoding provider abstraction |
| `src/lib/maps/` | Map provider abstraction |
| `data/officials.yaml` | Elected officials data |
| `data/district-maps/` | GeoJSON district boundaries |

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local`:

- `GEOCODE_EARTH_API_KEY` — Server-side geocoding API key
- `NEXT_PUBLIC_PROTOMAPS_API_KEY` — Client-side map tiles key

## Testing

- **Framework**: Vitest + Testing Library + jsdom
- **Test location**: `src/__tests__/`
- **`test:fast`**: Skips `lookup-address.test.ts` which calls the geocoding API
- Tests cover API routes, services, UI components, and validation

## Path Alias

`@/*` maps to `frontend/src/*` (configured in `tsconfig.json`)
