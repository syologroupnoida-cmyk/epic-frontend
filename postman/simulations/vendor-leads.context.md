# Vendor lead list simulation

Created 2026-10-28 from the vendor lead, shared lead and purchase endpoints supplied by the user.

## Purpose

Verify authenticated list pagination and detail reads through the real Axios client without using production credentials.

## Execution

Run `postman simulation run postman/simulations/vendor-leads.sim.yaml --port 4906 --output ndjson --no-history`.
Use the listening URL; with the requested port, set `VENDOR_LEADS_SIMULATION_URL=http://127.0.0.1:4906/leads-api/api/v1` and run `node --test tests/vendorLeads.test.cjs`. Stop with Ctrl+C. Restart the simulation before repeating purchase tests; their synthetic purchase state persists until restart.

## Assumptions

- 2026-11-05: The user supplied `leadType=DIRECT` and `leadType=SHARED` for the purchased list. The UI now defaults to Direct Lead and passes the selected type to `/vendor/leads/purchased`. The existing local mock models filtering; live response shapes and filtering remain unverified.

- 2026-11-04: The user supplied GET `/api/v1/vendor/leads/purchased?page=1&limit=20`. Purchased response shapes and optional search support reuse the existing list conventions and remain unverified against the live API. The existing local mock was extended; no published owner mock was fetched (installed CLI does not support `postman status`).

- 2026-10-30: Direct purchases reuse POST `/vendor/leads/{leadId}/purchase`; shared purchases retain the shared assignment ID. No new API contract was supplied with this request. Direct purchase support is modeled locally and remains unverified against the live backend.

- 2026-10-29: The search field uses the optional `search` query parameter, following the other partner tables. The mock's searchable fields are synthetic; the live backend's support and search scope remain unverified without a vendor session.

- 2026-10-28: Only endpoints were provided. The lead and pagination response examples are synthetic assumptions. Tests cannot establish production field names, database contents, permissions or tenant isolation. The UI preserves additional nested detail fields returned by the API.
- 2026-10-28: Postman CLI owner lookup was unavailable earlier in this session because it is signed out. This local mock is not published and uses a synthetic token, not a real vendor session.

## Observations

<!-- begin:observations -->
- 2026-11-05: All eight lead checks passed against the existing local mock through Postman CLI 1.76.0. Request logs confirmed purchased `leadType=DIRECT` and `leadType=SHARED`, filtered search, empty direct results for a shared search, and shared page 2 with limit 1. React-compiled rendering includes purchased-only type tabs. Switching tabs resets the page and clears menu/details; cancellation and result identity guard stale responses. Application-file lint passed. The separate shop-rendering test failed on its incomplete document stub (`dataset`), and test-file lint flagged the existing `module` variable. These findings supersede the purchased-list routing observations from 2026-11-04; live API and browser interactions were not checked.
- 2026-11-04: At the user's request, reverted the Direct Lead/Shared Lead tabs and their endpoint suffix routing. Purchased Leads again uses only `/vendor/leads/purchased` with page/limit and optional search. All eight vendor lead tests passed against the local simulation after the revert, including purchased pagination, search, cancellation and unauthenticated access. The earlier tab-specific observation below is historical and no longer describes the current implementation. Shop changes are preserved.
- 2026-11-04: Purchased table now defaults to Direct Lead and switches between the user-supplied `/purchased/direct` and `/purchased/shared` endpoints, retaining page/limit and optional search parameters. Eight tests and the production build passed. Local simulation requests verified distinct direct/shared results, shared page 2 and direct empty search results. Live endpoint response shapes and search support remain unverified. Tab changes reset pagination and close the old menu/detail view; result identity and request cancellation prevent showing the previous type as current.
- 2026-11-04: All eight vendor lead tests passed against the local Postman simulation (CLI 1.76.0). Request logs confirmed purchased page 1 with limit 20, limit-1 pagination over direct and nested shared records, trimmed search, empty results (200), and unauthenticated access (401). Cancellation and React-compiled purchased table rendering checks passed. This verifies client behavior against synthetic data; live response fields and browser interactions remain unverified.
- 2026-10-30: All seven vendor lead tests passed against the local Postman simulation (CLI 1.76.0). Request logs confirmed shared and direct purchase POSTs returned 200, repeat purchases returned 409, and unavailable purchases returned 503. Follow-up direct list/detail reads showed purchased status; shared detail reads unlocked after purchase. Rendering checks hid nested IDs/slugs while retaining zero and false values. This establishes client behavior against synthetic responses, not live direct-purchase support or browser interaction behavior.
- 2026-10-29: All five vendor lead tests passed, including trimmed search, clearing search, empty results and shared search finding fixture 25 beyond the first page. The leads-api member served both search paths and purchase regression requests; no member was silent. Admin menu rendering tests confirmed DIRECT leads hide Activate/Reject. All three affected dashboard routes compiled successfully on the local dev server.
- 2026-10-28: All five lead tests passed, including shared page 1/page 2 and POST purchase using the shared ID rather than the underlying lead ID. The member served restricted details before purchase, full details afterward, a repeat-purchase 409 and purchase 503; no member was silent. These are synthetic purchase semantics, not verified billing or live permissions. Production-server checks confirmed old /agent URLs redirect to /partner routes, private routes redirect guests to /partner/login, and the public /partner page remains available.
- 2026-10-28: All four tests passed. The leads-api member served authenticated page 1/page 2, encoded lead ID detail, missing/unavailable/invalid/rejected detail cases and an unauthenticated 401; no member was silent. The real Axios client sent the expected vendor Bearer token. Rendering tests retained nested fields, false values and zero counts. Build and targeted lint passed, including the new protected /agent/lead-list route.
<!-- end:observations -->
