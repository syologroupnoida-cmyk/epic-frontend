import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import CitySearch from "@/components/common/CitySearch";
import QuoteModal from "@/components/common/QuoteModal";
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

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-bold text-stone-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-stone-600">{text}</p>
    </div>
  );
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
        <h3 className="font-serif text-2xl font-bold text-stone-950">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
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
  const [selectedCity, setSelectedCity] = useState("Delhi NCR");
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />

      <main>
        <section className="relative isolate min-h-[610px] overflow-hidden">
          {heroSlides.map((slide, index) => (
            <Image
              key={slide.alt}
              src={slide.image}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="hero-slide object-cover object-center"
              style={{ animationDelay: `${index * 5}s` }}
            />
          ))}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2f0b17]/20 via-transparent to-[#2f0b17]/60" />

          <div className="relative mx-auto grid min-h-[610px] max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
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

            <div className="hero-search-panel relative w-full rounded p-4 pt-10 shadow-2xl backdrop-blur-md lg:justify-self-end">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 text-center font-serif text-lg font-bold leading-tight text-white sm:text-xl">
                Search your dream wedding
              </span>
              <div className="grid gap-3">
                <HeroSelect
                  value={selectedService}
                  onSelect={setSelectedService}
                  options={[
                    "Wedding Venues",
                    "Wedding Photographers",
                    "Bridal Makeup Artist",
                    "Wedding Planners",
                  ]}
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

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Vendor Categories"
              title="Explore Wedding Services By Need"
              text="Browse the most requested wedding categories with curated cards and quick dummy detail pages."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vendorCategories.map((category) => (
                <ImageCard key={category.slug} item={category} />
              ))}
            </div>
          </div>
        </section>

        {serviceSections.map((service, index) => (
          <section
            key={service.slug}
            className={`${index % 2 === 0 ? "bg-white" : "bg-[#fff9f5]"} py-16 sm:py-20`}
          >
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
              <Link
                href={detailHref(service.slug)}
                className={`${index % 2 === 1 ? "lg:order-2" : ""} group relative block aspect-[16/11] overflow-hidden rounded border border-rose-100 bg-white shadow-sm`}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </Link>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                  {service.eyebrow}
                </p>
                <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                  {service.title}
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-stone-600">
                  {service.text}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {service.cards.map((card) => (
                    <Link
                      key={card}
                      href={detailHref(service.slug)}
                      className="rounded border border-rose-100 bg-white px-4 py-4 text-sm font-bold text-stone-800 shadow-sm hover:border-[#b61f4b] hover:text-[#b61f4b]"
                    >
                      {card}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="bg-[#fff9f5] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                {luxuryWeddingSection.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold text-stone-950">
                {luxuryWeddingSection.title}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8 text-stone-600">
                {luxuryWeddingSection.text}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {luxuryWeddingSection.cards.map((card) => (
                  <Link
                    key={card}
                    href={detailHref(luxuryWeddingSection.slug)}
                    className="rounded border border-rose-100 bg-white px-4 py-4 text-sm font-bold text-stone-800 shadow-sm hover:border-[#b61f4b] hover:text-[#b61f4b]"
                  >
                    {card}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={detailHref(luxuryWeddingSection.slug)}
              className="group relative block aspect-[16/11] overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
            >
              <Image
                src={luxuryWeddingSection.image}
                alt={luxuryWeddingSection.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow={weddingDestinationSection.eyebrow}
              title={weddingDestinationSection.title}
              text={weddingDestinationSection.text}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {destinationOptions.map((destination) => (
                <Link
                  key={destination.slug}
                  href={`/destination/${destination.slug}`}
                  className="group overflow-hidden rounded border border-rose-100 bg-[#fff9f5] shadow-sm"
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
                  <div className="p-6">
                    <h3 className="font-serif text-3xl font-bold text-stone-950">
                      {destination.title}
                    </h3>
                    <p className="mt-3 leading-7 text-stone-600">
                      {destination.text}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#421321] py-16 text-white sm:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffd18a]">
                Creative Planning
              </p>
              <h2 className="mt-3 font-serif text-4xl font-bold">
                <span className="typing-line">Every wedding has a story.</span>
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-rose-50/85">
                We help you shape it word by word, vendor by vendor, moment by
                moment, until every celebration feels truly yours.
              </p>
              <Link
                href={detailHref("creative-wedding-planning")}
                className="mt-8 inline-flex rounded-full border border-white px-6 py-3 font-bold text-white hover:bg-white hover:text-[#421321]"
              >
                Explore Creative Ideas
              </Link>
            </div>

            <div className="relative min-h-[430px] overflow-hidden rounded border border-white/15 bg-white/10">
              {stories.map((story, index) => (
                <Image
                  key={story.slug}
                  src={story.image}
                  alt={story.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="couple-swipe object-cover"
                  style={{
                    animationDelay: `${index * 4}s`,
                    objectPosition: story.position,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="E-Invite"
              title="Customize Free Online Invitations"
              text="Choose image-based invitation cards for mehndi, engagement, wedding, and reception events."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  <h3 className="mt-4 font-serif text-xl font-bold">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {card.text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Real Wedding Stories"
              title="Happy Couples, Beautiful Celebrations"
              text="Real-life wedding story cards with cities, traditions, outfits, venues, and vendor ideas."
            />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {stories.map((story) => (
                <ImageCard key={story.slug} item={story} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#421321] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ffd18a]">
                  Latest News
                </p>
                <h2 className="mt-3 font-serif text-4xl font-bold">
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
            <div className="news-slider mt-9 flex gap-5 overflow-hidden">
              {[...latestNews, ...latestNews].map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="news-slide w-[310px] shrink-0 overflow-hidden rounded border border-white/15 bg-white/10 backdrop-blur"
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
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffd18a]">
                      {item.tag}
                    </p>
                    <h3 className="mt-3 font-serif text-xl font-bold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-rose-50/80">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Marketplace"
              title="Browse The Wedding Marketplace"
              text="Explore handpicked vendor and service cards, then open the marketplace page for filters and more options."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="p-5">
                    <h3 className="font-serif text-2xl font-bold text-stone-950">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
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

        <section className="bg-[#fff9f5] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Wedding Blogs"
              title="Ideas For Your Own Special Day"
              text="Read practical planning guides, styling notes, venue tips, and expert ideas while your celebration takes shape."
            />
            <div className="news-slider mt-10 flex gap-5 overflow-hidden">
              {[...blogPosts, ...blogPosts].map((post, index) => (
                <Link
                  key={`${post.slug}-${index}`}
                  href={`/details/${post.slug}`}
                  className="news-slide group w-[300px] shrink-0 overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
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
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                      {post.category}
                    </p>
                    <h3 className="mt-3 font-serif text-xl font-bold text-stone-950">
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
