# Legislator Lookup

Headless, self-hostable elected official lookup tool for civic organizations.

This repo is structured similarly to `/Users/mmclean/dev/website/ballot-endorsement-guide`, but returns elected officials (and district shapes) instead of ballot endorsements.

## Dev

```bash
cd frontend
npm install
npm run dev
```

Environment variables:

- `GEOCODE_EARTH_API_KEY` (server)
- `NEXT_PUBLIC_PROTOMAPS_API_KEY` (client)

See `frontend/.env.example`.
