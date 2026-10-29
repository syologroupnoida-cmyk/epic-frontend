import QuoteModal from '@/components/common/QuoteModal';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useCities from "@/util/useCities";
import { vendorSearchHref } from "@/util/publicCatalog.mjs";
import useFooterCategories from "@/util/useFooterCategories";
import { FOOTER_CATEGORY_SETTINGS_KEY, FOOTER_SETTINGS_EVENT, readFooterCategoryIds } from "@/util/footerSettings";

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

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Wedding Services", href: "/services" },
  { label: "Wedding Venues", href: "/venues" },
  { label: "Become a Partner", href: "/partner" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

export default function Footer() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const { cities } = useCities();
  const { items: categories, loading: categoriesLoading, error: categoryError, retry: retryCategories } = useFooterCategories();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null);

  useEffect(() => {
    function refreshSettings(event) {
      if (event?.type === "storage" && event.key !== FOOTER_CATEGORY_SETTINGS_KEY) return;
      setSelectedCategoryIds(readFooterCategoryIds());
    }
    refreshSettings();
    window.addEventListener("storage", refreshSettings);
    window.addEventListener(FOOTER_SETTINGS_EVENT, refreshSettings);
    return () => {
      window.removeEventListener("storage", refreshSettings);
      window.removeEventListener(FOOTER_SETTINGS_EVENT, refreshSettings);
    };
  }, []);

  const footerCategories = useMemo(() => {
    if (selectedCategoryIds === null) return categories;
    const selected = new Set(selectedCategoryIds);
    return categories.filter((category) => selected.has(category.id));
  }, [categories, selectedCategoryIds]);

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <section className="bg-white px-4 pt-8 text-center text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-gradient-to-r from-[#421321] via-[#b61f4b] to-[#d59f2f] px-4 pb-18 pt-12 shadow-[0_20px_50px_rgb(66_19_33/0.16)]">
          <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            Ready to Plan Your Epic Wedding?
          </h2>
          <p className="mt-4 text-sm font-semibold text-white/90">
            Search for vendors, select suitable professionals and connect with your preferred wedding experts.
          </p>
          <button
            type="button" onClick={() => setQuoteOpen(true)}
            className="mt-6 inline-flex rounded-full bg-white px-7 py-2.5 text-[13px] font-extrabold text-[#b61f4b] shadow-sm hover:bg-rose-50"
          >
            Start Planning for FREE
          </button>
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
          <p className="mt-3 text-[13px] leading-6 text-slate-600">Have a question about venues, services, destination weddings or vendor registration?</p>
          <button type="button" onClick={() => setQuoteOpen(true)} className="mt-6 inline-flex rounded-full bg-[#b61f4b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#981a3f]">Request a Free Quote</button>

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
          {footerCategories.map((category) => (
            <div key={category.id}>
              <h3 className="border-b border-dashed border-[#b61f4b]/70 pb-3 text-left text-[15px] font-extrabold text-[#b61f4b]">
                {category.name}
              </h3>
              <ul className="mt-4 grid gap-1.5 text-left text-[13px] leading-5">
                {cities.map((city) => (
                  <li key={city.id}>
                    <Link
                      href={vendorSearchHref(category, city)}
                      className="text-slate-700 hover:text-[#b61f4b]"
                    >
                      {category.name} in {city.name}
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
              {cities.map((city) => (
                <li key={city.id}>
                  <Link
                    href={vendorSearchHref(null, city)}
                    className="text-slate-700 hover:text-[#b61f4b]"
                  >
                    {city.name}
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
          {categoryError ? <p role="alert" className="text-left text-xs text-red-700">{categoryError} <button type="button" onClick={retryCategories} className="underline">Retry</button></p> : !footerCategories.length ? (
            <p role={categoriesLoading ? 'status' : undefined} className="text-left text-sm text-slate-500">{categoriesLoading ? 'Loading vendor categories...' : 'Vendor categories will appear here when available.'}</p>
          ) : null}
        </div>
      </section>

      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 text-center text-[12px] text-slate-600 sm:px-6 lg:px-8">
          <Link href="/sitemap" className="text-[#b61f4b] hover:underline">Explore all pages</Link>
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
      <QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </footer>
  );
}
