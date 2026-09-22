import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import { allCards, brandTagline, vendorCategories } from "@/data/homeData";

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DetailPage({ item }) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const packages = [
    {
      title: "Starter",
      price: "From Rs. 25,000",
      text: "Best for intimate functions and single-event bookings.",
    },
    {
      title: "Signature",
      price: "From Rs. 75,000",
      text: "Balanced package for multi-event wedding planning needs.",
    },
    {
      title: "Luxury",
      price: "Custom quote",
      text: "Premium vendor coordination, styling, and end-to-end support.",
    },
  ];
  const highlights = [
    "Verified profile and dummy vendor score",
    "Photo gallery, package comparison, and city availability",
    "Dedicated event manager for quote follow-up",
    "Flexible options for engagement, mehendi, wedding, and reception",
  ];
  const galleryImages = [
    item.image,
    vendorCategories[0].image,
    vendorCategories[1].image,
    vendorCategories[3].image,
  ];
  const serviceInclusions = [
    "Initial consultation and requirement mapping",
    "Budget planning with package comparison",
    "Vendor shortlist and appointment coordination",
    "Event timeline and family coordination notes",
    "Quote follow-up and booking assistance",
    "Final checklist for wedding-day execution",
  ];
  const processSteps = [
    "Share event details",
    "Compare available packages",
    "Shortlist the preferred team",
    "Request quote and confirm",
  ];
  const testimonials = [
    {
      name: "Riya & Aman",
      text: "The dummy detail flow makes it easy to compare packages, inclusions, and next steps.",
    },
    {
      name: "Neha Family",
      text: "Helpful layout for seeing pricing, service scope, and related wedding categories together.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />
      <main>
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="relative aspect-[16/11] overflow-hidden rounded border border-rose-100 bg-rose-50 shadow-sm">
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                style={{ objectPosition: item.position || "center" }}
              />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                {item.type || "Details"}
              </p>
              <h1 className="mt-3 font-serif text-5xl font-bold text-stone-950">
                {item.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                {brandTagline}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {["Verified vendors", "Flexible packages", "Fast inquiry"].map(
                  (feature) => (
                    <div
                      key={feature}
                      className="rounded border border-rose-100 bg-[#fff9f5] p-4 text-sm font-bold text-stone-800"
                    >
                      {feature}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-[#b61f4b] px-6 py-3 font-bold text-[#b61f4b] hover:bg-rose-50"
                >
                  Back Home
                </Link>
                <button
                  type="button"
                  onClick={() => setIsQuoteOpen(true)}
                  className="rounded-full bg-[#b61f4b] px-6 py-3 font-bold text-white hover:bg-[#981a3f]"
                >
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fff9f5] py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <aside className="rounded border border-rose-100 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-stone-950">
                Quick Details
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ["City", item.city || "Multiple cities"],
                  ["Category", item.type || "Wedding Service"],
                  ["Response", "Usually within 2 hours"],
                  ["Availability", "Open for 2026 bookings"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-rose-100 pb-3"
                  >
                    <dt className="font-semibold text-stone-500">{label}</dt>
                    <dd className="text-right font-bold text-stone-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>

            <div className="rounded border border-rose-100 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-stone-950">
                Dummy Overview
              </h2>
              <p className="mt-4 leading-8 text-stone-600">
                This detail page is a placeholder for the future vendor or
                service profile. It can later include real pricing, reviews,
                photo galleries, availability calendars, package inclusions, and
                booking forms. For now, it gives the website a complete browsing
                flow from homepage cards to category detail pages.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded border border-rose-100 bg-[#fff9f5] p-4 text-sm font-semibold leading-6 text-stone-700"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Packages
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">
                  Sample Pricing Options
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-stone-500">
                These are dummy packages to show how the final marketplace
                detail page can display pricing and inclusions.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {packages.map((pkg) => (
                <article
                  key={pkg.title}
                  className="rounded border border-rose-100 bg-[#fff9f5] p-6 shadow-sm"
                >
                  <h3 className="font-serif text-2xl font-bold">
                    {pkg.title}
                  </h3>
                  <p className="mt-3 text-xl font-bold text-[#b61f4b]">
                    {pkg.price}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {pkg.text}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-stone-700">
                    <li>Dedicated consultation</li>
                    <li>Vendor shortlist support</li>
                    <li>Dummy quote comparison</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fff9f5] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Gallery
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">
                  Photos & Inspiration
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-stone-500">
                A visual preview area for future vendor albums, decor concepts,
                venue photos, and real celebration moments.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image, index) => (
                <div
                  key={`${item.slug}-gallery-${index}`}
                  className="relative aspect-[4/5] overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                >
                  <Image
                    src={image}
                    alt={`${item.title} gallery ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: item.position || "center" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Inclusions
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">
                What this profile can include
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                Use this section to explain the exact planning, vendor, venue,
                or service support available for this category.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {serviceInclusions.map((inclusion) => (
                <div
                  key={inclusion}
                  className="rounded border border-rose-100 bg-[#fff9f5] p-4 text-sm font-bold text-stone-700"
                >
                  {inclusion}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#421321] py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffd18a]">
              Booking Flow
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold">
              Simple steps to move ahead
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {processSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded border border-white/15 bg-white/10 p-5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-bold text-[#421321]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-bold">{step}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Reviews
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">
                Sample client notes
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {testimonials.map((review) => (
                  <article
                    key={review.name}
                    className="rounded border border-rose-100 bg-[#fff9f5] p-5 shadow-sm"
                  >
                    <p className="text-sm leading-6 text-stone-600">
                      {review.text}
                    </p>
                    <h3 className="mt-4 text-sm font-bold text-stone-950">
                      {review.name}
                    </h3>
                  </article>
                ))}
              </div>
            </div>
            <aside className="rounded border border-rose-100 bg-[#fff9f5] p-6 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-stone-950">
                Need a quick quote?
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Share your event date, guest count, city, and preferred services
                to prepare a dummy quote request.
              </p>
              <button
                type="button"
                onClick={() => setIsQuoteOpen(true)}
                className="mt-6 w-full rounded-full bg-[#b61f4b] px-5 py-3 text-sm font-bold text-white hover:bg-[#981a3f]"
              >
                Request Quote
              </button>
            </aside>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-bold text-stone-950">
              More Wedding Categories
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vendorCategories.slice(0, 3).map((category) => (
                <Link
                  key={category.slug}
                  href={`/details/${category.slug}`}
                  className="group overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-2xl font-bold">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-sm text-stone-600">
                      {category.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
}

export function getStaticPaths() {
  const uniqueSlugs = [...new Set(allCards.map((item) => item.slug))];

  return {
    paths: uniqueSlugs.map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
}

export function getStaticProps({ params }) {
  const found = allCards.find((card) => card.slug === params.slug);
  const fallbackImage = vendorCategories[0].image;

  return {
    props: {
      item: found || {
        title: titleFromSlug(params.slug),
        slug: params.slug,
        image: fallbackImage,
        type: "Dummy Page",
        text: "This is a dummy detail page for the selected wedding marketplace item.",
      },
    },
  };
}
