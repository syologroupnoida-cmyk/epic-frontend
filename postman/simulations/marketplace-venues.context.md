# Marketplace venues simulation

Generated 2026-10-26 from the local marketplace venue collection.

## Purpose

Exercise the frontend API route against a local HTTP dependency. The collection uses synthetic venue values and response shapes verified against the public list and detail endpoints on 2026-10-26. No owning Postman workspace was bound in this checkout; the mock was generated locally rather than pulled from an owner workspace.

## Execution

Run the simulation in one terminal:

```powershell
postman simulation run postman/simulations/marketplace-venues.sim.yaml --port 4900 --output ndjson --no-history
```

Run the targeted tests in another:

```powershell
$env:VENUE_SIMULATION_URL = 'http://localhost:4900/venues/api/v1/marketplace/venue-properties'
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:4900/venues/api/v1'
node --test tests/admin-listings.test.cjs tests/marketplaceListings.test.mjs tests/marketplaceVenues.test.mjs
```

To exercise the built Next app, set `MARKETPLACE_VENUES_API_URL` to the same URL, run `node node_modules/next/dist/bin/next start --port 3100`, and request the local `/api/marketplace/venue-properties` list/detail routes. Stop both servers with Ctrl+C. Omit the override to use the real API.

## Assumptions

- 2026-10-26: The live API returns `data.venueProperties` for lists and the property directly under `data` for details. Both were confirmed with public GET requests.
- 2026-10-27: The mock now applies search, city, and pagination to synthetic checkbox fixtures. `garden-demo` overlaps the default fixture, `paged-demo` has 21 matches, and `error-demo` returns 503. This verifies merge logic, not the live API's complete filtering semantics or browser interactions.
- 2026-10-26: The missing-venue response is a synthetic error example, not a verified live error payload.

## Observations

<!-- begin:observations -->
- 2026-10-27: The marketplace redesign passed 25 targeted tests, including all-page loading for sorting/price/rating and card rendering; three catalog tests passed separately. The venues member served the all-page request through page 2. Browser checks confirmed live category expansion, populated city controls, and a mobile page with no horizontal overflow. Desktop and mobile screenshots were inspected. Generated hero images and prompts are documented in `docs/marketplace-images.md`.
- 2026-10-27: Marketplace clients now call the shared backend base URL directly. All 23 tests passed with `NEXT_PUBLIC_API_BASE_URL` pointing to this simulation; no Next server is needed for the selection test. The venues member served multi-selection, pagination, and error traffic. One initial suite run hit a transient 502 in the legacy proxy test; its isolated run and the subsequent full suite passed. Production build and lint passed. The live services endpoint returned an empty collection, and its CORS response allowed localhost:3001.
- 2026-10-27: All 23 targeted tests passed with the production Next server forwarding real HTTP to the venues member. Its log confirmed multi-subcategory calls, page 2, city/search filters, and the 503 path; no member was silent. `/services` and `/venues` returned HTTP 200. Set `MARKETPLACE_APP_URL=http://localhost:3100` for the multi-selection test while the built Next server runs with the API override described above.
- 2026-10-26: The venues member served filtered list, slug detail, and missing-venue requests from both the real route handler test and the production Next server. No member was silent. All 22 targeted tests passed; home and venue page routes returned HTTP 200. This does not verify browser layout or hydration.
<!-- end:observations -->
