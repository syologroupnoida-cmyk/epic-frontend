import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import CitySearch from "@/components/common/CitySearch";
import QuoteModal from "@/components/common/QuoteModal";
import MainApi from "@/util/MainApi";
import WeddingCategoryDirectory from "@/components/common/WeddingCategoryDirectory";
import {
  brandTagline,
  heroSlides,
  heroPills,
  invitationCards,
  blogPosts,
  marketplaceCards,
  luxuryWeddingSection,
  weddingDestinationSection,
  destinationOptions,
  serviceSections,
  stories,
  vendorCategories,
} from "@/data/homeData";

function detailHref(slug) {
  return `/details/${slug}`;
}

const latestNews = [
  {
    title: "Pastel mandaps are leading summer wedding decor",
    tag: "Decor",
    text: "Couples are choosing softer palettes, layered florals, and warmer aisle lighting.",
    image: vendorCategories[3].image,
  },
  {
    title: "Destination wedding inquiries rise for beach venues",
    tag: "Venues",
    text: "Goa-style ceremonies and resort weekends remain top choices for intimate guest lists.",
    image: stories[1].image,
  },
  {
    title: "Interactive food counters become reception favorites",
    tag: "Catering",
    text: "Live chaat, dessert, and regional counters are shaping modern wedding menus.",
    image: vendorCategories[4].image,
  },
  {
    title: "Candid film teams now bundle same-day edits",
    tag: "Photo",
    text: "Short highlight films are becoming a must-have for reception nights.",
    image: vendorCategories[1].image,
  },
  {
    title: "Digital invites become family-friendly",
    tag: "Invites",
    text: "Couples are pairing printed cards with easy online RSVP links.",
    image: invitationCards[0].image,
  },
];


const planningTiles = [
  {
    title: "Wedding Website",
    text: "Create a polished wedding page with story, events, gallery, and RSVP details.",
    image: invitationCards[2].image,
    href: detailHref("wedding-website"),
  },
  {
    title: "Wedding Vogue",
    text: "See trending ideas, bridal looks, decor notes, rituals, and planning inspiration.",
    image: blogPosts[3].image,
    href: "/blog",
  },
  {
    title: "Vendors",
    text: "Find verified wedding vendors within your budget and preferred city.",
    image: vendorCategories[0].image,
    href: "/marketplace",
  },
  {
    title: "Real Wedding",
    text: "Browse real celebrations for customs, venues, outfits, and photo ideas.",
    image: stories[2].image,
    href: detailHref(stories[2].slug),
  },
];

const ideaServiceItems = [
  { title: "Wedding Venues", href: "/marketplace", position: "0% 0%" },
  { title: "Bridal Makeup", href: detailHref("bridal-makeup"), position: "33.333% 0%" },
  { title: "Mehndi Designs", href: detailHref("mehendi"), position: "66.666% 0%" },
  { title: "Photography", href: detailHref("photographers"), position: "100% 0%" },
  { title: "Wedding Decor", href: detailHref("decorators"), position: "0% 100%" },
  { title: "Catering", href: detailHref("caterers"), position: "33.333% 100%" },
  { title: "Invitations", href: detailHref("wedding-invitation"), position: "66.666% 100%" },
  { title: "Destination", href: "/destination/national-wedding", position: "100% 100%" },
];

const weddingServiceCards = [
  {
    title: "Makeup Artist",
    image: vendorCategories[2].image,
    href: detailHref("bridal-makeup"),
  },
  {
    title: "Photographers",
    image: vendorCategories[1].image,
    href: detailHref("photographers"),
  },
  {
    title: "Wedding Planners",
    image: serviceSections[0].image,
    href: detailHref("wedding-planners"),
  },
  {
    title: "Caterers",
    image: vendorCategories[4].image,
    href: detailHref("caterers"),
  },
  {
    title: "Mehendi Artist",
    image: vendorCategories[5].image,
    href: detailHref("mehendi"),
  },
  {
    title: "Venues",
    image: vendorCategories[0].image,
    href: "/marketplace",
  },
];

const fallbackServiceOptions = [
  "Wedding Venues",
  "Wedding Photographers",
  "Bridal Makeup Artist",
  "Wedding Planners",
];

const heroStats = [
  { value: 73000, suffix: "+", label: "Trusted Vendors" },
  { value: 176, suffix: "", label: "Cities Served" },
  { value: 50000, suffix: "+", label: "Happy Customers" },
  { value: 1200, suffix: "+", label: "Destination Experts" },
];

const inspirationSnaps = [
  stories[0],
  stories[1],
  stories[2],
  { ...vendorCategories[3], title: "Floral Decor" },
  { ...vendorCategories[1], title: "Candid Frames" },
  { ...luxuryWeddingSection, title: "Luxury Details" },
];

const destinationHighlights = [
  "Palace & heritage venues",
  "Beachside resort weddings",
  "Travel and guest logistics",
  "Decor, food, and hospitality",
];

function SectionHeader({ eyebrow, title, text, dark = false }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={`text-xs font-bold uppercase tracking-[0.18em] ${
          dark ? "text-[#ffd18a]" : "text-[#b61f4b]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-2 font-serif text-2xl font-bold sm:text-3xl ${
          dark ? "text-white" : "text-stone-950"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 text-sm leading-6 ${
          dark ? "text-rose-50/85" : "text-stone-600"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function CountUpStat({ value, suffix, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frameId;
    const duration = 1400;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <div className="rounded border border-rose-100 bg-white p-4 text-center shadow-sm">
      <p className="font-serif text-2xl font-bold text-[#b61f4b] sm:text-3xl">
        {count.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-1 text-xs font-bold text-stone-700">{label}</p>
    </div>
  );
}

function normalizeServiceCategories(responseData) {
  const data = responseData?.data || responseData || {};
  const rawList = data.items || data.results || data.categories || data.data || [];

  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((category) => ({
      id: category?.id || category?._id || category?.serviceCategoryId || category?.name || category?.title || "",
      name: category?.name || category?.title || "",
    }))
    .filter((category) => category.id && category.name);
}


function ImageCard({ item }) {
  return (
    <Link
      href={detailHref(item.slug)}
      className="group block overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          style={{ objectPosition: item.position || "center" }}
        />
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl font-bold text-stone-950">
          {item.title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-stone-600">{item.text}</p>
        <span className="mt-4 inline-flex text-sm font-bold text-[#b61f4b]">
          View Details
        </span>
      </div>
    </Link>
  );
}

function HeroSelect({ value, options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="mui-menu-select group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="mui-menu-button"
      >
        <span className="service-select-icon" aria-hidden="true" />
        <span>{value}</span>
        <span aria-hidden="true" className="mui-menu-chevron" />
      </button>
      <div className={`mui-menu-options ${isOpen ? "is-open" : ""}`}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onSelect(option);
              setIsOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [selectedService, setSelectedService] = useState("Wedding Venues");
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState("Delhi NCR");
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const serviceOptions = serviceCategories.length
    ? serviceCategories.map((category) => category.name)
    : fallbackServiceOptions;

  useEffect(() => {
    let isMounted = true;

    async function loadServiceCategories() {
      try {
        const response = await MainApi.get("/service-categories");
        if (!isMounted) return;

        const nextCategories = normalizeServiceCategories(response.data);
        setServiceCategories(nextCategories);

        if (nextCategories.length) {
          setSelectedService((current) =>
            fallbackServiceOptions.includes(current) ? nextCategories[0].name : current
          );
        }
      } catch {
        if (isMounted) setServiceCategories([]);
      }
    }

    loadServiceCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />

      <main>
        <section className="relative isolate z-20 min-h-[620px] overflow-visible bg-[#16080d]">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide.alt}
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="hero-slide object-cover object-top"
              style={{ animationDelay: `${index * 5}s` }}
            />
          ))}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2f0b17]/20 via-transparent to-[#2f0b17]/60" />

          <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
            <div className="w-full pt-8 text-left text-white">
              <div className="relative h-[132px] max-w-3xl sm:h-[150px]">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.title}
                    className="hero-copy absolute inset-0 flex flex-col items-start justify-center"
                    style={{ animationDelay: `${index * 5}s` }}
                  >
                    <h1 className="hero-title-typing font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                      {slide.title}
                    </h1>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-white/90">
                Epic - {brandTagline}
              </p>

              <div className="mt-7 flex max-w-3xl flex-wrap gap-3">
                {heroPills.map((item) => (
                  <Link
                    key={item.slug}
                    href="#"
                    className="rounded-full border border-white px-5 py-2 text-sm font-bold text-white hover:bg-white hover:text-[#8f1f3f]"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hero-search-panel relative z-30 w-full rounded p-4 pt-10 shadow-2xl backdrop-blur-md lg:justify-self-end">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 text-center font-serif text-lg font-bold leading-tight text-white sm:text-xl">
                Search your dream wedding
              </span>
              <div className="grid gap-3">
                <HeroSelect
                  value={selectedService}
                  onSelect={setSelectedService}
                  options={serviceOptions}
                />
                <CitySearch
                  value={selectedCity}
                  onSelect={setSelectedCity}
                  buttonClassName="mui-menu-button"
                  panelClassName="w-full"
                  variant="hero"
                />
                <button
                  type="button"
                  onClick={() => setIsQuoteOpen(true)}
                  className="h-14 rounded bg-[#b61f4b] px-7 text-sm font-bold text-white shadow-lg hover:bg-[#981a3f]"
                >
                  Get a Free quote
                </button>
              </div>
            </div>
          </div>
        </section>

        <WeddingCategoryDirectory />

        <section className="relative z-0 bg-white py-5 sm:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <CountUpStat
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              ))}
            </div>
          </div>
        </section>


        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {planningTiles.map((tile) => (
                <Link
                  key={tile.title}
                  href={tile.href}
                  className="group overflow-hidden rounded border border-rose-100 bg-[#fff9f5] shadow-sm"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={tile.image}
                      alt={tile.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-xl font-bold text-stone-950">
                      {tile.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-stone-600">
                      {tile.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#421321] py-10 text-white sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Wedding Inspiration"
              title="Ideas For Every Wedding Mood"
              text="Browse the planning topics couples usually search before booking vendors, from beauty and decor to rituals and destination weddings."
              dark
            />
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {ideaServiceItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col items-center text-center"
                >
                  <span className="grid h-[88px] w-[88px] place-items-center rounded-full border border-white/10 bg-white/5 p-0.5 shadow-md shadow-black/10 transition duration-300 group-hover:-translate-y-1 group-hover:bg-white/15">
                    <span
                      className="block h-full w-full rounded-full bg-cover bg-no-repeat"
                      style={{
                        backgroundImage: "url('/images/ideas-services-sprite.png')",
                        backgroundPosition: item.position,
                        backgroundSize: "400% 200%",
                      }}
                    />
                  </span>
                  <span className="mt-3 text-xs font-bold leading-4 text-white group-hover:text-[#ffd18a]">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded border border-rose-100 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
                <div className="bg-[#fff9f5] p-6 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                    Getting married soon?
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-bold text-stone-950 sm:text-3xl">
                    Book Wedding Services Here
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
                    Choose the service you need and get curated vendor options
                    across price, style, city, and event type.
                  </p>
                  <div className="mt-5 grid gap-2 text-xs font-bold text-stone-700 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <span className="rounded bg-white px-3 py-2 shadow-sm">
                      Verified vendors
                    </span>
                    <span className="rounded bg-white px-3 py-2 shadow-sm">
                      Fast quotes
                    </span>
                    <span className="rounded bg-white px-3 py-2 shadow-sm">
                      City-wise shortlist
                    </span>
                    <span className="rounded bg-white px-3 py-2 shadow-sm">
                      Budget-friendly options
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuoteOpen(true)}
                    className="mt-6 rounded bg-[#b61f4b] px-7 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#981a3f]"
                  >
                    Get Free Quotation
                  </button>
                </div>
                <div className="grid gap-px bg-rose-100 sm:grid-cols-2 lg:grid-cols-3">
                  {weddingServiceCards.map((service) => (
                    <Link
                      key={service.title}
                      href={service.href}
                      className="group relative min-h-[148px] overflow-hidden bg-stone-900"
                    >
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2f0b17]/75 via-[#2f0b17]/8 to-transparent" />
                      <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-black text-white">
                        {service.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fff9f5] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Real Weddings' Stories"
              title="Feel The Customs And Celebrations"
              text="See real wedding pictures and celebration ideas across cities, cultures, outfits, venues, and decor styles."
            />
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {stories.map((story) => (
                <ImageCard key={story.slug} item={story} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                Download Our Wedding App Today
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-stone-950 sm:text-3xl">
                Plan, shortlist, and collect ideas anywhere
              </h2>
              <ul className="mt-4 grid gap-2 text-sm font-bold text-stone-700">
                <li>Book wedding vendors.</li>
                <li>Browse wedding ideas.</li>
                <li>Get a free wedding checklist.</li>
              </ul>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="tel"
                  placeholder="Enter your mobile no. to get the link"
                  className="h-11 min-w-0 rounded border border-rose-200 bg-white px-4 text-xs font-bold outline-none focus:border-[#b61f4b] sm:flex-1"
                />
                <button
                  type="button"
                  className="h-11 rounded bg-[#b61f4b] px-6 text-xs font-bold text-white hover:bg-[#981a3f]"
                >
                  Send Link
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {inspirationSnaps.map((snap, index) => (
                <div
                  key={`${snap.slug}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded border border-rose-100 bg-[#fff9f5]"
                >
                  <Image
                    src={snap.image}
                    alt={snap.title}
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    style={{ objectPosition: snap.position || "center" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="E-Invite"
              title="Customize Free Online Invitations"
              text="Choose image-based invitation cards for mehndi, engagement, wedding, and reception events."
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {invitationCards.map((card) => (
                <Link
                  key={card.slug}
                  href={detailHref(card.slug)}
                  className="group block overflow-hidden rounded border border-rose-100 bg-white p-4 shadow-sm"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-stone-600">
                    {card.text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded border border-rose-100 bg-[#fff9f5] shadow-sm">
              <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
                <div className="flex flex-col justify-between gap-8 p-6 sm:p-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                      {weddingDestinationSection.eyebrow}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-bold text-stone-950 sm:text-3xl">
                      {weddingDestinationSection.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {weddingDestinationSection.text}
                    </p>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {destinationHighlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/destination/national-wedding"
                    className="inline-flex w-fit rounded-full bg-[#b61f4b] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[#981a3f]"
                  >
                    Explore Destinations
                  </Link>
                </div>

                <div className="grid gap-px bg-rose-100 md:grid-cols-2">
                  {destinationOptions.map((destination, index) => (
                    <Link
                      key={destination.slug}
                      href={`/destination/${destination.slug}`}
                      className="group relative min-h-[300px] overflow-hidden bg-stone-900 md:min-h-[360px]"
                    >
                      <Image
                        src={destination.image}
                        alt={destination.title}
                        fill
                        sizes="(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                        style={{ objectPosition: destination.position || "center" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2f0b17]/80 via-[#2f0b17]/12 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffd18a] backdrop-blur">
                          {index === 0 ? "Within India" : "Around The World"}
                        </span>
                        <h3 className="mt-3 font-serif text-2xl font-bold">
                          {destination.title}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-white/82">
                          {destination.text}
                        </p>
                        <span className="mt-4 inline-flex text-xs font-black text-[#ffd18a]">
                          View Locations
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#421321] py-10 text-white sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffd18a]">
                  Latest News
                </p>
              <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
                  Fresh Wedding Trends
                </h2>
              </div>
              <Link
                href="#"
                className="inline-flex rounded-full border border-white px-5 py-2 text-sm font-bold text-white hover:bg-white hover:text-[#421321]"
              >
                View All
              </Link>
            </div>
            <div className="news-slider mt-7 flex gap-4 overflow-hidden">
              {[...latestNews, ...latestNews].map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="news-slide w-[280px] shrink-0 overflow-hidden rounded border border-white/15 bg-white/10 backdrop-blur"
                >
                  <div className="relative h-28">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="310px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffd18a]">
                      {item.tag}
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-bold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-rose-50/80">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Marketplace"
              title="Browse The Wedding Marketplace"
              text="Explore handpicked vendor and service cards, then open the marketplace page for filters and more options."
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketplaceCards.slice(0, 6).map((card) => (
                <Link
                  key={card.slug}
                  href="/marketplace"
                  className="group overflow-hidden rounded border border-rose-100 bg-[#fff9f5] shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      style={{ objectPosition: card.position || "center" }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-xl font-bold text-stone-950">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-stone-600">
                      {card.text}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-bold text-[#b61f4b]">
                      Open Marketplace
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fff9f5] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Wedding Blogs"
              title="Ideas For Your Own Special Day"
              text="Read practical planning guides, styling notes, venue tips, and expert ideas while your celebration takes shape."
            />
            <div className="news-slider mt-7 flex gap-4 overflow-hidden">
              {[...blogPosts, ...blogPosts].map((post, index) => (
                <Link
                  key={`${post.slug}-${index}`}
                  href={`/details/${post.slug}`}
                  className="news-slide group w-[270px] shrink-0 overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#b61f4b]">
                      {post.category}
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-bold text-stone-950">
                      {post.title}
                    </h3>
                    <span className="mt-4 inline-flex text-sm font-bold text-[#b61f4b]">
                      Read Blog
                    </span>
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
