import { websiteContent } from '@/data/websiteContent.mjs';
import { WebsiteSeo, WebsiteSections } from '@/components/common/WebsiteContent';
import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import {
  destinationOptions,
  internationalDestinationCircles,
  nationalDestinationCircles,
} from "@/data/homeData";

const pageCopy = {
  "national-wedding": {
    eyebrow: "India destination wedding",
    headline: "National Wedding Destinations",
    lead: "Plan palace, beach, hill, and heritage celebrations across India with venue shortlists, decor concepts, hospitality support, and guest-friendly travel ideas.",
    highlights: ["Jaipur palace venues", "Goa beach resorts", "Udaipur lakeside stays"],
    itinerary: ["Welcome dinner with local flavors", "Haldi and mehendi by the pool", "Mandap ceremony with regional styling"],
  },
  "international-wedding": {
    eyebrow: "Global destination wedding",
    headline: "International Wedding Destinations",
    lead: "Explore luxury wedding escapes beyond India with seaside resorts, elegant ballrooms, curated travel planning, and premium vendor coordination.",
    highlights: ["Bali resort weddings", "Dubai luxury ballrooms", "Mediterranean seaside vows"],
    itinerary: ["Arrival brunch for close family", "Sunset cocktail celebration", "Reception dinner with destination styling"],
  },
};

export default function DestinationPage({ destination }) {
  const copy = pageCopy[destination.slug];
  const circleDestinations =
    destination.slug === "international-wedding"
      ? internationalDestinationCircles
      : nationalDestinationCircles;
  const circleCopy =
    destination.slug === "international-wedding"
      ? {
          eyebrow: "Popular countries",
          title: "International wedding destinations",
          text: "Explore premium country options for beach, city, villa, and resort-style weddings.",
        }
      : {
          eyebrow: "States and cities",
          title: "National wedding destinations",
          text: "Browse Indian states and cities loved for palace, beach, backwater, and lakeside weddings.",
        };

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <WebsiteSeo pageKey="destinations" title={`${copy.headline} | Epic Wedz`} path={`/destination/${destination.slug}`} />
      <Header />
      <main>
        <section className="relative isolate min-h-[430px] overflow-hidden">
          <Image
            src={destination.image}
            alt={destination.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: destination.position || "center" }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto flex min-h-[430px] max-w-4xl flex-col items-center justify-center px-4 text-center text-white sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ffd18a]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">
              {copy.headline}
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/85">
              {websiteContent.destinations.subtitle}
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
              <div className="mx-auto max-w-3xl px-6 pb-8 pt-10 text-center sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b61f4b]">Curated Experience</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">Build a celebration guests remember</h2>
                <p className="mt-4 text-sm leading-7 text-stone-600">{copy.lead}</p>
              </div>
              <div className="grid items-stretch gap-6 p-4 pt-0 sm:p-6 sm:pt-0 lg:grid-cols-2 lg:gap-10">
                <div className="relative min-h-[260px] overflow-hidden rounded-2xl sm:min-h-[340px]">
                  <Image src={circleDestinations[0]?.image || destination.image} alt={circleDestinations[0]?.title || destination.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center py-4 sm:pr-6">
                  <p className="text-sm leading-7 text-stone-600">{destination.text} {websiteContent.destinations.sections[2].paragraphs[0]}</p>
                  <ul className="mt-6 space-y-3">
                    {copy.highlights.map((item, index) => <li key={item} className="flex items-center gap-3 rounded-xl bg-[#fff9f5] px-4 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rose-200 text-xs text-[#b61f4b]">{String(index + 1).padStart(2, '0')}</span><h3 className="text-sm font-semibold text-stone-900">{item}</h3></li>)}
                  </ul>
                  <Link href="/marketplace" className="mt-7 inline-flex items-center justify-center gap-3 self-start rounded-full border border-[#b61f4b] px-5 py-2.5 text-xs font-normal text-[#b61f4b] hover:bg-rose-50">Explore Marketplace <span aria-hidden="true">&rarr;</span></Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                {circleCopy.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                {circleCopy.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                {circleCopy.text}
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {circleDestinations.map((item) => (
                <div
                  key={item.title}
                  className="group rounded border border-rose-100 bg-[#fff9f5] p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#b61f4b] hover:shadow-xl"
                >
                  <div className="mx-auto h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-rose-100">
                    <Image
                      src={item.image}
                      alt={`${item.title} wedding destination`}
                      width={220}
                      height={220}
                      sizes="160px"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                    {item.type}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-stone-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="relative aspect-[16/11] overflow-hidden rounded border border-rose-100 shadow-sm">
                <Image
                  src={destination.image}
                  alt={`${destination.title} planning`}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Sample Plan
                </p>
                <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                  A destination wedding flow
                </h2>
                <div className="mt-7 space-y-3">
                  {copy.itinerary.map((item, index) => (
                    <div
                      key={item}
                      className="flex gap-4 rounded border border-rose-100 bg-[#fff9f5] p-4"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b61f4b] text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="pt-1 font-semibold text-stone-800">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <WebsiteSections pageKey="destinations" />
      </main>
      <Footer />
    </div>
  );
}

export function getStaticPaths() {
  return {
    paths: destinationOptions.map((destination) => ({
      params: { slug: destination.slug },
    })),
    fallback: false,
  };
}

export function getStaticProps({ params }) {
  const destination = destinationOptions.find((item) => item.slug === params.slug);

  return {
    props: {
      destination,
    },
  };
}
