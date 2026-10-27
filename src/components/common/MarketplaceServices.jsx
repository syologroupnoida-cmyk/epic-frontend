import cardStyles from './MarketplaceCards.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CitySearch from './CitySearch';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { listingHref, listingName, listingPrice, marketplaceListingsUrl, normalizeMarketplaceListings, publicMediaUrl, requestMarketplace, serviceInfo } from '@/util/marketplaceListings.mjs';

export function ServiceListingCard({ listing }) {
  const [failedImage, setFailedImage] = useState('');
  const media = (listing.media || []).find((item) => item.mediaType !== 'VIDEO' && publicMediaUrl(item.url));
  const image = publicMediaUrl(media?.url || listing.coverImageUrl || listing.imageUrl);
  const href = listingHref(listing);
  const services = (listing.services || []).map(serviceInfo);
  const content = <>
    <div className="relative aspect-[16/9] overflow-hidden bg-rose-50">
      {image && failedImage !== image ? <Image src={image} alt={listing.title || 'Wedding service'} fill unoptimized sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" onError={() => setFailedImage(image)} className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-rose-100 text-xs text-rose-800">Wedding services</div>}
    </div>
    <div className="flex flex-1 flex-col p-3">
      {services[0]?.category && <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#b61f4b]">{services[0].category}</p>}
      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-stone-950 group-hover:text-[#b61f4b]">{listing.title || 'Wedding service'}</h3>
      <p className="mt-1 truncate text-[11px] text-stone-500">{listingName(listing.city) || listing.cityName}</p>
      <div className="mt-auto pt-2"><p className="text-sm font-bold text-[#b61f4b]">{listingPrice(listing.startingPrice)}{listing.priceType === 'STARTING_FROM' && <span className="ml-1 text-[10px] font-normal text-stone-500">onwards</span>}</p></div>
    </div>
  </>;
  return href ? <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{content}</Link> : <article className="flex h-full flex-col overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm">{content}</article>;
}

export default function MarketplaceServices({ categories = [] }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [subcategoryError, setSubcategoryError] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: null, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    requestMarketplace(marketplaceListingsUrl({ ...filters, page }), controller.signal).then((data) => {
      if (!controller.signal.aborted) setResult(normalizeMarketplaceListings(data, page));
    }).catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, page, attempt]);
  useEffect(() => {
    if (!categoryId) return;
    const controller = new AbortController();
    loadPublicServiceSubcategories(getPublicCatalog, categoryId, { signal: controller.signal }).then((items) => {
      if (!controller.signal.aborted) setSubcategories(items.filter((item) => item.isActive !== false));
    }).catch((err) => { if (!controller.signal.aborted) setSubcategoryError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setSubcategoriesLoading(false); });
    return () => controller.abort();
  }, [categoryId]);
  function loadPage(next) { setPage(next); setLoading(true); setError(''); }
  const fieldClass = 'h-11 min-w-0 rounded-lg border border-rose-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-[#b61f4b]';
  return <section id="wedding-services" className="bg-[#fff9f5] py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-col items-center gap-4 text-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">Services for your celebration</p><h2 className="mt-2 font-serif text-3xl font-bold text-stone-950 sm:text-4xl">Find your wedding services</h2><p className="mt-3 text-sm text-stone-600">Explore packages, compare prices, and find the right team for your day.</p></div>{!loading && !error && result.total !== null && <p className="text-sm text-stone-500">{result.total} services found</p>}</div>
    <form onSubmit={(event) => { event.preventDefault(); setFilters({ search, cityId: city?.id || '', serviceSubcategoryId: subcategoryId }); loadPage(1); }} className="relative z-10 mb-7 grid gap-3 rounded-xl border border-rose-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
      <input aria-label="Search wedding services" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search wedding services" className={fieldClass} />
      <CitySearch value={city?.name || 'All cities'} onSelect={(_, record) => setCity(record)} buttonClassName={`${fieldClass} flex w-full items-center justify-between`} />
      <select aria-label="Service category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(''); setSubcategories([]); setSubcategoryError(''); setSubcategoriesLoading(Boolean(event.target.value)); }} className={fieldClass}><option value="">All categories</option>{categories.filter((item) => item.isActive !== false && (!item.offeringKind || item.offeringKind === 'SERVICE')).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select aria-label="Service subcategory" value={subcategoryId} disabled={!categoryId || subcategoriesLoading} onChange={(event) => setSubcategoryId(event.target.value)} className={`${fieldClass} disabled:bg-stone-50`}><option value="">{subcategoriesLoading ? 'Loading services...' : 'All subcategories'}</option>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button type="submit" className="h-11 rounded-lg bg-[#b61f4b] px-6 text-sm font-bold text-white hover:bg-[#981a3f]">Find services</button>
      {(city || categoryId || search) && <button type="button" onClick={() => { setCity(null); setSearch(''); setCategoryId(''); setSubcategoryId(''); setSubcategories([]); setSubcategoryError(''); setFilters({}); loadPage(1); }} className="text-left text-xs font-semibold text-[#b61f4b]">Clear filters</button>}
      {subcategoryError && <p role="alert" className="text-xs text-red-700 sm:col-span-2">{subcategoryError}</p>}
    </form>
    {loading ? <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"><span className="sr-only">Loading services...</span>{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-xl border border-rose-100 bg-white"><div className="h-28 rounded-t-xl bg-rose-100" /></div>)}</div> : error ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-8 text-center"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={() => { setLoading(true); setError(''); setAttempt((value) => value + 1); }} className="mt-3 font-semibold text-[#b61f4b]">Try again</button></div> : result.items.length ? <div className={cardStyles.services}>{result.items.map((listing, index) => <ServiceListingCard key={listing.id || listing.slug || index} listing={listing} />)}</div> : <div className="rounded-xl border border-rose-100 bg-white p-10 text-center"><h3 className="font-serif text-xl font-bold">No services found</h3><p className="mt-2 text-sm text-stone-500">Try another city, service, or search term.</p></div>}
    {(page > 1 || result.hasNextPage) && <nav aria-label="Service listing pages" className="mt-7 flex items-center justify-center gap-5"><button type="button" disabled={loading || page === 1} onClick={() => loadPage(page - 1)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-stone-600">Page {page}</span><button type="button" disabled={loading || Boolean(error) || !result.hasNextPage} onClick={() => loadPage(page + 1)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm disabled:opacity-40">Next</button></nav>}
    <div className="mt-8 flex justify-center"><Link href="/services" className="inline-flex items-center gap-3 rounded-lg bg-[#b61f4b] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#981a3f]" aria-label="Explore more wedding services">Explore more <span aria-hidden="true">&rarr;</span></Link></div>
  </div></section>;
}
