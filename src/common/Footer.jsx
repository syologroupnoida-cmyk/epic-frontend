import Image from "next/image";
import Link from "next/link";

const cityNames = [
  "Bangalore",
  "Delhi NCR",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kolkata",
  "Mumbai",
  "Ahmedabad",
  "Amritsar",
  "Chandigarh",
  "Chennai",
  "Goa",
  "Kerala",
  "Lucknow",
  "Pondicherry",
  "Pune",
  "Allahabad",
  "Bhopal",
  "Bhubaneswar",
  "Nagpur",
  "Patna",
  "Noida",
];

const upperColumns = [
  {
    title: "Wedding Venues",
    label: "Venues",
    hrefBase: "banquet-hall",
  },
  {
    title: "Planning & Decoration",
    label: "Planning & Decoration",
    hrefBase: "wedding-decoration",
  },
  {
    title: "Wedding Photographers",
    label: "Photographers",
    hrefBase: "candid-photography",
  },
  {
    title: "Bridal Mehendi",
    label: "Mehendi",
    hrefBase: "bridal-mehendi",
  },
];

const lowerColumns = [
  {
    title: "Bridal Makeup",
    label: "Makeup",
    hrefBase: "bridal-makeup",
  },
  {
    title: "Wedding Caterers",
    label: "Caterers",
    hrefBase: "wedding-catering",
  },
];

const processSteps = [
  { label: "Search", iconClass: "footer-search-icon" },
  { label: "Select", iconClass: "footer-check-icon" },
  { label: "Book", iconClass: "footer-calendar-icon" },
];

const socialLinks = [
  { label: "Facebook", iconClass: "footer-facebook-icon" },
  { label: "Instagram", iconClass: "footer-instagram-icon" },
  { label: "YouTube", iconClass: "footer-youtube-icon" },
  { label: "X", iconClass: "footer-x-icon" },
  { label: "LinkedIn", iconClass: "footer-linkedin-icon" },
];

const vendorCities = [
  "Kolkata",
  "Hyderabad",
  "Bangalore",
  "Delhi NCR",
  "Noida",
  "Mumbai",
  "Jaipur",
  "Patna",
  "Nagpur",
  "Chandigarh",
  "Lucknow",
  "Indore",
  "Bhubaneswar",
  "Pune",
  "Kerala",
  "Chennai",
  "Mangalore",
  "Raipur",
  "Mysore",
  "Ahmedabad",
  "Bhopal",
  "Udaipur",
  "Goa",
  "Ludhiana",
  "Coimbatore",
  "Ujjain",
  "Surat",
  "Ranchi",
  "Amritsar",
  "Jalandhar",
  "Singapore",
  "Dubai",
  "Jammu",
  "Jodhpur",
  "Italy",
  "Pushkar",
  "Allahabad",
  "Patiala",
  "Gorakhpur",
  "Pondicherry",
  "Agra",
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "#" },
  { label: "Services", href: "/marketplace" },
  { label: "Luxury Wedding", href: "/luxury-wedding" },
  { label: "Wedding Destination", href: "/destination/national-wedding" },
  { label: "E-invites", href: "#" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Vendor Reviews", href: "#" },
  { label: "Customer Reviews", href: "#" },
  { label: "Testimonial", href: "#" },
  { label: "Sitemap", href: "#" },
  { label: "Career", href: "#" },
];

function cityHref(service, city) {
  return `/details/${service}-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <section className="bg-white px-4 pt-8 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-gradient-to-r from-[#421321] via-[#b61f4b] to-[#d59f2f] px-4 pb-18 pt-12 shadow-[0_20px_50px_rgb(66_19_33/0.16)]">
          <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            Ready to Plan Your Epic Wedding?
          </h2>
          <p className="mt-4 text-sm font-semibold text-white/90">
            Join 50,000+ happy couples who planned their dream wedding with us.
          </p>
          <Link
            href="/user/sign-up"
            className="mt-6 inline-flex rounded-full bg-white px-7 py-2.5 text-[13px] font-extrabold text-[#b61f4b] shadow-sm hover:bg-rose-50"
          >
            Start Planning for FREE
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-10 rounded-t-[26px] bg-white px-6 pb-9 pt-7 shadow-[0_-12px_30px_rgb(15_23_42/0.04)] sm:px-10">
          <h2 className="text-xl font-extrabold text-[#b61f4b] sm:text-2xl">
            Talk to a Wedding Expert for Free
          </h2>
          <p className="mt-3 text-sm font-medium text-slate-600">
            Available 7 days a week - 10:00 am - 6:30 pm
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 md:grid-cols-[1fr_1px_0.9fr] md:items-center lg:px-8">
        <div className="px-0 sm:px-6">
          <Link href="/" className="inline-flex">
            <Image
              src="/images/epic-logo-new.png"
              alt="Epic Wedz"
              width={126}
              height={44}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-700">
            India&apos;s trusted online wedding portal to find verified venues,
            photographers, makeup artists, mehendi, caterers, decorators & more
            in just 3 simple steps.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4">
            {processSteps.map((step, index) => (
              <div className="contents" key={step.label}>
                <div className="grid justify-items-center gap-3 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff1f2] text-[#b61f4b]">
                    <span className={step.iconClass} aria-hidden="true" />
                  </span>
                  <span
                    className={
                      index === 1
                        ? "text-[13px] font-extrabold uppercase text-[#b26b00]"
                        : "text-[13px] font-extrabold uppercase text-[#b61f4b]"
                    }
                  >
                    {step.label}
                  </span>
                </div>
                {index < processSteps.length - 1 ? (
                  <span className="footer-step-arrow" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden h-full min-h-[250px] bg-slate-200 md:block" />

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-[0_14px_36px_rgb(15_23_42/0.05)] sm:p-8">
          <h3 className="text-xl font-extrabold text-slate-900">
            Get In Touch
          </h3>
          <p className="mt-3 text-[13px] text-slate-600">
            Subscribe for latest wedding ideas & exclusive offers
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="footer-email">
              Your email
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Your email"
              className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm outline-none focus:border-[#b61f4b]"
            />
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-[#b61f4b] to-[#d59f2f] px-6 py-3 text-sm font-extrabold text-white hover:brightness-95"
            >
              Subscribe
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 text-[13px]">
            <span className="footer-mail-icon mt-1 text-[#b61f4b]" />
            <div>
              <p className="text-slate-500">Email</p>
              <a
                href="mailto:info@wedplanners.in"
                className="font-semibold text-[#b61f4b]"
              >
                info@wedplanners.in
              </a>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="footer-social-soft"
              >
                <span className={social.iconClass} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr]">
          {upperColumns.map((column) => (
            <div key={column.title}>
              <h3 className="border-b border-dashed border-[#b61f4b]/70 pb-3 text-left text-[15px] font-extrabold text-[#b61f4b]">
                {column.title}
              </h3>
              <ul className="mt-4 grid gap-1.5 text-left text-[13px] leading-5">
                {cityNames.map((city) => (
                  <li key={city}>
                    <Link
                      href={cityHref(column.hrefBase, city)}
                      className="text-slate-700 hover:text-[#b61f4b]"
                    >
                      {column.label} in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#fafafa]">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr] lg:px-8">
          {lowerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="border-b border-dashed border-[#b61f4b]/70 pb-3 text-left text-[15px] font-extrabold text-[#b61f4b]">
                {column.title}
              </h3>
              <ul className="mt-4 grid gap-1.5 text-left text-[13px] leading-5">
                {cityNames.map((city) => (
                  <li key={city}>
                    <Link
                      href={cityHref(column.hrefBase, city)}
                      className="text-slate-700 hover:text-[#b61f4b]"
                    >
                      {column.label} in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="border-b border-dashed border-[#b61f4b]/70 pb-3 text-left text-[15px] font-extrabold text-[#b61f4b]">
              Vendor Cities
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-7 gap-y-1.5 text-left text-[13px] leading-5">
              {vendorCities.map((city) => (
                <li key={city}>
                  <Link
                    href={`/marketplace?city=${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={
                      city === "Jammu"
                        ? "text-[#b61f4b] hover:text-[#8f1f3f]"
                        : "text-slate-700 hover:text-[#b61f4b]"
                    }
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="border-b border-dashed border-[#b61f4b]/70 pb-3 text-left text-[15px] font-extrabold text-[#b61f4b]">
              Quick Links
            </h3>
            <ul className="mt-4 grid gap-1.5 text-left text-[13px] leading-5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-700 hover:text-[#b61f4b]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 text-center text-[12px] text-slate-600 sm:px-6 lg:px-8">
          <a
            href="mailto:info@wedplanners.in"
            className="inline-flex items-center gap-2 hover:text-[#b61f4b]"
          >
            <span className="footer-mail-icon text-[#b61f4b]" />
            info@wedplanners.in
          </a>
          <p>Copyright 2026 Epic Wedz. All Rights Reserved | Made in India</p>
        </div>
      </div>
    </footer>
  );
}
