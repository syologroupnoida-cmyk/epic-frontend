# Contact enquiries

User supplied public POST /api/v1/contact-us and its seven fields; admin GET list with page, limit and optional NEW status; GET detail; update URL with status and adminNote.

The implementation assumes PATCH for partial updates. Only supplied status values NEW and IN_PROGRESS are offered, plus the current status returned by the server. CLIENT and VENDOR follow existing portal roles. The website field is treated as a hidden spam trap and sent empty for normal submissions.

All response envelopes, pagination shapes, authentication checks and sample messages in this mock are synthetic. Live response shape, allowed status values and update method still require backend confirmation. No production messages are created or modified by these tests.

Verification exercises real HTTP through the application request helpers: exact public JSON payload, all/new lists, pagination, encoded IDs, persisted notes/status, API errors, cancellation and unauthenticated access. Browser checks separately cover MUI form and admin popup interactions.
