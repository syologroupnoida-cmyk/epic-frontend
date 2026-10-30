# Admin subscription plan simulation

Created 2026-10-29 from the user's subscription plan endpoints and complete create payload. The user confirmed PATCH for updates.

## Purpose

Run the actual authenticated Axios client against `postman/mocks/subscription-plans/default.js` to verify independent saves, partial updates, and activation without changing real plans.

## Execution

Start `postman simulation run postman/simulations/subscription-plans.sim.yaml --port 4908 --output ndjson --no-history`.
Set `SUBSCRIPTION_PLANS_SIMULATION_URL=http://127.0.0.1:4908/plans-api/api/v1` from the listening event and run `node --test tests/subscriptionPlans.test.cjs`. Stop with Ctrl+C. Restart before repeating mutation tests to reset state.

## Assumptions

- 2026-10-29: The user supplied all create fields, paths, and the PATCH update method. List/create/update response envelopes, IDs, uniqueness conflicts, and field errors are synthetic; live response schemas and permissions are unverified. The same list endpoint omits isActive for All and sends false for Inactive, following the supplied true filter.
- 2026-10-29: POST is used for create/activate/deactivate, following the existing admin API conventions. No complete kind/theme enum was supplied, so those inputs accept text instead of enforcing invented backend choices. Only the preview's colors have local fallbacks.
- 2026-10-29: Prior simulation contexts record unavailable CLI workspace authentication. This locally owned mock uses a synthetic token and is not published.

## Observations

<!-- begin:observations -->
- 2026-10-29: All five plan tests passed. The plans-api member served filtered lists, a 21-field create, one PATCH with exactly four changed fields, activation/deactivation including an encoded ID, and 409/503/404/401 plus logical-failure responses. No member was silent; unchanged edits sent no PATCH. Production build and targeted lint passed. The live local route redirected guests to login, and an admin-role test request plus all 31 JS chunks returned 200. Synthetic tests do not establish live backend schema or permissions.
<!-- end:observations -->
