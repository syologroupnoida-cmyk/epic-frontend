# Admin lead moderation simulation

Created 2026-10-28 from the admin list, detail, activation, rejection and close requests supplied by the user.

## Purpose

Exercise the actual authenticated Axios client against the stateful handler in `postman/mocks/admin-leads/default.js` without modifying real leads.

## Execution

Run `postman simulation run postman/simulations/admin-leads.sim.yaml --port 4907 --output ndjson --no-history`.
Use the listening URL: set `ADMIN_LEADS_SIMULATION_URL=http://127.0.0.1:4907/admin-leads-api/api/v1` and run `node --test tests/adminLeads.test.cjs`. Stop with Ctrl+C. Restart before repeating the tests to reset moderation state.

## Assumptions

- 2026-10-28: No response examples or complete status/type enums were supplied. Pagination, detail wrappers, DIRECT type and lifecycle transitions in the fixture are synthetic. Passing tests cannot verify production response fields, authorization or database changes. The UI also discovers additional types/statuses from returned records.
- 2026-10-28: POST for moderation and `search` for server search follow existing admin-listing conventions; the user supplied paths/payloads but did not specify those aspects of the contract. These need confirmation against the live backend when credentials are available.
- 2026-10-28: The existing simulation context records that the CLI is signed out. This mock remains local and uses a synthetic admin token.

## Observations

<!-- begin:observations -->
- 2026-10-28: All three admin lead tests passed. The admin-leads-api member served unfiltered and combined-filter pagination, search, encoded-ID details, activation, rejection and closure, plus 409/503/404/401 and logical-failure responses. Real Axios requests sent the synthetic admin Bearer token and exact numeric activation/reason payloads. No member was silent. These results establish local request behavior, not live backend compatibility.
<!-- end:observations -->

## What didn't work

- 2026-10-28: The first moderation run returned 400 "Invalid request." because the handler attempted to parse an already-consumed request stream. With `interceptRequests: true`, the CLI supplies parsed JSON in `req.body`; the handler now uses it before falling back to the stream.
