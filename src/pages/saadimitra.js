import Image from "next/image";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import {
  destinationOptions,
  stories,
} from "@/data/homeData";

const heroFeatures = [
  { title: "Tailored", text: "Vendor Picks", icon: "search" },
  { title: "Best", text: "Deals", icon: "deal" },
  { title: "Expert Help &", text: "Support", icon: "support" },
];

const packages = [
  {
    title: "SaadiMitra Venue Assist",
    price: "Free",
    text: "Get venue and vendor suggestions matched to your city, budget, dates, and guest count.",
    features: ["Tailored vendor picks", "Budget range guidance", "Callback from planning team"],
  },
  {
    title: "SaadiMitra Complete",
    price: "Rs. 999",
    text: "For families who want deeper support with shortlists, vendor calls, and package comparison.",
    features: ["Multiple category shortlist", "Best deal assistance", "Priority planning support"],
    featured: true,
  },
  {
    title: "Destination Wedding Help",
    price: "Custom",
    text: "For India and abroad celebrations with venue, travel, decor, and hospitality planning help.",
    features: ["Destination shortlist", "Guest stay guidance", "Premium vendor matching"],
  },
];

const helpCards = [
  {
    title: "Tell us your requirements",
    text: "Share your date, city, budget, guest count, and the kind of wedding vendors you are looking for.",
  },
  {
    title: "Get curated options",
    text: "SaadiMitra reviews your preferences and suggests suitable venues, vendors, and package paths.",
  },
  {
    title: "Connect and book",
    text: "Move ahead with quote calls, availability checks, and clearer vendor conversations.",
  },
];

const serviceChips = [
  "Venues",
  "Vendors",
  "Decor",
  "Photography",
  "Makeup",
  "Catering",
  "Destination Wedding",
  "Planning",
];

function FeatureIcon({ type }) {
  if (type === "deal") {
    return (
      <span className="relative block h-12 w-12 text-[#e72f78]" aria-hidden="true">
        <span className="absolute left-1 top-4 h-6 w-9 -rotate-12 rounded border-2 border-current" />
        <span className="absolute left-5 top-5 h-2 w-2 rounded-full border-2 border-current" />
      </span>
    );
  }

  if (type === "support") {
    return (
      <span className="relative block h-12 w-12 text-[#e72f78]" aria-hidden="true">
        <span className="absolute left-2 top-3 h-8 w-8 rounded-full border-2 border-current" />
        <span className="absolute left-0 top-6 h-3 w-2 rounded border-2 border-current bg-white" />
        <span className="absolute right-0 top-6 h-3 w-2 rounded border-2 border-current bg-white" />
        <span className="absolute bottom-1 left-6 h-2 w-4 rounded-full border-b-2 border-current" />
      </span>
    );
  }

  return (
    <span className="relative block h-12 w-12 text-[#e72f78]" aria-hidden="true">
      <span className="absolute left-1 top-1 h-8 w-8 rounded-full border-2 border-current" />
      <span className="absolute bottom-1 right-1 h-5 w-0.5 -rotate-45 rounded-full bg-current" />
    </span>
  );
}

export default function SaadiMitraPage() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] text-stone-900">
      <Header />
      <main>
        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-stone-800">
              SaadiMitra Service
            </h1>

            <div className="mt-6 overflow-hidden rounded bg-white shadow-[0_14px_45px_rgb(15_23_42_/_0.10)]">
              <div className="grid min-h-[500px] lg:grid-cols-[0.95fr_1.05fr]">
                <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e72f78]">
                    Epic Wedz
                  </p>
                  <div className="mt-1 font-serif text-4xl font-black leading-none text-[#e72f78] sm:text-5xl">
                    Saadi
                  </div>
                  <p className="mt-1 text-base font-black text-[#e72f78] sm:text-lg">
                    Mitra Virtual Planning Service
                  </p>

                  <h2 className="mt-9 max-w-2xl text-2xl font-black leading-tight text-stone-950 sm:text-3xl">
                    The smart way to find venues & vendors for your wedding
                  </h2>

                  <div className="mt-10 grid gap-5 sm:grid-cols-3">
                    {heroFeatures.map((feature, index) => (
                      <div
                        key={feature.text}
                        className={`flex items-center gap-3 ${
                          index > 0 ? "sm:border-l sm:border-stone-300 sm:pl-5" : ""
                        }`}
                      >
                        <FeatureIcon type={feature.icon} />
                        <p className="text-xs font-black leading-4 text-stone-950 sm:text-sm">
                          {feature.title}
                          <br />
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative min-h-[360px] overflow-hidden">
                  <Image
                    src={stories[1].image}
                    alt="Couple exploring wedding vendors on phone"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: stories[1].position || "center" }}
                  />
                  <div className="absolute inset-y-0 left-0 hidden w-40 bg-gradient-to-r from-white to-transparent lg:block" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-stone-800">
              Select Package
            </h2>
            <p className="mt-2 text-sm font-medium text-stone-500">
              SaadiMitra can help out!
            </p>

            <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-5 md:grid-cols-3">
                {packages.map((pkg) => (
                  <article
                    key={pkg.title}
                    className={`rounded border bg-white p-6 shadow-sm ${
                      pkg.featured
                        ? "border-[#e72f78] shadow-[0_16px_38px_rgb(231_47_120_/_0.14)]"
                        : "border-stone-200"
                    }`}
                  >
                    {pkg.featured ? (
                      <span className="rounded-full bg-[#e72f78] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                        Popular
                      </span>
                    ) : null}
                    <h3 className="mt-4 text-base font-black text-stone-900">
                      {pkg.title}
                    </h3>
                    <p className="mt-3 text-xl font-black text-[#e72f78]">
                      {pkg.price}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {pkg.text}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm font-bold text-stone-700">
                      {pkg.features.map((feature) => (
                        <li key={feature}>+ {feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setIsQuoteOpen(true)}
                      className="mt-6 h-11 w-full rounded bg-[#e72f78] px-5 text-sm font-black text-white hover:bg-[#c81f61]"
                    >
                      Select Package
                    </button>
                  </article>
                ))}
              </div>

              <aside className="rounded border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-stone-900">
                  Tell us your requirement
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Get personalized vendor picks, best deal assistance, and
                  planning support from the Epic Wedz team.
                </p>
                <form className="mt-5 grid gap-3">
                  <input
                    className="h-12 rounded border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-[#e72f78]"
                    placeholder="Name"
                  />
                  <input
                    className="h-12 rounded border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-[#e72f78]"
                    placeholder="Phone number"
                  />
                  <input
                    className="h-12 rounded border border-stone-200 px-3 text-sm font-semibold outline-none focus:border-[#e72f78]"
                    placeholder="Wedding city"
                  />
                  <select className="h-12 rounded border border-stone-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#e72f78]">
                    <option>Venue and vendors</option>
                    <option>Only venues</option>
                    <option>Destination wedding</option>
                    <option>Complete wedding planning</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsQuoteOpen(true)}
                    className="h-12 rounded bg-[#e72f78] px-5 text-sm font-black text-white hover:bg-[#c81f61]"
                  >
                    Get Help
                  </button>
                </form>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {helpCards.map((card, index) => (
                <article
                  key={card.title}
                  className="rounded border border-stone-200 bg-[#fafafa] p-6"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e72f78] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-base font-black text-stone-900">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {card.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#e72f78]">
                What we cover
              </p>
              <h2 className="mt-3 text-xl font-black text-stone-900 sm:text-2xl">
                Find the right wedding team faster
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                SaadiMitra helps you shortlist options across venues, vendors,
                destination weddings, and planning support so you can start
                conversations with more clarity.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {serviceChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
              <Image
                src={destinationOptions[1].image}
                alt="Destination wedding planning support"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#e72f78] py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/75">
                SaadiMitra
              </p>
              <h2 className="mt-2 text-xl font-black">
                Ready to find your wedding vendors?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsQuoteOpen(true)}
              className="h-12 rounded bg-white px-7 text-sm font-black text-[#e72f78]"
            >
              Start Now
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </div>
  );
}
