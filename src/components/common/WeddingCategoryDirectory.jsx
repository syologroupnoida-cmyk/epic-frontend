import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import planning from "@/images/blog-planning.png";
import venues from "@/images/category-venues.png";
import decor from "@/images/category-decor.png";
import photography from "@/images/category-photography.png";
import makeup from "@/images/category-makeup.png";
import mehendi from "@/images/category-mehendi.png";
import catering from "@/images/category-catering.png";
import reception from "@/images/hero-reception.png";
import invitation from "@/images/invite-wedding.png";
import bridal from "@/images/story-jaipur.png";
import groom from "@/images/story-ahmedabad.png";
import jewellery from "@/images/blog-makeup.png";
import cakes from "@/images/blog-catering.png";
import gifts from "@/images/invite-engagement.png";
import transport from "@/images/destination-rajasthan.png";
import hospitality from "@/images/blog-venue.png";
import honeymoon from "@/images/destination-bali.png";
import rentals from "@/images/hero-mandap.png";
import rituals from "@/images/hero-pheras.png";
import favors from "@/images/invite-reception.png";
import { getPublicCatalog, vendorSearchHref } from "@/util/publicCatalog.mjs";
import { loadPublicServiceCategories } from "@/util/serviceCategories.mjs";

const categoryImages = [planning, venues, decor, photography, makeup, mehendi, catering, reception, invitation, bridal, groom, jewellery, cakes, gifts, transport, hospitality, honeymoon, rentals, rituals, favors];

function categoryImage(category, index) {
  const value = `${category.name} ${category.slug}`.toLowerCase();
  if (/venue|banquet|hotel|resort|lawn|property/.test(value)) return venues;
  if (/photo|video|cinema|film/.test(value)) return photography;
  if (/decor|flower|floral|tent|mandap/.test(value)) return decor;
  if (/makeup|beauty|hair|stylist/.test(value)) return makeup;
  if (/mehendi|mehndi/.test(value)) return mehendi;
  if (/cater|food|cake|bakery/.test(value)) return catering;
  if (/invitation|card|stationery/.test(value)) return invitation;
  if (/jewel/.test(value)) return jewellery;
  if (/transport|car|travel/.test(value)) return transport;
  if (/honeymoon/.test(value)) return honeymoon;
  if (/rental/.test(value)) return rentals;
  if (/ritual|pandit|priest/.test(value)) return rituals;
  if (/gift|favor/.test(value)) return gifts;
  if (/groom|sherwani/.test(value)) return groom;
  if (/bridal|lehenga|dress/.test(value)) return bridal;
  if (/hospitality|guest/.test(value)) return hospitality;
  if (/reception|entertain|music|dj/.test(value)) return reception;
  return categoryImages[index % categoryImages.length];
}

function CategorySlides({ categories, duplicate = false }) {
  return <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4" aria-hidden={duplicate || undefined}>{categories.map((category, index) => <Link key={`${duplicate ? "copy-" : ""}${category.id}`} href={vendorSearchHref(category)} tabIndex={duplicate ? -1 : undefined} aria-label={duplicate ? undefined : `View ${category.name} vendors`} className="group flex w-[104px] shrink-0 snap-start cursor-pointer flex-col items-center gap-2.5 rounded-xl text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b61f4b] sm:w-[112px]"><span className="relative block h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-white bg-rose-50 shadow-[0_0_0_1px_#f5dce3] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_0_2px_#b61f4b] sm:h-[88px] sm:w-[88px]"><Image src={categoryImage(category, index)} alt="" fill sizes="88px" className="object-cover transition duration-300 group-hover:scale-110" /></span><span className="max-w-[104px] text-xs font-semibold leading-4 text-stone-800 group-hover:text-[#b61f4b]">{category.name}</span></Link>)}</div>;
}

export default function WeddingCategoryDirectory() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ categories: [], loading: true, error: "" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const sliderRef = useRef(null);
  const pausedRef = useRef(false);
  const searchInputRef = useRef(null);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleCategories = normalizedSearch ? state.categories.filter((category) => `${category.name} ${category.description || ""}`.toLowerCase().includes(normalizedSearch)) : state.categories;

  useEffect(() => {
    const controller = new AbortController();
    loadPublicServiceCategories(getPublicCatalog, { signal: controller.signal }).then((categories) => {
      if (!controller.signal.aborted) setState({ categories: categories.filter((item) => item.isActive !== false), loading: false, error: "" });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ categories: [], loading: false, error: "Unable to load wedding categories." });
    });
    return () => controller.abort();
  }, [attempt]);

  function moveSlider(direction) {
    const slider = sliderRef.current;
    if (!slider) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loopWidth = slider.firstElementChild?.getBoundingClientRect().width || slider.scrollWidth / 2;
    if (slider.scrollLeft >= loopWidth - 2) slider.scrollLeft -= loopWidth;
    if (direction < 0 && slider.scrollLeft <= 2) slider.scrollLeft += loopWidth;
    slider.scrollBy({ left: direction * 132, behavior: reducedMotion ? "auto" : "smooth" });
  }

  useEffect(() => {
    if (visibleCategories.length < 2) return undefined;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) moveSlider(1);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [visibleCategories.length]);

  useEffect(() => {
    if (sliderRef.current) sliderRef.current.scrollLeft = 0;
  }, [normalizedSearch]);

  return <section aria-labelledby="wedding-categories-title" className="border-b border-rose-100 bg-white py-8 sm:py-10">
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-7 flex min-h-16 flex-col items-center gap-3 px-10 text-center sm:px-56">
        <div><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b61f4b]">Your celebration starts here</p><h2 id="wedding-categories-title" className="font-serif text-2xl font-bold text-stone-950 sm:text-3xl">Find your wedding dream team</h2><p className="mt-2 text-sm text-stone-600">Choose a category and discover vendors who match your celebration.</p></div>
      </div>
      <div className="absolute right-4 top-0 z-20 flex items-center justify-end sm:right-6 lg:right-8">
        <div className={`flex h-9 items-center overflow-hidden rounded-full border bg-white shadow-sm transition-[width,border-color] duration-300 ${searchOpen ? "w-[210px] border-[#b61f4b]" : "w-9 border-rose-200"}`}>
          {searchOpen ? <><label htmlFor="category-service-search" className="sr-only">Search services</label><input ref={searchInputRef} id="category-service-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services…" className="min-w-0 flex-1 bg-transparent pl-3 text-xs font-normal text-stone-800 outline-none placeholder:text-stone-400" /></> : null}
          <button type="button" onClick={() => { if (searchOpen) { setSearchOpen(false); setSearch(""); } else { setSearchOpen(true); window.requestAnimationFrame(() => searchInputRef.current?.focus()); } }} aria-label={searchOpen ? "Close service search" : "Search services"} aria-expanded={searchOpen} className="grid h-9 w-9 shrink-0 place-items-center text-[#8f1f3f] hover:bg-rose-50">
            {searchOpen ? <span aria-hidden="true" className="text-lg leading-none">×</span> : <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>}
          </button>
        </div>
      </div>
      {state.loading ? <div className="grid grid-cols-3 gap-x-3 gap-y-6 min-[400px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-10" aria-label="Loading wedding categories">{Array.from({ length: 20 }, (_, index) => <div key={index} className="flex animate-pulse flex-col items-center gap-2.5"><span className="h-[76px] w-[76px] rounded-full bg-rose-100 sm:h-[88px] sm:w-[88px]" /><span className="h-3 w-20 rounded bg-stone-100" /></div>)}</div> : null}
      {state.error ? <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-center text-sm text-stone-600" role="alert"><p>{state.error}</p><button type="button" onClick={() => { setState((current) => ({ ...current, loading: true, error: "" })); setAttempt((value) => value + 1); }} className="mt-3 rounded bg-[#b61f4b] px-4 py-2 text-xs font-semibold text-white">Try again</button></div> : null}
      {!state.loading && !state.error && visibleCategories.length ? <div className="relative px-9 sm:px-10" onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }} onFocusCapture={() => { pausedRef.current = true; }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false; }}>
        <button type="button" onClick={() => moveSlider(-1)} aria-label="Previous categories" className="absolute left-0 top-[32px] z-10 grid h-8 w-8 place-items-center rounded-full border border-rose-200 bg-white text-lg leading-none text-[#8f1f3f] shadow-sm transition hover:border-[#8f1f3f] hover:bg-rose-50">‹</button>
        <div ref={sliderRef} className="wedding-category-slider flex snap-x snap-mandatory overflow-x-auto px-1 pb-3 pt-1"><CategorySlides categories={visibleCategories} /><CategorySlides categories={visibleCategories} duplicate /></div>
        <button type="button" onClick={() => moveSlider(1)} aria-label="Next categories" className="absolute right-0 top-[32px] z-10 grid h-8 w-8 place-items-center rounded-full border border-rose-200 bg-white text-lg leading-none text-[#8f1f3f] shadow-sm transition hover:border-[#8f1f3f] hover:bg-rose-50">›</button>
      </div> : null}
      {!state.loading && !state.error && state.categories.length > 0 && visibleCategories.length === 0 ? <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-8 text-center"><p className="text-sm font-semibold text-stone-700">No services found for “{search.trim()}”.</p><button type="button" onClick={() => { setSearch(""); searchInputRef.current?.focus(); }} className="mt-3 text-xs font-semibold text-[#b61f4b] underline">Clear search</button></div> : null}
      {!state.loading && !state.error && state.categories.length === 0 ? <p className="rounded-xl border border-stone-200 p-6 text-center text-sm text-stone-500">No categories are available yet.</p> : null}
      <div className="mt-7 text-center"><Link href="/vendors" className="text-sm font-bold text-[#b61f4b] hover:underline">View all vendors <span aria-hidden="true">→</span></Link></div>
    </div>
  </section>;
}
