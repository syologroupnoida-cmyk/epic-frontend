import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import {
  brandTagline,
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
              {brandTagline}
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Curated Experience
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                Build a celebration guests remember
              </h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                {destination.text} Our dummy page layout includes venue themes,
                itinerary ideas, and planning cards ready for real destination
                data later.
              </p>
              <Link
                href="/marketplace"
                className="mt-8 inline-flex rounded-full bg-[#b61f4b] px-7 py-3 text-sm font-bold text-white hover:bg-[#981a3f]"
              >
                Explore Marketplace
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {copy.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded border border-rose-100 bg-white p-5 shadow-sm"
                >
                  <p className="font-serif text-2xl font-bold text-stone-950">
                    {item}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    Premium venue, decor, travel, and guest experience planning.
                  </p>
                </div>
              ))}
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
