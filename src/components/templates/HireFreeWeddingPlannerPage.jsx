import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import { brandTagline } from "@/data/homeData";

const plannerCards = [
  {
    name: "Golden Leaf Weddings",
    slug: "golden-leaf-weddings",
    city: "Greater Noida",
    rating: "4.8",
    reviews: "97 reviews",
    price: "Rs. 2,00,000",
    image: "/images/header-menu-destination.png",
    badges: ["Inhouse & outside decor", "Highly Experienced"],
    verified: true,
  },
  {
    name: "Subh Vivaah",
    slug: "subh-vivaah",
    city: "Greater Noida",
    rating: "5.0",
    reviews: "15 reviews",
    price: "Rs. 2,50,000",
    image: "/images/header-menu-real-weddings.png",
    badges: ["Theme planning", "Premium hospitality"],
  },
  {
    name: "Addy Event & Artist Management",
    slug: "addy-event-artist-management",
    city: "Noida, Greater Noida",
    rating: "4.9",
    reviews: "107 reviews",
    price: "Rs. 2,00,000",
    image: "/images/header-menu-vendors.png",
    badges: ["Inhouse & outside decor", "Artist management"],
  },
  {
    name: "The Wedding Chapter",
    slug: "the-wedding-chapter",
    city: "Greater Noida",
    rating: "4.7",
    reviews: "54 reviews",
    price: "Rs. 1,75,000",
    image: "/images/header-menu-luxury.png",
    badges: ["Luxury weddings", "Venue coordination"],
    verified: true,
  },
  {
    name: "Mandap Stories",
    slug: "mandap-stories",
    city: "Delhi NCR",
    rating: "4.8",
    reviews: "72 reviews",
    price: "Rs. 1,50,000",
    image: "/images/header-menu-venues.png",
    badges: ["Ritual planning", "Family events"],
  },
  {
    name: "Aarambh Events",
    slug: "aarambh-events",
    city: "Noida",
    rating: "4.6",
    reviews: "43 reviews",
    price: "Rs. 1,25,000",
    image: "/images/header-menu-destination.png",
    badges: ["Budget planning", "Vendor shortlist"],
  },
];

const planningHighlights = [
  {
    title: "Venue Shortlisting",
    text: "Compare hotels, lawns, resorts, banquets, and farmhouses based on guest count, budget, and event flow.",
    image: "/images/header-menu-venues.png",
  },
  {
    title: "Vendor Coordination",
    text: "Bring decor, photography, makeup, catering, entertainment, invitations, and hospitality into one plan.",
    image: "/images/header-menu-vendors.png",
  },
  {
    title: "Family Hospitality",
    text: "Plan guest welcome, travel desk, pickup, stay coordination, gifting, and ceremony movement without confusion.",
    image: "/images/header-menu-real-weddings.png",
  },
];

const plannerPackages = [
  {
    title: "Essential Planning",
    price: "Rs. 75,000 onwards",
    items: ["Vendor shortlist", "Budget tracker", "Single event support"],
  },
  {
    title: "Complete Wedding",
    price: "Rs. 2,00,000 onwards",
    items: ["Venue visits", "Decor coordination", "Guest logistics"],
  },
  {
    title: "Luxury Destination",
    price: "Custom quote",
    items: ["Travel desk", "Multi-day planning", "Premium vendor team"],
  },
];

const planningSteps = [
  "Share city, date, guest count, and budget",
  "Review planner profiles and package options",
  "Shortlist venues, decor, food, and photo teams",
  "Finalize schedule, rituals, guest flow, and quotes",
];

const cityServices = [
  "Greater Noida",
  "Noida",
  "Delhi NCR",
  "Gurugram",
  "Ghaziabad",
  "Faridabad",
];

const faqs = [
  {
    question: "Can I hire only for venue visits?",
    answer: "Yes. The dummy flow supports venue-only help, complete planning, and multi-event coordination.",
  },
  {
    question: "Do planners handle vendor meetings?",
    answer: "Yes. Planners can coordinate decorators, caterers, photographers, makeup artists, and hospitality teams.",
  },
  {
    question: "Is destination planning included?",
    answer: "Destination planning can be added for resorts, palace venues, beach weddings, and luxury hotel events.",
  },
];

function SearchIcon() {
  return (
    <span className="relative h-5 w-5 text-stone-400" aria-hidden="true">
      <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-current" />
      <span className="absolute bottom-0 right-0 h-2.5 w-0.5 rotate-[-45deg] rounded-full bg-current" />
    </span>
  );
}

function PinIcon() {
  return (
    <span className="relative h-5 w-4 text-stone-400" aria-hidden="true">
      <span className="absolute left-1 top-0 h-3.5 w-3.5 rotate-45 rounded-full rounded-br-none bg-current" />
      <span className="absolute left-[7px] top-[5px] h-1.5 w-1.5 rounded-full bg-white" />
    </span>
  );
}

export default function HireFreeWeddingPlannerPage() {
  return (
    <div className="min-h-screen bg-white text-stone-900">
      <Header />
      <main className="bg-white">
        <section className="py-5 sm:py-7">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
                  Wedding Planners in Greater Noida
                </h1>
                <p className="mt-1 text-base font-medium text-stone-800">
                  {brandTagline}
                </p>
              </div>

              <label className="flex h-14 w-full items-center gap-3 rounded border border-stone-200 bg-white px-4 text-stone-500 shadow-sm sm:w-80">
                <SearchIcon />
                <input
                  placeholder="Search Wedding Planners ..."
                  className="w-full text-sm font-medium outline-none sm:text-base"
                />
              </label>
            </div>

            <div className="mt-10 grid gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
              {plannerCards.map((planner) => (
                <article
                  key={planner.name}
                  className="overflow-hidden rounded-lg bg-white shadow-[0_10px_28px_rgb(0_0_0_/_0.08)]"
                >
                  <Link
                    href={`/details/${planner.slug}`}
                    className="group block w-full text-left"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-rose-50">
                      <Image
                        src={planner.image}
                        alt={planner.name}
                        fill
                        sizes="(min-width: 1280px) 31vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover object-center transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm font-black text-stone-500 shadow-sm">
                        i
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-1 text-lg font-bold text-stone-800 sm:text-xl">
                          {planner.name}
                          {planner.verified ? (
                            <span className="ml-2 inline-grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-xs text-white">
                              V
                            </span>
                          ) : null}
                        </h2>
                        <div className="flex shrink-0 items-center gap-1 text-sm">
                          <span className="text-[#e72f78]">*</span>
                          <span className="font-semibold text-stone-800">
                            {planner.rating}
                          </span>
                          <span className="text-xs text-stone-500">
                            ({planner.reviews})
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-stone-500">
                        <PinIcon />
                        {planner.city}
                      </p>
                      <p className="mt-2 text-xs font-medium text-stone-500">
                        Planning Fee
                      </p>
                      <p className="mt-1 text-xl font-bold text-stone-800">
                        {planner.price}
                        <span className="ml-2 text-xs font-medium">
                          Onwards
                        </span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {planner.badges.map((badge) => (
                          <span
                            key={badge}
                            className="max-w-[190px] truncate bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700"
                          >
                            {badge}
                          </span>
                        ))}
                        <span className="px-1 py-1 text-xs font-bold text-stone-500 underline">
                          +3 more
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fff9f5] py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  Planning Support
                </p>
                <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
                  What a wedding planner can manage
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-stone-600">
                Pick a planner for the exact level of help you need, from a
                single ceremony to a full family wedding weekend.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {planningHighlights.map((item) => (
                <article
                  key={item.title}
                  className="overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-2xl font-bold text-stone-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
              Packages
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
              Popular planning packages
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {plannerPackages.map((pkg) => (
                <article
                  key={pkg.title}
                  className="rounded border border-rose-100 bg-[#fff9f5] p-6 shadow-sm"
                >
                  <h3 className="font-serif text-2xl font-bold text-stone-950">
                    {pkg.title}
                  </h3>
                  <p className="mt-3 text-xl font-bold text-[#b61f4b]">
                    {pkg.price}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm font-semibold text-stone-600">
                    {pkg.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Process
              </p>
              <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
                From shortlist to wedding day
              </h2>
              <p className="mt-4 text-lg leading-8 text-stone-600">
                The planner page keeps the workflow simple so families can move
                from discovery to quote conversations quickly.
              </p>
            </div>
            <div className="grid gap-3">
              {planningSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded border border-rose-100 bg-white p-4 shadow-sm"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b61f4b] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="self-center text-sm font-bold text-stone-700">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded border border-rose-100 bg-[#421321] p-6 text-white shadow-sm sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffd18a]">
                    Service Areas
                  </p>
                  <h2 className="mt-2 font-serif text-4xl font-bold">
                    Wedding planners across NCR
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-rose-50/80">
                    Explore planner profiles for city weddings, farmhouse
                    events, hotel weddings, and destination-style celebrations.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {cityServices.map((city) => (
                    <Link
                      key={city}
                      href={`/details/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-wedding-planners`}
                      className="rounded border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white hover:text-[#421321]"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
              Questions
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold text-stone-950">
              Wedding planning FAQs
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="rounded border border-rose-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-base font-bold text-stone-950">
                    {faq.question}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
