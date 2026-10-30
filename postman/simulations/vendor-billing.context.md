# Vendor billing simulation

Created 2026-10-29 from the user's five vendor billing endpoints and confirmed `{ planId }` purchase payload.

## Purpose

Run the real authenticated Axios client and billing adapter against the local handler in `postman/mocks/vendor-billing/default.js` without purchasing a real subscription.

## Execution

Start `postman simulation run postman/simulations/vendor-billing.sim.yaml --port 4909 --output ndjson --no-history`.
Set `VENDOR_BILLING_SIMULATION_URL=http://127.0.0.1:4909/vendor-billing-api/api/v1` from the listening event and run `node --test tests/vendorBilling.test.cjs`. Stop with Ctrl+C; restart before repeating purchase tests to reset state.

## Assumptions

- 2026-10-30: The catalog response in `plans.response.json` is the exact nested Free/Basic response supplied by the user, including DEFAULT_FREE_PLAN, cardAction, current-plan flags, and nested limits. The extra Professional plan, wallet/subscription envelopes, debit behavior, dates, and error examples remain synthetic. Passing checks establish behavior against these samples, not a live purchase.
- 2026-10-29: The existing admin simulation context records unavailable CLI workspace authentication. The owner's published-mock search was skipped; this local mock is not published.

## Observations

<!-- begin:observations -->
- 2026-10-30: Nine selected tests passed; the separate admin HTTP test was skipped. All five billing tests passed against the supplied nested catalog, including a default free plan with no subscription record, Basic purchase, refreshed current-plan metadata, upgrade, balance/history refresh, and rejection paths. The vendor-billing-api member served every endpoint; none was silent. Shared normalization also preserved nested limits and generated only the changed admin edit field.
- 2026-10-29: All four billing tests passed, including real authenticated HTTP through the vendor-billing-api member. The member served all five endpoints, first/second transaction pages, purchase and upgrade, current-plan/balance/history reads after each purchase, duplicate-purchase rejection without a second debit, and 503/404/401 plus logical-failure responses. No member was silent. Targeted lint and both local partner routes plus their JavaScript chunks passed. Three unrelated integration tests were skipped because their separate simulations were not running; 15 tests passed across the four selected files. The production build passed with all 104 static pages generated. Live response schemas and purchase behavior remain unverified.
<!-- end:observations -->
