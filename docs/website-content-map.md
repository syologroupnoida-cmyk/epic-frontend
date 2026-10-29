# Website content implementation

Source: `Epic_Wedz_Complete_Website_Content (1).docx`, supplied by the site owner.

The document supplies 13 public page drafts. Its editorial headings, suggested URL notes, truncated description endings, and contact placeholders are not displayed as site copy. Public API listings and account/dashboard forms keep their existing data and workflows.

| Document page | Website route | Implementation |
| --- | --- | --- |
| Home | `/` | Updated hero, introduction, categories, inspiration, stories, planning, invitations and marketplace copy |
| Wedding Venues | `/venues` | Updated banner, introduction and venue guidance; existing filters retained |
| Wedding Vendors | `/vendors` | Updated hero, introduction and service-category descriptions; business directory retained |
| Hire a Wedding Planner | `/hire-free-wedding-planner` | Document introduction, planning services and next steps |
| Destination Weddings | `/destination-weddings` | New overview with India/international destination links |
| Luxury Weddings | `/luxury-wedding` | Document copy for venues, decor, hospitality, entertainment and planning |
| Real Weddings | `/real-weddings` | New story overview using the existing story imagery and links |
| Wedding Marketplace | `/marketplace` | Document marketplace overview and occasion guidance; live directory retained |
| Wedding Invitations | `/wedding-invitations` | New overview and existing invitation designs |
| Wedding Blog & Inspiration | `/blog` | Updated title, introduction, topics, guidance and existing article links |
| Become a Vendor / Partner | `/partner` and `/agent` | Document partner benefits and registration steps; sign-up, login and KYC links retained |
| About Us | `/about-us` | New mission, vision and platform overview |
| Contact Us | `/contact-us` | New contact page and all seven enquiry fields |

`/sitemap` links to every public content page. Main navigation and footer links expose the new pages.

## Suggested URL compatibility

Permanent redirects retain the working routes while accepting the document's suggested URLs:

- `/home` -> `/`
- `/wedding-venues` -> `/venues`
- `/wedding-vendors` -> `/vendors`
- `/hire-a-wedding-planner` -> `/hire-free-wedding-planner`
- `/luxury-weddings` -> `/luxury-wedding`
- `/wedding-marketplace` -> `/marketplace`
- `/wedding-blog-inspiration` -> `/blog`
- `/become-a-vendor-partner` -> `/partner`

## Copy and enquiry handling

Copy lives in `src/data/websiteContent.mjs`. Descriptions use complete sentences from the supplied introduction and subtitle instead of publishing the draft metadata's mid-word truncations. Canonical links identify the working routes. Existing illustration/detail pages now use the matching document category and no longer publish mock package prices, dummy reviews or placeholder text.

The document supplies no phone number or enquiry backend. The contact and quote forms prepare an email to the existing site address, `info@wedplanners.in`, and tell visitors to send it from their email app. They do not report a server submission. The existing published support hours are retained, and the placeholder partner phone number is removed.

No legal-policy, SaadiMitra product, account, admin or vendor-dashboard copy was invented: these do not have drafts in the document.

## Verification

- Production build checks all routes.
- `node scripts/check-website-content.mjs` checks the built HTML for every document page: one H1, source copy, section headings, calls to action, metadata, image availability, and absence of editorial/demo text.
- Marketplace navigation/search and footer subscription regression tests cover the existing dynamic workflows.
