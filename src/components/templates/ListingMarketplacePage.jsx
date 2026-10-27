import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Alert, Autocomplete, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import { ServiceListingCard } from '@/components/common/MarketplaceServices';
import { VenueCard } from '@/components/common/MarketplaceVenues';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceCategories, loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { loadMarketplaceSelection } from '@/util/marketplaceSelection.mjs';
import useCities from '@/util/useCities';

const limit = 20;
const checkboxSx = { color: '#cbd5e1', '&.Mui-checked': { color: '#b61f4b' }, py: 0.75 };

export default function ListingMarketplacePage({ venue = false }) {
  const noun = venue ? 'venues' : 'services';
  const title = venue ? 'Find your wedding venue' : 'Find your wedding services';
  const [catalog, setCatalog] = useState(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subcatalog, setSubcatalog] = useState(null);
  const [subAttempt, setSubAttempt] = useState(0);
  const [city, setCity] = useState(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const cities = useCities();

  useEffect(() => {
    const controller = new AbortController();
    loadPublicServiceCategories(getPublicCatalog, { signal: controller.signal }).then((items) => {
      if (!controller.signal.aborted) setCatalog({ items, attempt: catalogAttempt });
    }).catch((error) => { if (!controller.signal.aborted) setCatalog({ error: error.message, attempt: catalogAttempt }); });
    return () => controller.abort();
  }, [catalogAttempt]);

  const categories = (catalog?.items || []).filter((item) => item.isActive !== false && (venue ? item.offeringKind === 'VENUE_PROPERTY' : !item.offeringKind || item.offeringKind === 'SERVICE'));
  const categoryKey = JSON.stringify(categoryIds);
  const currentSubs = subcatalog?.key === categoryKey && subcatalog?.attempt === subAttempt ? subcatalog : null;
  useEffect(() => {
    const ids = JSON.parse(categoryKey);
    if (!ids.length) return;
    const controller = new AbortController();
    Promise.all(ids.map(async (id) => ({ id, items: (await loadPublicServiceSubcategories(getPublicCatalog, id, { signal: controller.signal })).filter((item) => item.isActive !== false) }))).then((groups) => {
      if (!controller.signal.aborted) setSubcatalog({ key: categoryKey, groups, attempt: subAttempt });
    }).catch((error) => { if (!controller.signal.aborted) setSubcatalog({ key: categoryKey, error: error.message, attempt: subAttempt }); });
    return () => controller.abort();
  }, [categoryKey, subAttempt]);

  const scopedIds = (currentSubs?.groups || []).flatMap((group) => {
    const selected = group.items.filter((item) => subcategoryIds.includes(item.id));
    return (selected.length ? selected : group.items).map((item) => item.id);
  });
  const filtersReady = !categoryIds.length || Boolean(currentSubs && !currentSubs.error);
  const emptyScope = categoryIds.length > 0 && filtersReady && !scopedIds.length;
  const requestPage = scopedIds.length > 1 ? 1 : page;
  const requestKey = JSON.stringify({ venue, subcategoryIds: scopedIds, search: appliedSearch, cityId: city?.id || '', page: requestPage, limit, emptyScope });
  useEffect(() => {
    if (!filtersReady) return;
    const controller = new AbortController();
    const selection = JSON.parse(requestKey);
    const request = selection.emptyScope ? Promise.resolve({ items: [], total: 0, combined: false, hasNextPage: false }) : loadMarketplaceSelection(selection, controller.signal);
    request.then((data) => { if (!controller.signal.aborted) setResult({ ...data, key: requestKey, attempt }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message, attempt }); });
    return () => controller.abort();
  }, [requestKey, filtersReady, attempt]);

  const current = filtersReady && result?.key === requestKey && result?.attempt === attempt ? result : null;
  const items = current?.combined ? current.items.slice((page - 1) * limit, page * limit) : current?.items || [];
  const hasNextPage = current?.combined ? page * limit < current.total : current?.hasNextPage;
  const filtering = categoryIds.length || city || appliedSearch;
  function toggleCategory(id) {
    setCategoryIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    const removedIds = currentSubs?.groups?.find((group) => group.id === id)?.items.map((item) => item.id) || [];
    setSubcategoryIds((ids) => ids.filter((item) => !removedIds.includes(item)));
    setPage(1);
  }
  function clearFilters() { setCategoryIds([]); setSubcategoryIds([]); setCity(null); setSearch(''); setAppliedSearch(''); setPage(1); }

  return <><Head><title>Wedding {noun} marketplace | Epic</title><meta name="description" content={`Explore wedding ${noun}, compare prices, and filter by city, category, and ${venue ? 'venue type' : 'service'}.`} /></Head><Header />
    <main className="min-h-[65vh] bg-[#fff9f5] pb-16">
      <div className="border-b border-rose-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex gap-2 text-xs text-stone-500"><Link href="/" className="hover:text-[#b61f4b]">Home</Link><span>›</span><span>Wedding {noun}</span></nav>
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-widest text-[#b61f4b]">The wedding marketplace</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{title}</h1><p className="mt-3 text-sm text-stone-500">{venue ? 'Discover the perfect setting for your celebration.' : 'Find the right team to bring your celebration to life.'}</p></div><div className="flex gap-2 text-sm"><Link href="/services" aria-current={!venue ? 'page' : undefined} className={`rounded-full px-5 py-2 ${!venue ? 'bg-[#b61f4b] text-white' : 'bg-rose-50 text-[#b61f4b]'}`}>Services</Link><Link href="/venues" aria-current={venue ? 'page' : undefined} className={`rounded-full px-5 py-2 ${venue ? 'bg-[#b61f4b] text-white' : 'bg-rose-50 text-[#b61f4b]'}`}>Venues</Link></div></div>
      </div></div>
      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 pt-7 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-8">
        <aside aria-label={`${venue ? 'Venue' : 'Service'} filters`} className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Filters</h2><button type="button" onClick={clearFilters} disabled={!filtering && !search} className="text-xs font-semibold text-[#b61f4b] disabled:text-stone-400">Clear all</button></div>
          <Autocomplete options={cities.cities} value={city} onChange={(_, value) => { setCity(value); setPage(1); }} loading={cities.loading} isOptionEqualToValue={(a, b) => a.id === b.id} getOptionLabel={(option) => option.label || option.name} noOptionsText={cities.error || 'No cities found'} renderInput={(params) => <TextField {...params} label="City" placeholder="All cities" size="small" />} />
          {cities.error && <div className="mt-2 text-xs text-red-700">{cities.error}<button type="button" onClick={cities.retry} className="ml-2 underline">Retry</button></div>}
          <fieldset className="mt-6 border-t border-stone-100 pt-5"><legend className="text-sm font-bold">Categories</legend>
            {(!catalog || catalog.attempt !== catalogAttempt) ? <p role="status" className="mt-3 text-xs text-stone-500">Loading categories...</p> : catalog.error ? <div role="alert" className="mt-3 text-xs text-red-700">{catalog.error}<button type="button" onClick={() => setCatalogAttempt((value) => value + 1)} className="ml-2 underline">Retry</button></div> : !categories.length ? <p className="mt-3 text-xs text-stone-500">No categories available.</p> : <div className="mt-2">{categories.map((category) => <div key={category.id}>
              <FormControlLabel sx={{ m: 0, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: 13, py: 1, overflowWrap: 'anywhere' } }} control={<Checkbox size="small" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} sx={checkboxSx} />} label={category.name} />
              {categoryIds.includes(category.id) && <div className="mb-3 ml-4 border-l-2 border-rose-100 pl-2">{!currentSubs ? <p role="status" className="py-2 text-xs text-stone-500">Loading {venue ? 'venue types' : 'services'}...</p> : currentSubs.error ? <div role="alert" className="py-2 text-xs text-red-700">{currentSubs.error}<button type="button" onClick={() => setSubAttempt((value) => value + 1)} className="ml-2 underline">Retry</button></div> : (currentSubs.groups.find((group) => group.id === category.id)?.items || []).length ? currentSubs.groups.find((group) => group.id === category.id).items.map((item) => <FormControlLabel key={item.id} sx={{ m: 0, display: 'flex', alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: 12, py: 1, overflowWrap: 'anywhere' } }} control={<Checkbox size="small" checked={subcategoryIds.includes(item.id)} onChange={() => { setSubcategoryIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]); setPage(1); }} sx={checkboxSx} />} label={item.name} />) : <p className="py-2 text-xs text-stone-500">No {venue ? 'venue types' : 'services'} available.</p>}</div>}
            </div>)}</div>}
          </fieldset>
        </aside>
        <section aria-label={`Wedding ${noun} results`} className="min-w-0">
          <form onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); setPage(1); }} className="mb-5 flex gap-3"><TextField fullWidth type="search" size="small" label={`Search wedding ${noun}`} value={search} onChange={(event) => setSearch(event.target.value)} sx={{ bgcolor: '#fff' }} /><Button type="submit" variant="contained" sx={{ bgcolor: '#b61f4b', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#981a3f' } }}>Search</Button></form>
          <div aria-live="polite" className="mb-4 text-sm text-stone-500">{current && !current.error && (current.total != null ? `${current.total} ${noun} found` : `${items.length} ${noun} on this page`)}</div>
          {!filtersReady && currentSubs?.error ? <Alert severity="error">Unable to apply category filters. Retry the category options in the sidebar.</Alert> : !current ? <div role="status" className="grid grid-cols-2 gap-4 xl:grid-cols-3"><span className="sr-only">Loading {noun}...</span>{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-xl bg-rose-100/60" />)}</div> : current.error ? <Alert severity="error" action={<Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert> : items.length ? <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item, index) => venue ? <VenueCard key={item.id || item.slug || index} property={item} /> : <ServiceListingCard key={item.id || item.slug || index} listing={item} />)}</div> : <div className="rounded-2xl border border-rose-100 bg-white px-5 py-16 text-center"><h2 className="font-serif text-2xl font-bold">No {noun} found</h2><p className="mt-3 text-sm text-stone-500">Try another city, category, or search term.</p><button type="button" onClick={clearFilters} className="mt-5 text-sm font-semibold text-[#b61f4b]">Clear filters</button></div>}
          {(page > 1 || hasNextPage) && <nav aria-label={`${venue ? 'Venue' : 'Service'} marketplace pages`} className="mt-8 flex items-center justify-center gap-5"><Button disabled={!current || page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm">Page {page}</span><Button disabled={!current || Boolean(current.error) || !hasNextPage} onClick={() => setPage(page + 1)}>Next</Button></nav>}
        </section>
      </div>
    </main><Footer /></>;
}
