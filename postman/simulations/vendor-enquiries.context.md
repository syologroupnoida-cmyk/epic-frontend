# Vendor enquiries simulation

Created 2026-10-28 from the vendor, service, venue enquiry and get-quotes endpoints and request fields supplied by the user.

## Purpose

Exercise the enquiry client's HTTP submission without creating a production lead.

## Execution

Start `postman simulation run postman/simulations/vendor-enquiries.sim.yaml --port 4905 --output ndjson --no-history`.
Use the listening event's URL; with the requested port, set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4905/enquiry-api/api/v1` and `VENDOR_ENQUIRY_SIMULATION=1`, then run `node --test tests/vendorEnquiries.test.mjs tests/quoteLeads.test.mjs`. Stop the simulation with Ctrl+C.

## Assumptions

- 2026-10-28: Request fields are user supplied. Success/error response examples and public access are assumptions; the production POST was not called to avoid creating a lead. Tests establish frontend transport and error handling, not backend persistence or notification delivery.
- 2026-10-28: Owner mock lookup in the repository's bound workspace could not run because the Postman CLI is signed out. The local synthetic mock is used without publishing anything.

## Observations

<!-- begin:observations -->
- 2026-10-28: All eleven enquiry/quote tests passed. The enquiry-api member served dynamic city/category/subcategory reads and the get-quotes POST, including category-specific service IDs, exactly ten request fields, numeric budgets, API success messages and a quote rejection. All four lead endpoint types served traffic; no member was silent. Build, lint and existing rendering checks passed.
- 2026-10-28: All eight enquiry tests passed with venue enquiries enabled. The enquiry-api member served all three endpoint types, including the encoded venue-property slug and numeric guestCount of 400 with exactly five fields. Venue empty-success and rejection paths passed; no member was silent. Image selection tests confirmed property-photo preference and resort/hotel/banquet fallbacks.
- 2026-10-28: All six tests passed after adding service enquiries. The enquiry-api member served vendor and listing paths, encoded slugs, empty successes, HTTP errors, application rejections, and malformed responses. Its log confirmed both endpoint paths. The listing request contained exactly five fields without email or verification UI data; vendor requests retained email.
- 2026-10-28: All four enquiry tests passed. The enquiry-api member served the encoded vendor POST, empty success, HTTP error, application rejection, and malformed-response cases; no member was silent. The log confirmed the requested backend path. The frontend production build and lint also passed.
<!-- end:observations -->
