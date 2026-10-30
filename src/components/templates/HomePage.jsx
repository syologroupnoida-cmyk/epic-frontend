import { WebsiteSeo, WebsiteActions } from '@/components/common/WebsiteContent';
import { websiteContent } from '@/data/websiteContent.mjs';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import HomeHero from "@/components/common/HomeHero";
import QuoteModal from "@/components/common/QuoteModal";
import { getPublicCatalog } from "@/util/publicCatalog.mjs";
import { loadPublicServiceCategories } from "@/util/serviceCategories.mjs";
import WeddingCategoryDirectory from "@/components/common/WeddingCategoryDirectory";
import MarketplaceServices from "@/components/common/MarketplaceServices";
import MarketplaceVenues from "@/components/common/MarketplaceVenues";
import {
  invitationCards,
  blogPosts,
  marketplaceCards,
  luxuryWeddingSection,
  weddingDestinationSection,
  destinationOptions,
  stories,
  vendorCategories,
} from "@/data/homeData";

function detailHref(slug) {
  return `/details/${slug}`;
}

const latestNews = [
  {
    title: "Wedding themes",
    tag: "Decor",
    text: "Discover wedding themes, bridal fashion, decorations, traditional ceremonies and contemporary ideas.",
    image: vendorCategories[3].image,
  },
  {
    title: "Destination planning",
    tag: "Venues",
    text: "Explore remarkable wedding destinations across India and abroad.",
    image: stories[1].image,
  },
  {
    title: "Wedding catering",
    tag: "Catering",
    text: "Explore curated menus, regional delicacies, international cuisines and live counters.",
    image: vendorCategories[4].image,
  },
  {
    title: "Wedding photography",
    tag: "Photo",
    text: "Capture every emotion through professional photography and cinematic films.",
    image: vendorCategories[1].image,
  },
  {
    title: "Wedding invitations",
    tag: "Invites",
    text: "Discover designs reflecting your wedding theme, traditions and personality.",
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
        <h3 className="font-serif text-base font-semibold text-stone-950">
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

export default function HomePage() {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);


  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadServiceCategories() {
      try {
        const nextCategories = await loadPublicServiceCategories(getPublicCatalog, { signal: controller.signal });
        if (!isMounted) return;
        setServiceCategories(nextCategories);
      } catch {
        if (isMounted) setCategoryError("Unable to load categories.");
      } finally {
        if (isMounted) setCategoryLoading(false);
      }
    }

    loadServiceCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [categoryAttempt]);

  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <WebsiteSeo pageKey="home" />
      <Header />

      <main>
        <HomeHero categories={serviceCategories} loading={categoryLoading} error={categoryError} onRetry={() => { setCategoryLoading(true); setCategoryError(""); setCategoryAttempt((current) => current + 1); }} onPlan={() => setIsQuoteOpen(true)} />

        <WeddingCategoryDirectory />

        <MarketplaceServices categories={serviceCategories} categoriesLoading={categoryLoading} />


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
                    <h3 className="font-serif text-base font-semibold text-stone-950">
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
              title="Wedding Inspiration"
              text={websiteContent.home.sections.find((section) => section.title === "Wedding Inspiration").paragraphs[0]}
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



        <MarketplaceVenues categories={serviceCategories} categoriesLoading={categoryLoading} />

        <section className="bg-[#fff9f5] py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Real Weddings' Stories"
              title="Real Weddings, Beautiful Stories"
              text={websiteContent.home.sections.find((section) => section.title === "Real Weddings, Beautiful Stories").paragraphs[0]}
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
                Your Wedding, Made Simple
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-stone-950 sm:text-3xl">
                Search, select and connect with your wedding experts
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{websiteContent.home.sections.find((section) => section.title === 'Your Wedding, Made Simple').paragraphs[0]}</p>
              <WebsiteActions pageKey="home" />
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
              title={websiteContent.invitations.title}
              text={websiteContent.invitations.intro[0]}
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
                  <h3 className="mt-3 font-serif text-base font-semibold">
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
                    href="/destination-weddings"
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
                        <h3 className="mt-3 font-serif text-lg font-semibold">
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
                  Planning Inspiration
                </p>
              <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
                  Plan with Confidence
                </h2>
              </div>
              <Link
                href="/blog"
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
                    <h3 className="mt-2 font-serif text-base font-semibold">
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
              title={websiteContent.marketplace.title}
              text={websiteContent.marketplace.intro[0]}
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketplaceCards.slice(0, 6).map((card) => (
                <Link
                  key={card.slug}
                  href="/marketplace"
                  className="group overflow-hidden rounded-2xl border border-rose-100 bg-[#fff9f5] shadow-sm"
                >
                  <div className="relative mx-3 mt-3 aspect-[2/1] overflow-hidden rounded-xl">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                      style={{ objectPosition: card.position || "center" }}
                    />
                  </div>
                  <div className="px-4 pb-4 pt-3">
                    <h3 className="font-serif text-base font-semibold text-stone-950">
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
              title={websiteContent.blog.title}
              text={websiteContent.blog.intro[0]}
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
                    <h3 className="mt-2 font-serif text-base font-semibold text-stone-950">
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
