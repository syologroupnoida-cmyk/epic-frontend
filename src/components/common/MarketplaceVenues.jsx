import cardStyles from './MarketplaceCards.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CitySearch from './CitySearch';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { listingName, listingPrice, publicMediaUrl } from '@/util/marketplaceListings.mjs';
import { marketplaceVenuesUrl, normalizeMarketplaceVenues, requestVenues, venueHref } from '@/util/marketplaceVenues.mjs';
import { normalizeVenueType } from '@/components/vendor/properties/propertyModel';

export function VenueCard({ property }) {
  const [failedImage, setFailedImage] = useState('');
  const media = (property.media || []).find((item) => item.mediaType !== 'VIDEO' && publicMediaUrl(item.url));
  const image = publicMediaUrl(media?.url || property.coverImageUrl || property.imageUrl);
  const href = venueHref(property);
  const type = (property.venueTypes || []).map(normalizeVenueType).find((item) => item.name)?.name;
  const content = <>
    <div className="relative aspect-[16/10] overflow-hidden bg-rose-50">
      {image && failedImage !== image ? <Image src={image} alt={property.title || 'Wedding venue'} fill unoptimized sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" onError={() => setFailedImage(image)} className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-amber-50 font-serif text-lg text-rose-800">Wedding venues</div>}
      {type && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#b61f4b]">{type}</span>}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <h3 className="line-clamp-2 font-serif text-xl font-bold text-stone-950 group-hover:text-[#b61f4b]">{property.title || 'Wedding venue'}</h3>
      <p className="mt-2 text-xs text-stone-500">{[property.address?.locality, listingName(property.city) || property.cityName].filter(Boolean).join(', ') || 'Location on request'}</p>
      {property.capacityMax != null && <p className="mt-3 text-xs text-stone-600">{property.capacityMin != null ? `${property.capacityMin} – ${property.capacityMax}` : `Up to ${property.capacityMax}`} guests</p>}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-rose-50 pt-3"><div><p className="text-[10px] uppercase tracking-wide text-stone-500">{property.priceType === 'STARTING_FROM' ? 'Starting from' : 'Price'}</p><p className="mt-1 text-lg font-bold text-[#b61f4b]">{listingPrice(property.startingPrice)}</p></div>{href && <span className="text-xs font-semibold text-[#b61f4b]">View venue →</span>}</div>
    </div>
  </>;
  return href ? <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{content}</Link> : <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">{content}</article>;
}

export default function MarketplaceVenues({ categories = [] }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const venueCategories = categories.filter((item) => item.isActive !== false && item.offeringKind === 'VENUE_PROPERTY');
  const selectedCategory = venueCategories.find((item) => item.id === categoryId);
  const currentOptions = options?.categoryId === categoryId ? options : null;
  const current = result?.filters === filters && result?.page === page && result?.attempt === attempt ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    requestVenues(marketplaceVenuesUrl({ ...filters, page }), controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult({ filters, page, attempt, ...normalizeMarketplaceVenues(data, page) });
    }).catch((err) => { if (!controller.signal.aborted) setResult({ filters, page, attempt, error: err.message }); });
    return () => controller.abort();
  }, [filters, page, attempt]);
  useEffect(() => {
    if (!categoryId) return;
    const controller = new AbortController();
    loadPublicServiceSubcategories(getPublicCatalog, categoryId, { signal: controller.signal }).then((items) => {
      if (!controller.signal.aborted) setOptions({ categoryId, items: items.filter((item) => item.isActive !== false) });
    }).catch((err) => { if (!controller.signal.aborted) setOptions({ categoryId, items: [], error: err.message }); });
    return () => controller.abort();
  }, [categoryId]);
  const fieldClass = 'h-11 min-w-0 rounded-lg border border-rose-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-[#b61f4b]';
  return <section id="wedding-venues" className="bg-white py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-7 text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">A beautiful place to begin</p><h2 className="mt-2 font-serif text-3xl font-bold text-stone-950 sm:text-4xl">Find your wedding venue</h2><p className="mt-3 text-sm text-stone-600">Explore beautiful spaces, compare prices, and find the perfect setting for your celebration.</p>{current?.total != null && <p className="mt-4 text-sm text-stone-500">{current.total} venues found</p>}</div>
    <form onSubmit={(event) => { event.preventDefault(); setFilters({ search, cityId: city?.id || '', serviceSubcategoryId: subcategoryId }); setPage(1); }} className="relative z-10 mb-7 grid gap-3 rounded-xl border border-rose-100 bg-[#fff9f5] p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
      <input aria-label="Search wedding venues" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search venues, e.g. Palace" className={fieldClass} />
      <CitySearch label="Venue city" value={city?.name || 'All cities'} onSelect={(_, record) => setCity(record)} buttonClassName={`${fieldClass} flex w-full items-center justify-between`} />
      <select aria-label="Venue category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(''); setOptions(null); }} className={fieldClass}><option value="">All venue categories</option>{venueCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Venue type" value={subcategoryId} disabled={!selectedCategory || !currentOptions} onChange={(event) => setSubcategoryId(event.target.value)} className={`${fieldClass} disabled:bg-stone-50`}><option value="">{categoryId && !currentOptions ? 'Loading venue types...' : 'All venue types'}</option>{(currentOptions?.items || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button type="submit" className="h-11 rounded-lg bg-[#b61f4b] px-6 text-sm font-bold text-white hover:bg-[#981a3f]">Find venues</button>
      {(search || city || categoryId) && <button type="button" onClick={() => { setSearch(''); setCity(null); setCategoryId(''); setSubcategoryId(''); setOptions(null); setFilters({}); setPage(1); }} className="text-left text-xs font-semibold text-[#b61f4b]">Clear filters</button>}
      {currentOptions?.error && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{currentOptions.error}<button type="button" onClick={() => { setCategoryId(''); setSubcategoryId(''); }} className="ml-2 underline">Reset venue type</button></p>}
    </form>
    {!current ? <div role="status" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><span className="sr-only">Loading wedding venues...</span>{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-rose-50" />)}</div> : current.error ? <div role="alert" className="rounded-xl border border-rose-100 p-10 text-center"><p className="text-sm text-red-700">{current.error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 font-semibold text-[#b61f4b]">Try again</button></div> : current.items.length ? <div className={cardStyles.venues}>{current.items.map((property, index) => <VenueCard key={property.id || property.slug || index} property={property} />)}</div> : <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-10 text-center"><h3 className="font-serif text-xl font-bold">No venues found</h3><p className="mt-2 text-sm text-stone-500">Try another city, venue type, or search term.</p></div>}
    {(page > 1 || current?.hasNextPage) && <nav aria-label="Venue listing pages" className="mt-7 flex items-center justify-center gap-5"><button type="button" disabled={!current || page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-stone-600">Page {page}</span><button type="button" disabled={!current || Boolean(current.error) || !current.hasNextPage} onClick={() => setPage(page + 1)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm disabled:opacity-40">Next</button></nav>}
    <div className="mt-8 flex justify-center"><Link href="/venues" className="inline-flex items-center gap-3 rounded-lg bg-[#b61f4b] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#981a3f]" aria-label="Explore more wedding venues">Explore more <span aria-hidden="true">&rarr;</span></Link></div>
  </div></section>;
}
