---
name: fork-and-customize
description: >
  Interactive guide to fork and customize this legislator lookup app for a new organization,
  jurisdiction, and set of elected officials. Walks through branding, district maps, officials
  roster, geocoding provider selection, map provider, and deployment. Use when someone wants to
  repurpose this app for their org.
argument-hint: "[org-name or website URL]"
---

# Fork & Customize — Legislator Lookup

You are helping a user fork and customize the **legislator-lookup** repository for their own
organization and jurisdiction. This is a headless Next.js full-stack app that lets a civic org
show visitors who their elected officials are based on their address.

Work through the sections below **in order**. Each section has a goal and a set of questions to
ask. Do not skip ahead — wait for the user's answers before proceeding. Summarize what you will
change at the end of each section before making edits.

---

## Phase 0 — Orientation

Before you start, make sure you understand the repo layout. The key files you will be editing:

| File | Purpose |
|------|---------|
| `frontend/src/lib/app-config.ts` | **Central config hub** — branding, geography, district layers, office slots, geocoding provider, map provider |
| `frontend/src/app/globals.css` | Color theme (Tailwind CSS 4 `@theme inline` block) |
| `frontend/src/app/layout.tsx` | Fonts and HTML metadata |
| `frontend/src/app/page.tsx` | Main UI — header, address input, official cards, footer |
| `frontend/data/officials.yaml` | The officials roster dataset |
| `frontend/data/district-maps/<state-slug>/` | GeoJSON boundary and district shapefiles |
| `frontend/src/lib/geocoding/providers.ts` | Geocoding provider implementations |
| `frontend/src/lib/geocoding/types.ts` | `GeocodingProviderName` union type |
| `frontend/src/lib/geocoding/index.ts` | Provider factory |
| `frontend/src/lib/maps/` | Map provider abstraction (protomaps, mapbox, google-maps) |
| `Dockerfile` | Docker production build |
| `railway.toml` | Railway deployment config |

Read `frontend/src/lib/app-config.ts` first — it is the single source of truth that drives
everything else.

---

## Phase 1 — Organization Branding

**Goal:** Re-skin the app for the user's organization.

### Questions to ask

1. **Do you have an existing website I can view to pull branding from?** (colors, logo, fonts,
   tone). If yes, use WebFetch to visit the site and extract:
   - Primary, secondary, and accent colors
   - Font families (display + body)
   - Organization name and tagline
   - Any logo or favicon assets

2. **Do you have a source code repo** for your existing site that I can review for design tokens
   or a style guide?

3. If neither, ask for:
   - Organization name
   - A one-line subtitle / tagline for the header (default: "Find your elected officials in seconds")
   - Footer blurb text
   - Attribution name and URL
   - Preferred color palette (or ask if the defaults are fine)

### What to change

Once you have the answers, update these files:

#### `frontend/src/lib/app-config.ts` — `branding` section

```typescript
branding: {
  orgName: "<org name>",
  headerSubtitle: "<subtitle>",
  footerBlurb: "<footer blurb>",
  attributionName: "<attribution>",
  attributionUrl: "<url>",
},
```

#### `frontend/src/app/globals.css` — color theme

The color theme lives in the `@theme inline` block. The key tokens:

```css
@theme inline {
  --color-ink: #122641;          /* primary dark — header, buttons, text */
  --color-ink-soft: #1a355c;     /* slightly lighter dark — button hover */
  --color-accent-sky: #2da9d8;   /* accent — links, location button, decorative */
  --color-accent-coral: #e2504a; /* secondary accent — errors, borders */
  --color-warm: #f7f3ea;         /* page background */
  --color-concrete: #e9e4d9;     /* borders, dividers */
  --color-steel: #64748b;        /* muted text */
  --color-steel-light: #94a3b8;  /* lighter muted text */
  --color-surface: #ffffff;      /* card backgrounds */
}
```

Also update the `body` background-color and dot pattern color in the same file to match
`--color-warm` and `--color-ink`.

#### `frontend/src/app/layout.tsx` — fonts

The app uses two Google Fonts loaded via `next/font/google`:

- `Space_Grotesk` — display font (headings, org name, labels)
- `Source_Sans_3` — body font (everything else)

If the org has specific fonts, swap them here. If their fonts are not on Google Fonts, switch to
`next/font/local` and place font files in `frontend/public/fonts/`.

#### `frontend/src/app/page.tsx` — UI copy and structure

This is a single-file React component (~640 lines). Key areas to customize:

- **Header block** (~line 340-365): org name with decorative stars, subtitle, coral accent bar
- **"Find Your Officials" card** (~line 366-500): section heading, button labels
- **Official result cards** (~line 545-600): office label, party badge, website/phone links
- **Footer** (~line 613-640): org name, blurb, attribution link, decorative diamonds

The decorative elements (stars `✶`, diamonds `◆`, grid overlay) can be changed or removed to
match the org's style.

#### Favicon

Replace `frontend/src/app/favicon.ico` with the org's favicon.

---

## Phase 2 — Jurisdiction & District Geography

**Goal:** Configure the app for the correct state/jurisdiction and district boundaries.

### Questions to ask

1. **What state or jurisdiction is this for?** Get the state name, abbreviation, and slug.
2. **What district types do you need?** Common ones:
   - Congressional (US House)
   - State Senate
   - State House / Assembly
   - County commission / board
   - City council / ward
   - School board
   - Judicial districts
   - Any other local boundaries

### If this is NOT Illinois

The sample data ships with Illinois GeoJSON shapefiles. For a different jurisdiction, the user
needs to:

#### A. Replace the GeoJSON district maps

Each district type needs a GeoJSON `FeatureCollection` where each `Feature` is one district.
The critical requirement: each feature must have a **numeric district identifier** in its
`properties` object.

**Where to get shapefiles:**

- **US Census TIGER/Line**: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
  - Congressional districts, state legislative districts, county subdivisions
  - Download as Shapefile, convert to GeoJSON with `ogr2ogr` or mapshaper.org
- **State GIS portals**: Most states publish their own redistricting shapefiles
- **redistrictingdatahub.org**: Cleaned and standardized district boundaries
- **Local government GIS**: City wards, county commission districts, school boards

**File organization:**

```
frontend/data/district-maps/<state-slug>/
├── boundary/
│   └── boundary.geojson        # Jurisdiction outline (FeatureCollection, 1 feature)
├── congressional/
│   └── districts.geojson       # One feature per district
├── state_senate/
│   └── districts.geojson
├── state_house/
│   └── districts.geojson
└── <any-other-layer>/
    └── districts.geojson
```

Help the user identify the **property name** in each GeoJSON that holds the district number.
Common patterns from Census TIGER data:

| Layer | Common property names |
|-------|----------------------|
| Congressional | `CD119FP`, `GEOID`, `DISTRICT` |
| State Senate | `SLDUST`, `DISTRICT`, `DIST_NUM` |
| State House | `SLDLST`, `DISTRICT`, `DIST_NUM` |
| County | `DISTRICT`, `DIST`, `COUNTYFP` |
| City Ward | `WARD`, `ward`, `ward_id` |

After placing the files, open one and check the `properties` of the first feature to confirm the
property name. Record it — you will need it for the config.

#### B. Update `app-config.ts` — geography section

```typescript
const STATE_SLUG = "<state-slug>";  // e.g. "ohio", "virginia"
const DISTRICT_MAP_ROOT = `district-maps/${STATE_SLUG}`;

// In APP_CONFIG:
geography: {
  jurisdictionName: "<display name>",  // e.g. "Ohio"
  countryCode: "US",
  state: {
    code: "<XX>",       // e.g. "OH"
    name: "<full name>",
    slug: STATE_SLUG,
  },
  bounds: {
    minLat: <south boundary>,
    maxLat: <north boundary>,
    minLng: <west boundary>,
    maxLng: <east boundary>,
  },
  focusPoint: { lat: <center lat>, lng: <center lng> },
  districtMapPack: {
    root: DISTRICT_MAP_ROOT,
    boundaryPath: `${DISTRICT_MAP_ROOT}/boundary/boundary.geojson`,
    layers: {
      // One entry per district type. The key becomes the layer ID
      // referenced in officials.yaml and the officeSlots config.
      congressional: {
        label: "Congressional",
        path: `${DISTRICT_MAP_ROOT}/congressional/districts.geojson`,
        numberProperty: "<property name from GeoJSON>",
        numberPropertyAliases: ["<lowercase variant>"],
      },
      // ... repeat for each layer
    },
  },
},
```

**How to find bounds and focus point:**
- Use https://boundingbox.klokantech.com/ — select the state, copy CSV format (W,S,E,N)
- `minLng=W, minLat=S, maxLng=E, maxLat=N`
- Focus point is typically the largest city or geographic center

---

## Phase 3 — Office Slots & Officials Roster

**Goal:** Define which offices appear in results and populate the officials data.

This is the key difference from an endorsement guide — here you are mapping **actual elected
officials** to their offices, not endorsements to races.

### Questions to ask

1. **Which elected offices should appear in results?** For each office:
   - Is it statewide (e.g. US Senator, Governor) or district-based?
   - If district-based, which district layer does it map to?
2. **Do you have a list of current officials?** (names, parties, websites, phone numbers)
3. **How many seats per office type?** (e.g. 2 US Senators, 1 US Representative per district)

### A. Update `app-config.ts` — officeSlots

The `officeSlots` array drives the UI ordering and determines how each office is resolved.

```typescript
officials: {
  officeSlots: [
    // Statewide offices — appear for every address
    { id: "us_senate_1", label: "US Senator", statewide: true },
    { id: "us_senate_2", label: "US Senator", statewide: true },

    // District offices — resolved by the user's district in the matching layer
    { id: "us_house", label: "US Representative", districtLayer: "congressional" },
    { id: "state_senate", label: "State Senator", districtLayer: "state_senate" },
    { id: "state_house", label: "State Representative", districtLayer: "state_house" },

    // Local offices — use their own district layers
    { id: "city_council", label: "City Council", districtLayer: "city_ward" },
    { id: "county_commissioner", label: "County Commissioner", districtLayer: "cook_county" },
  ],
},
```

Rules:
- Each slot needs a unique `id` that matches entries in `officials.yaml`
- `label` is displayed in the UI as the office title
- Statewide slots use `statewide: true` (no district lookup)
- District slots use `districtLayer: "<layer-id>"` where the layer ID matches a key in
  `districtMapPack.layers`
- Slots appear in the API response and UI in the order listed here

### B. Replace `officials.yaml`

The officials file uses this structure:

```yaml
officials:
  # Statewide offices (no district field)
  - office_id: us_senate_1
    name: Jane Smith
    party: D
    url: https://smith.senate.gov
    phone: "(202) 555-0100"

  - office_id: us_senate_2
    name: John Doe
    party: R
    url: https://doe.senate.gov

  # District-specific offices
  - office_id: us_house
    district:
      layer: congressional     # must match a key in app-config layers
      number: 7                # must match a district number in the GeoJSON
    name: Alice Johnson
    party: D
    url: https://johnson.house.gov
    phone: "(202) 555-0200"
```

Rules:
- `office_id` must match an `id` in the `officeSlots` config
- **Statewide** officials omit the `district` field entirely
- **District** officials must have `district.layer` (matching a config layer key) and
  `district.number` (matching a GeoJSON feature's number property)
- `party` is typically a single character: `D`, `R`, `I`, `G`, `L`, etc.
- `url` and `phone` are optional — they render as links in the official's card
- You need one entry per official per district. For a state with 15 congressional districts,
  that is 15 entries with `office_id: us_house`
- If the org hasn't gathered all officials yet, create a placeholder file with the correct
  structure and a few examples so they can fill it in later. The UI shows "Not configured"
  for any office slot without a matching official.

---

## Phase 4 — Geocoding Provider

**Goal:** Select and configure the address lookup service.

### Questions to ask

1. **Which geocoding service do you plan to use?** The app has built-in support for:

   | Provider | Env Variable | Free Tier | Notes |
   |----------|-------------|-----------|-------|
   | Geocode Earth | `GEOCODE_EARTH_API_KEY` | Trial available | Pelias-based, good US coverage |
   | Mapbox | `MAPBOX_ACCESS_TOKEN` | 100k req/mo free | Popular, requires Mapbox account |
   | Google Maps | `GOOGLE_MAPS_API_KEY` | $200/mo credit | Most complete, requires billing |
   | Geoapify | `GEOAPIFY_API_KEY` | 3k req/day free | Budget-friendly option |

2. If they want a **different provider** not listed above, you will need to implement a new
   provider. See "Adding a New Geocoding Provider" below.

3. **Do you already have an API key?** They do not need to share it — just confirm they have one
   or know how to obtain one.

### Using a built-in provider

Update `frontend/src/lib/app-config.ts`:

```typescript
geocoding: {
  provider: "mapbox",  // or "geocode-earth", "google-maps", "geoapify"
  autocompleteLimit: 8,
},
```

The corresponding environment variable must be set at runtime (not committed to the repo).

### Adding a new geocoding provider

If the user needs a provider not already implemented, follow this pattern:

1. **Add the provider name** to the union type in `frontend/src/lib/geocoding/types.ts`:

   ```typescript
   export type GeocodingProviderName =
     | "geocode-earth"
     | "mapbox"
     | "google-maps"
     | "geoapify"
     | "new-provider";   // <-- add here
   ```

2. **Implement the provider** in `frontend/src/lib/geocoding/providers.ts`. Every provider must
   implement the `GeocodingClient` interface:

   ```typescript
   interface GeocodingClient {
     provider: GeocodingProviderName;
     geocodeAddress(address: string): Promise<GeocodeResult>;
     autocompleteAddress(query: string): Promise<AutocompleteSuggestion[]>;
     reverseGeocode(lat: number, lng: number): Promise<string | null>;
   }
   ```

   Use the existing providers as a template. Key things each method must do:
   - `geocodeAddress`: Forward geocode an address string → `{ lat, lng, matchedAddress }`
   - `autocompleteAddress`: Return address suggestions as the user types → array of
     `{ address, lat, lng }`
   - `reverseGeocode`: Convert coordinates to a display address → string or null

   Use the shared helpers already in the file:
   - `fetchJson(url, options?)` — HTTP with 10s timeout
   - `normalizeAutocompleteResults(features, addressGetter, scope)` — filters by bounds + limits
   - `getEnvOrThrow(name, value)` — reads env var or throws

3. **Register the provider** in the `createGeocodingClient` factory in
   `frontend/src/lib/geocoding/providers.ts` (~line 543):

   ```typescript
   case "new-provider":
     return createNewProviderClient(scope);
   ```

4. **Set the provider** in `app-config.ts` and document the required env variable.

---

## Phase 5 — Map Provider

**Goal:** Configure how district map tiles are rendered.

### Questions to ask

1. **Which map tile provider do you want to use?** Built-in support for:

   | Provider | Env Variable | Notes |
   |----------|-------------|-------|
   | Protomaps | `NEXT_PUBLIC_PROTOMAPS_API_KEY` | Default. Free tier, self-hostable tiles |
   | Mapbox | (uses same `MAPBOX_ACCESS_TOKEN`) | If already using Mapbox for geocoding |
   | Google Maps | (uses same `GOOGLE_MAPS_API_KEY`) | If already using Google for geocoding |

2. **Do you want district map embeds?** The `ui.showDistrictShapes` config controls whether
   each official's card shows a small map of their district. Set to `false` to disable maps
   entirely (no map API key needed).

### What to change

Update `frontend/src/lib/app-config.ts`:

```typescript
maps: {
  provider: "protomaps",  // or "mapbox" or "google-maps"
  protomaps: { style: "light" },  // only used if provider is protomaps
},
ui: {
  showDistrictShapes: true,  // set to false to disable district maps
},
```

The map provider uses MapLibre GL JS (loaded via CDN in `layout.tsx`) with Protomaps vector
tiles by default. The `DistrictMap` component in `src/components/DistrictMap.tsx` renders each
official's district outline on a small embedded map.

If adding a new map provider, implement the `MapAdapter` interface in `src/lib/maps/`:

```typescript
interface MapAdapter {
  provider: MapProviderName;
  mountDistrictMap(options: DistrictMapMountOptions): () => void;  // returns cleanup function
}
```

---

## Phase 6 — Deployment

**Goal:** Get the app deployed and accessible.

### Questions to ask

1. **How do you plan to deploy?** Common options:
   - **Railway** (pre-configured in this repo)
   - **Vercel** (natural fit for Next.js)
   - **Fly.io**
   - **AWS / GCP / Azure** (ECS, Cloud Run, App Engine, etc.)
   - **Docker on own infrastructure**

2. **Do you have a custom domain?**

### Deployment guides

#### Railway (already configured)

The repo includes `railway.toml` and `Dockerfile`. Steps:

1. Push repo to GitHub
2. Create a Railway project and connect the GitHub repo
3. Add environment variables in the Railway dashboard:
   - Geocoding API key (e.g. `GEOCODE_EARTH_API_KEY`)
   - Map tiles key if using Protomaps (`NEXT_PUBLIC_PROTOMAPS_API_KEY`)
4. Railway auto-deploys on push to main
5. Health check endpoint: `/api/health`

#### Vercel

Next.js on Vercel needs no Dockerfile. Steps:

1. Remove or ignore the `Dockerfile` (Vercel uses its own build system)
2. Set the root directory to `frontend` in Vercel project settings
3. Add env vars in Vercel dashboard
4. Push to deploy

Note: The `Dockerfile` and `railway.toml` can stay in the repo without affecting Vercel.

#### Docker (generic)

```bash
docker build -t legislator-lookup .
docker run -p 3000:3000 \
  -e GEOCODE_EARTH_API_KEY=<key> \
  -e NEXT_PUBLIC_PROTOMAPS_API_KEY=<key> \
  legislator-lookup
```

The Dockerfile is a standard Node 20 build. It works on any container platform.

#### Fly.io

1. Install `flyctl`
2. Run `fly launch` from the repo root (it will detect the Dockerfile)
3. Set secrets: `fly secrets set GEOCODE_EARTH_API_KEY=<key> NEXT_PUBLIC_PROTOMAPS_API_KEY=<key>`
4. Deploy: `fly deploy`

#### Static export (not recommended)

The app relies on server-side API routes for geocoding (to keep API keys secret). A static
export would require rewriting the geocoding calls to run client-side, which exposes API keys.

---

## Phase 7 — Testing & Validation

**Goal:** Make sure everything works before going live.

After making changes, run through this checklist:

### 1. Install and build

```bash
cd frontend
npm ci
npm run build
```

Fix any TypeScript errors. Common issues:
- Mismatched layer IDs between `app-config.ts` officeSlots and `officials.yaml`
- Missing GeoJSON files referenced in config
- Typos in geocoding provider name

### 2. Run tests

```bash
npm test
```

Some tests reference Illinois-specific coordinates and data. Tests that may need updating:
- `__tests__/lookup-coordinates.test.ts` — endpoint tests using specific lat/lng
- `__tests__/lookup-address.test.ts` — address geocoding tests (need valid API key)
- `__tests__/services.test.ts` — district lookup and official matching tests
- `__tests__/lookup-validation.test.ts` — bounds validation tests

Run `npm run test:fast` to skip geocoding-dependent tests during development.

### 3. Lint

```bash
npm run lint
```

### 4. Manual smoke test

```bash
npm run dev
```

Then test:
- Visit http://localhost:3000
- Click "Use My Current Location" button
- Type an address in the autocomplete field
- Verify officials appear in the result cards with correct office labels
- Check that district map embeds render (if `showDistrictShapes` is enabled)
- Test an address outside the jurisdiction (should show an error)
- Test the shareable URL by copying the `?lat=...&lng=...` query string

### 5. API smoke test

```bash
# By coordinates
curl "http://localhost:3000/api/lookup?lat=<lat>&lng=<lng>"

# By address
curl "http://localhost:3000/api/lookup?address=<address in jurisdiction>"

# Autocomplete
curl "http://localhost:3000/api/autocomplete?q=<partial address>"

# Reverse geocode
curl "http://localhost:3000/api/reverse?lat=<lat>&lng=<lng>"

# Health check
curl "http://localhost:3000/api/health"
```

---

## Phase 8 — Final Touches

Before handing off, consider these:

### CI/CD

The repo has a GitHub Actions workflow at `.github/workflows/ci.yml` that runs lint, tests, and
build on push to main and on PRs. Make sure the tests pass after your changes, or update the
test fixtures for the new jurisdiction.

### Security

- Never commit API keys. Use environment variables.
- The geocoding API key is server-side only (no `NEXT_PUBLIC_` prefix).
- The Protomaps key uses `NEXT_PUBLIC_` because it is used client-side for map tile requests.
- The app has no database, auth, or user accounts — it is read-only.

### Performance

- GeoJSON files are loaded into memory and cached on first request. Very large shapefiles
  (>10 MB) may slow cold starts. Consider simplifying geometries with mapshaper.org or
  `turf.simplify()` before adding them.
- The `showDistrictShapes` config returns simplified GeoJSON geometry in API responses. District
  shapes are simplified with `turf.simplify({ tolerance: 0.002 })` before being sent to the
  client.

### Accessibility

- The app uses semantic HTML and has keyboard navigation for the autocomplete dropdown
  (arrow keys, enter, escape).
- Color contrast should be checked if you change the theme colors. Use the WebAIM contrast
  checker.

### Non-US jurisdictions

The app assumes US-style geocoding (addresses, states, ZIP codes) but the core architecture is
jurisdiction-agnostic. For non-US use:
- Update `countryCode` in config
- Provide appropriate GeoJSON boundaries
- Choose a geocoding provider with good coverage in the target country
- The bounds and focus point system works globally

---

## Quick Reference — File Change Checklist

When forking for a new org and jurisdiction, at minimum you must touch:

- [ ] `frontend/src/lib/app-config.ts` — branding, geography, office slots, geocoding provider, map provider
- [ ] `frontend/data/officials.yaml` — replace with real officials roster
- [ ] `frontend/data/district-maps/<state-slug>/` — add GeoJSON shapefiles + boundary
- [ ] `frontend/src/app/globals.css` — update color theme (if rebranding)
- [ ] `frontend/src/app/layout.tsx` — update fonts (if rebranding)
- [ ] `frontend/src/app/favicon.ico` — replace with org favicon
- [ ] Set geocoding env var in deployment platform
- [ ] Set map tiles env var (if using Protomaps)
- [ ] Update test fixtures for new jurisdiction coordinates
