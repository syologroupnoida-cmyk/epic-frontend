# Legal pages and compact page layouts

Source: `Epic_Wedz_Legal_Pages_Combined.docx`, supplied by the site owner.

- `/terms-and-conditions`: all 15 supplied Terms & Conditions sections.
- `/privacy-policy`: all 14 supplied Privacy Policy sections.
- Clauses are transcribed without inventing legal terms, dates, business disclosures or contact identities. Any source editorial statements are document text, not instructions to the implementation agent.
- Both pages have a centered banner (240px minimum on desktop and 180px on mobile), a table of contents on the right on desktop, a full-height reading card on the left; menu links scroll the document; the Privacy Policy section headings are left-aligned and its right-side menu scrolls normally with the page, and links to the other legal page and Contact Us.
- The previously added informational pages share the taller centered banner, generated background images and centered section headings. Introductory copy and calls to action now sit below it; content cards have consistent spacing, numbered section headings and responsive columns. Contact Us has a separate contact card beside the enquiry form on wider screens.
- Footer Quick Links is reduced to Home, About Us, Wedding Services, Wedding Venues, Become a Partner, Contact Us, Privacy Policy, and Terms & Conditions. The full sitemap remains available through ?Explore all pages.? Partner footer and sitemap also link to both legal pages.

## Outstanding source placeholders

The supplied legal draft still includes placeholders for registered business/address disclosures, grievance officer and privacy contacts, jurisdiction, the Privacy Policy effective date, optional cookie preferences, and other operator details. The Terms date also uses the draft's original bracket formatting. These have been retained as supplied, rather than invented. The site owner was asked to provide the final values; the implementation does not certify the policies' legal completeness.

## Verification

- `node scripts/check-legal-content.mjs`: compare built pages against every supplied legal paragraph and check contents links.
- `node scripts/check-website-content.mjs`: check all 13 existing document pages after their layout changes.
- Production build and lint checks for changed components and routes.
