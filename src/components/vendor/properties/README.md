# Vendor properties

Property → Add Property / Property List use `/partner/add-property`, `/partner/property-list`, and `/partner/edit-property/{venuePropertyId}`.

The existing authenticated client supplies the `/api/v1` prefix. Creation POSTs to `/vendor/venue-properties` with the supplied address, capacity, amenity, metadata, venue type and media fields. Draft Property sends `submitForReview: false`; Submit Property sends `true`.

Edit drafts PATCH `/vendor/venue-properties/{id}` without `submitForReview`. Edit review submission sends only POST `/vendor/venue-properties/{id}/submit`; save edits as a draft first.

The paginated list uses GET with page 1 / limit 20. Row menus provide View details (GET by ID), Edit, Delete (DELETE by ID), and Restore (POST `{id}/unarchive`). Operation results appear in popups, and deleted rows remain available during the visit for restoration from their row menu. Next is disabled when the response has no further page.

The vendor Property List has a Status dropdown on the left and property search on the right. Both use the list request's optional `status` and `search` query parameters and reset pagination to page 1. Search is trimmed and debounced by 350 ms; empty filters are omitted from requests.

Venue types come from `/vendor/capabilities?offeringKind=VENUE_PROPERTY` without pagination parameters. Cities and image uploads reuse the existing application integrations. Multiple property images upload to `/uploads/image` with `purpose: venue-property-media`; each returned URL and public ID is retained in the property's media array. Property metadata retains false, zero, and unknown fields on edit.

Run `node --test tests/vendor-listings.test.cjs tests/agentDashboardRoutes.test.mjs` for local contract, form rendering and navigation checks. These checks use mocked HTTP-client responses; they do not establish live API compatibility.

## Admin review

Super-admin Property → Property List opens `/superadmin/property-listings`. GET `/admin/venue-properties` uses page 1 / limit 20 and omits status by default to show all properties. The Status dropdown sends the selected status and resets to page 1.

View details GETs `/admin/venue-properties/{id}`. Pending properties offer Approve and Reject only in the details popup. Review actions POST to `{id}/approve` with `{}` or `{id}/reject` with a trimmed `{ reason }`. Successful moderation refreshes the table; operation results and errors stay in popups. Run `node --test tests/admin-listings.test.cjs` for the local admin contract and rendering checks.
