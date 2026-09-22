import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import {
  brandTagline,
  destinationOptions,
  luxuryWeddingSection,
} from "@/data/homeData";

const luxuryServices = [
  {
    title: "Royal Venues",
    text: "Palaces, forts, five-star hotels, private estates, and grand ballrooms.",
  },
  {
    title: "Designer Decor",
    text: "Luxury mandaps, floral ceilings, couture stages, lighting, and tablescapes.",
  },
  {
    title: "Guest Hospitality",
    text: "Airport pickup, hotel blocks, welcome desks, gifting, and concierge teams.",
  },
  {
    title: "Celebrity Entertainment",
    text: "DJs, singers, live bands, anchors, choreographers, and artist coordination.",
  },
];

const packages = [
  {
    name: "Signature Luxury",
    price: "From Rs. 5,00,000",
    features: ["Premium vendor shortlist", "Decor concept board", "Two event planning"],
  },
  {
    name: "Royal Celebration",
    price: "From Rs. 12,00,000",
    features: ["Venue and guest logistics", "Designer decor planning", "Hospitality desk"],
  },
  {
    name: "Destination Couture",
    price: "Custom quote",
    features: ["Travel planning", "Multi-day celebration", "Concierge coordination"],
  },
];

export default function LuxuryWeddingPage() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />
      <main>
        <section className="relative isolate min-h-[520px] overflow-hidden">
          <Image
            src="/images/header-menu-luxury.png"
            alt="Luxury wedding palace celebration"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-4 py-16 text-white sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffd18a]">
                {luxuryWeddingSection.eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-5xl font-bold sm:text-6xl">
                Luxury Wedding
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88">
                {brandTagline}
              </p>
              <button
                type="button"
                onClick={() => setIsQuoteOpen(true)}
                className="mt-8 rounded-full bg-[#b61f4b] px-7 py-3 text-sm font-bold text-white hover:bg-[#981a3f]"
              >
                Plan My Luxury Wedding
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Curated Luxury
                </p>
                <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
                  Premium Wedding Services
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-stone-500">
                Build a complete luxury celebration with venues, decor,
                hospitality, entertainment, and destination planning under one
                coordinated flow.
              </p>
            </div>

            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {luxuryServices.map((service) => (
                <article
                  key={service.title}
                  className="rounded border border-rose-100 bg-[#fff9f5] p-5 shadow-sm"
                >
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {service.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="relative min-h-[420px] overflow-hidden rounded border border-rose-100 bg-white shadow-sm">
              <Image
                src="/images/header-menu-venues.png"
                alt="Luxury wedding venue"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover object-center"
              />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Planning Flow
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                Designed for grand celebrations
              </h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                From the first venue walkthrough to the final reception exit,
                our dummy luxury flow shows how a premium planning page can
                guide families through decisions with clarity.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Venue and room block planning",
                  "Multi-event decor coordination",
                  "Guest welcome and travel desk",
                  "Vendor shortlist and quote support",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded border border-rose-100 bg-white px-4 py-3 text-sm font-bold text-stone-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
              Packages
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
              Luxury Planning Packages
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {packages.map((item) => (
                <article
                  key={item.name}
                  className="rounded border border-rose-100 bg-[#fff9f5] p-6 shadow-sm"
                >
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-xl font-bold text-[#b61f4b]">
                    {item.price}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm font-semibold text-stone-600">
                    {item.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Destinations
                </p>
                <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
                  Luxury Wedding Destinations
                </h2>
              </div>
              <Link
                href="/destination/national-wedding"
                className="text-sm font-bold text-[#b61f4b]"
              >
                Explore destinations
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {destinationOptions.map((destination) => (
                <Link
                  key={destination.slug}
                  href={`/destination/${destination.slug}`}
                  className="group overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={destination.image}
                      alt={destination.title}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-2xl font-bold text-stone-950">
                      {destination.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {destination.text}
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
