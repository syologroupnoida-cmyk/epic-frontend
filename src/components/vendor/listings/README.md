# Vendor service listings

Open the Partner dashboard at `/partner/dashboard`, then **Services ? Add Service / Service List**.

Named components live in `src/components/vendor`: `AddService.jsx`, `EditService.jsx`, `ServiceList.jsx`.
They use the existing `MainApi` client. Its base already includes `/api/v1`, so the adapter requests `/vendor/listings`, `/vendor/capabilities?offeringKind=SERVICE`, and `/cities` without duplicating that prefix. Category and subcategory choices come only from the vendor's approved service capabilities, grouped by `service.category`; no public catalog fallback is used.

Draft Listing sends `submitForReview: false`; creating with Submit Listing sends `true`. In the edit form, Draft Listing PATCHes changes, while Submit Listing sends only POST `/vendor/listings/{listingId}/submit` with no update payload. Save edits before submitting the saved listing for review. Successful saves and submissions show a popup; creating a listing navigates to its edit page after the popup is acknowledged. The table starts at page 1 / limit 20 and provides three-dot edit/delete actions and POST restore. Metadata schemas for all twenty supplied service families live in `listings/metadata`. Category changes clear unrelated metadata; existing unknown metadata, zero values, false booleans, arrays and uploaded public IDs are preserved.

View details, Edit, Restore, and Delete live in each row's three-dot menu. View details opens a read-only popup using GET `/vendor/listings/{id}`. Edit is available for every row while no operation is running. Restore is enabled for archived rows; services deleted during the current visit remain visible as archived rows so they can be restored from that menu. Action results and errors appear in popups. An optional archived filter can be configured once the server query value is confirmed. Existing business-capability settings remain under Business Profile ? Manage Services.

Run `node --test tests/vendor-listings.test.cjs`; write requests are mocked.
