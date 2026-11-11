# Auth session simulation

Created 2026-10-27 from a local synthetic request contract. No owning workspace
or published auth mock was supplied; no production credentials are used.

## Purpose

Run the real Axios client and auth interceptors against an HTTP auth dependency.
The handler models the existing Bearer header, token refresh, and vendor routes.
It does not model actual JWT verification or backend account permissions.

## Execution

```powershell
postman simulation run postman/simulations/auth-session.sim.yaml --port 4901 --output ndjson --no-history
```

In another terminal:

```powershell
$env:AUTH_SIMULATION_URL = 'http://localhost:4901/auth-api/api/v1'
node --test tests/auth-session.test.cjs tests/admin-listings.test.cjs tests/vendor-listings.test.cjs
```

Stop the simulation with Ctrl+C. The test process configures its own backend base
URL; the application build keeps the production default.

## Assumptions

- 2026-10-27: The fixture uses opaque synthetic strings as tokens. Passing tests
  establish header formatting, cookie fallback, retry behavior, and failed-refresh
  cleanup, not that a real user's token is valid.
- 2026-10-27: The test browser shim models cookie sharing and separate local
  storage, without reading the user's browser session.

## Observations

<!-- begin:observations -->
- 2026-10-27: All four auth tests passed; the combined run passed 47 tests with two unrelated venue-simulation tests skipped. The auth-api member served cookie-token requests, two concurrent 401s, one shared successful refresh, both retries, rejected login, and failed refresh. No member was silent. Production build passed; lint had one pre-existing KYC image warning.
<!-- end:observations -->

## Password update verification (2026-11-03)

- The user supplied `/api/v1/auth/change-password` with `currentPassword` and
  `newPassword`. POST is assumed from the existing auth mutation conventions;
  the HTTP method and backend response contract still need live verification.
- Extended the existing synthetic auth mock, without an owning workspace mock
  lookup. The real `changePassword` helper and Axios interceptors passed against
  the local simulation on port 4907: only the two API fields were sent, password
  whitespace was preserved, Bearer auth was attached, and a modeled incorrect
  current password surfaced its API error message. The log recorded two 200 and
  two 400 responses to POST `/api/v1/auth/change-password`.
- All five tests in `tests/auth-session.test.cjs` passed with the simulation.
  Vendor and super-admin local role states were exercised; opaque mock tokens
  do not establish backend role permissions or actual password persistence.

## What didn't work

- 2026-10-27: The first HTTP test used a browser shim without `window.location.href`, which Axios requires. The shim now includes a local URL. The initial mock also tried to reread an already-consumed request stream; it now uses Postman's parsed `req.body`.
