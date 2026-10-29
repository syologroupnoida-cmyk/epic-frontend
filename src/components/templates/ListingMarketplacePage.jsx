import { WebsiteSeo, WebsiteSections, WebsiteActions } from '@/components/common/WebsiteContent';
import { websiteContent } from '@/data/websiteContent.mjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { readMarketplaceFilters } from '@/util/marketplaceNavigation.mjs';
import styles from './ListingMarketplace.module.css';
import { Alert, Autocomplete, Button, Checkbox, FormControlLabel, Slider, TextField } from '@mui/material';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import MarketplaceResultCard, { MarketplaceIcon } from '@/components/common/MarketplaceResultCard';
import { presentMarketplaceItems } from '@/util/marketplacePresentation.mjs';
import { listingPrice } from '@/util/marketplaceListings.mjs';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceCategories, loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { loadMarketplaceSelection } from '@/util/marketplaceSelection.mjs';
import useCities from '@/util/useCities';

const limit = 20;
const checkboxSx = { color: '#cbd5e1', '&.Mui-checked': { color: '#b61f4b' }, py: 0.75 };

export default function ListingMarketplacePage({ venue = false }) {
  const router = useRouter();
  const noun = venue ? 'venues' : 'services';
  const contentKey = venue ? 'venues' : 'vendors';
  const pageContent = websiteContent[contentKey];
  const title = pageContent.title;
  const [catalog, setCatalog] = useState(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const routeFilters = readMarketplaceFilters(router.query, venue ? [] : catalog?.items);
  const routeKey = JSON.stringify(routeFilters);
  const [previousRouteKey, setPreviousRouteKey] = useState(routeKey);
  const [categoryIds, setCategoryIds] = useState(routeFilters.categoryIds);
  const [subcategoryIds, setSubcategoryIds] = useState(routeFilters.subcategoryIds);
  const [subcatalog, setSubcatalog] = useState(null);
  const [subAttempt, setSubAttempt] = useState(0);
  const [city, setCity] = useState(null);
  const [search, setSearch] = useState(routeFilters.search);
  const [appliedSearch, setAppliedSearch] = useState(routeFilters.search);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const cities = useCities();
  const priceCeiling = venue ? 1000000 : 100000;
  const [priceRange, setPriceRange] = useState([0, priceCeiling]);
  const [layout, setLayout] = useState('grid');
  const priceActive = priceRange[0] > 0 || priceRange[1] < priceCeiling;
  const allPages = priceActive;
  const heroImage = pageContent.image;

  // Query changes (including browser back/forward) start a fresh selection.
  // Adjust state before rendering results so no request uses the previous route.
  if (previousRouteKey !== routeKey) {
    setPreviousRouteKey(routeKey);
    setCategoryIds(routeFilters.categoryIds);
    setSubcategoryIds(routeFilters.subcategoryIds);
    setSearch(routeFilters.search);
    setAppliedSearch(routeFilters.search);
    setPage(1);
  }



  useEffect(() => {
    const controller = new AbortController();
    loadPublicServiceCategories(getPublicCatalog, { signal: controller.signal }).then((items) => {
      if (!controller.signal.aborted) setCatalog({ items, attempt: catalogAttempt });
    }).catch((error) => { if (!controller.signal.aborted) setCatalog({ error: error.message, attempt: catalogAttempt }); });
    return () => controller.abort();
  }, [catalogAttempt]);

  const categories = (catalog?.items || []).filter((item) => item.isActive !== false && (!venue || item.offeringKind === 'VENUE_PROPERTY'));
  const categoryKey = JSON.stringify(venue ? categories.map((category) => category.id) : categoryIds);
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

  const venueSubcategories = [...new Map((currentSubs?.groups || []).flatMap((group) => group.items).map((item) => [item.id, item])).values()];
  const bannerOptions = venue ? venueSubcategories : categories;
  const bannerIds = venue ? subcategoryIds : categoryIds;
  const bannerSelection = bannerIds.length === 1 ? bannerOptions.find((item) => item.id === bannerIds[0]) || null : null;
  const scopedIds = venue || !categoryIds.length ? subcategoryIds : (currentSubs?.groups || []).flatMap((group) => {
    const selected = group.items.filter((item) => subcategoryIds.includes(item.id));
    return (selected.length ? selected : group.items).map((item) => item.id);
  });
  const filtersReady = (venue ? !subcategoryIds.length : !categoryIds.length) || Boolean(currentSubs && !currentSubs.error);
  const emptyScope = !venue && categoryIds.length > 0 && filtersReady && !scopedIds.length;
  const requestPage = scopedIds.length > 1 || allPages ? 1 : page;
  const requestKey = JSON.stringify({ venue, subcategoryIds: scopedIds, search: appliedSearch, cityId: city?.id || '', page: requestPage, limit, emptyScope, allPages });
  useEffect(() => {
    if (!router.isReady || !filtersReady) return;
    const controller = new AbortController();
    const selection = JSON.parse(requestKey);
    const request = selection.emptyScope ? Promise.resolve({ items: [], total: 0, combined: false, hasNextPage: false }) : loadMarketplaceSelection(selection, controller.signal);
    request.then((data) => { if (!controller.signal.aborted) setResult({ ...data, key: requestKey, attempt }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message, attempt }); });
    return () => controller.abort();
  }, [requestKey, filtersReady, attempt, router.isReady]);

  const current = filtersReady && result?.key === requestKey && result?.attempt === attempt ? result : null;
  const matching = presentMarketplaceItems(current?.items || [], { minPrice: priceRange[0], maxPrice: priceRange[1] < priceCeiling ? priceRange[1] : null });
  const items = current?.combined ? matching.slice((page - 1) * limit, page * limit) : matching;
  const total = current?.combined ? matching.length : current?.total;
  const hasNextPage = current?.combined ? page * limit < matching.length : current?.hasNextPage;
  const filtering = categoryIds.length || subcategoryIds.length || city || appliedSearch || priceActive;

  function toggleCategory(id) {
    setCategoryIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    const removedIds = (subcatalog?.groups?.find((group) => group.id === id)?.items || categories.find((category) => category.id === id)?.subcategories || []).map((item) => item.id);
    setSubcategoryIds((ids) => ids.filter((item) => !removedIds.includes(item)));
    setPage(1);
  }
  function clearFilters() { setCategoryIds([]); setSubcategoryIds([]); setCity(null); setSearch(''); setAppliedSearch(''); setPriceRange([0, priceCeiling]); setPage(1); }

  const subcategoryOptions = new Map([
    ...(catalog?.items || []).flatMap((category) => category.subcategories || []),
    ...(subcatalog?.groups || []).flatMap((group) => group.items),
  ].map((item) => [item.id, item]));
  const activeFilters = [
    ...(!venue ? categoryIds.map((id) => ({ key: `category-${id}`, label: categories.find((item) => item.id === id)?.name || 'Service category', remove: () => toggleCategory(id) })) : []),
    ...subcategoryIds.map((id) => ({ key: `subcategory-${id}`, label: subcategoryOptions.get(id)?.name || (venue ? 'Venue category' : 'Service type'), remove: () => { setSubcategoryIds((ids) => ids.filter((item) => item !== id)); setPage(1); } })),
    ...(city ? [{ key: 'city', label: city.label || city.name, remove: () => { setCity(null); setPage(1); } }] : []),
    ...(appliedSearch ? [{ key: 'search', label: `Search: ${appliedSearch}`, remove: () => { setSearch(''); setAppliedSearch(''); setPage(1); } }] : []),
    ...(priceActive ? [{ key: 'price', label: `${listingPrice(priceRange[0])} - ${listingPrice(priceRange[1])}${priceRange[1] === priceCeiling ? '+' : ''}`, remove: () => { setPriceRange([0, priceCeiling]); setPage(1); } }] : []),
  ];

  const cityInput = (label) => <Autocomplete options={cities.cities} value={city} onChange={(_, value) => { setCity(value); setPage(1); }} loading={cities.loading} isOptionEqualToValue={(a, b) => a.id === b.id} getOptionLabel={(option) => option.label || option.name} noOptionsText={cities.error || 'No cities found'} renderInput={(params) => <TextField {...params} placeholder="All cities" size="small" slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': label } }} />} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13, bgcolor: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e6cbd3' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e6cbd3', borderWidth: 1 } }} />;
  return <><WebsiteSeo pageKey={contentKey} path={venue ? '/venues' : '/services'} /><Header />
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image src={heroImage} alt="" fill priority sizes="100vw" className={styles.heroPhoto} />
        <nav className={styles.bannerBreadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href={venue ? '/venues' : '/services'} aria-current="page">Explore wedding {noun} &rarr;</Link></nav>
        <div className={styles.heroContent}><h1>{title}</h1><p>{pageContent.subtitle}</p>
          <form className={styles.heroSearch} onSubmit={(event) => { event.preventDefault(); setPage(1); setAttempt((value) => value + 1); }}>
            <div className={styles.searchField}><MarketplaceIcon name="search" /><Autocomplete
              openOnFocus
              options={bannerOptions}
              value={bannerSelection}
              loading={!catalog || catalog.attempt !== catalogAttempt || (venue && categories.length > 0 && !currentSubs)}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={catalog?.error || (venue && currentSubs?.error) || `No ${venue ? 'venue types' : 'service categories'} found`}
              onChange={(_, value) => {
                if (venue) setSubcategoryIds(value ? [value.id] : []);
                else { setCategoryIds(value ? [value.id] : []); setSubcategoryIds([]); }
                setPage(1);
              }}
              renderInput={(params) => <TextField {...params} placeholder={bannerIds.length > 1 ? `${bannerIds.length} categories selected` : venue ? 'Search venue types' : 'Search service categories'} slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': venue ? 'Search venue types' : 'Search service categories' } }} />}
              sx={{ flex: 1, minWidth: 0, '& .MuiOutlinedInput-root': { fontSize: 13, paddingBlock: 0, bgcolor: 'transparent', boxShadow: 'none' }, '&& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline, && .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, && .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 }, '& .MuiOutlinedInput-root.Mui-focused': { outline: 0, boxShadow: 'none' }, '& .MuiOutlinedInput-root .MuiAutocomplete-input': { paddingBlock: '8px', cursor: 'pointer' } }}
            /></div>
            <button type="submit" className={styles.primary}>Search</button>
          </form>
        </div>
      </section>
      <div className={styles.container}>
        <aside aria-label={`${venue ? 'Venue' : 'Service'} filters`} className={styles.sidebar}>
          <div className={styles.filterHeader}><h2><MarketplaceIcon name="filter" />Filters</h2><button type="button" onClick={clearFilters} disabled={!filtering && !search} className={styles.textButton}>Clear All</button></div>
          <div className={styles.filterBody}>
            <div className={styles.filterGroup}><h3>Search {noun}</h3>
              <form className={styles.sidebarSearch} onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); setPage(1); }}>
                <input type="search" aria-label={`Custom search for wedding ${noun}`} placeholder={venue ? 'Search venues by name' : 'Search services by name'} value={search} onChange={(event) => setSearch(event.target.value)} />
                <button type="submit" aria-label={`Search ${noun}`}><MarketplaceIcon name="search" /></button>
              </form>
            </div>
            <div className={styles.filterGroup}><h3>{venue ? 'Venue Category' : 'Service Category'}</h3><div className={styles.categoryList}>
              {(!catalog || catalog.attempt !== catalogAttempt) ? <p role="status" className={styles.note}>Loading categories...</p> : catalog.error ? <div role="alert" className={styles.error}>{catalog.error}<button type="button" onClick={() => setCatalogAttempt((value) => value + 1)} className={styles.textButton}> Retry</button></div> : !categories.length ? <p className={styles.note}>No categories available.</p>  : venue ? !currentSubs ? <p role="status" className={styles.note}>Loading venue categories...</p> : currentSubs.error ? <div role="alert" className={styles.error}>{currentSubs.error}<button type="button" onClick={() => setSubAttempt((value) => value + 1)} className={styles.textButton}> Retry</button></div> : !venueSubcategories.length ? <p className={styles.note}>No venue categories available.</p> : venueSubcategories.map((item) => <FormControlLabel key={item.id} sx={{ m: 0, width: '100%', display: 'flex', alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: 13, py: 0.75, overflowWrap: 'anywhere' } }} control={<Checkbox size="small" checked={subcategoryIds.includes(item.id)} onChange={() => { setSubcategoryIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]); setPage(1); }} sx={checkboxSx} />} label={item.name} />) : categories.map((category) => <div key={category.id}>
                <FormControlLabel sx={{ m: 0, width: '100%', alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: 13, py: 0.75, overflowWrap: 'anywhere' } }} control={<Checkbox size="small" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} sx={checkboxSx} />} label={category.name} />
                {categoryIds.includes(category.id) && <div className={styles.subcategories}>{!currentSubs ? <p role="status" className={styles.note}>Loading {venue ? 'venue types' : 'services'}...</p> : currentSubs.error ? <div role="alert" className={styles.error}>{currentSubs.error}<button type="button" onClick={() => setSubAttempt((value) => value + 1)} className={styles.textButton}> Retry</button></div> : (currentSubs.groups.find((group) => group.id === category.id)?.items || []).length ? currentSubs.groups.find((group) => group.id === category.id).items.map((item) => <FormControlLabel key={item.id} sx={{ m: 0, width: '100%', display: 'flex', alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: 12, py: 0.75, overflowWrap: 'anywhere' } }} control={<Checkbox size="small" checked={subcategoryIds.includes(item.id)} onChange={() => { setSubcategoryIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id]); setPage(1); }} sx={checkboxSx} />} label={item.name} />) : <p className={styles.note}>No {venue ? 'venue types' : 'services'} available.</p>}</div>}
              </div>)}
            </div></div>
            <div className={styles.filterGroup}><h3>Price Range</h3><div style={{ padding: '0 9px' }}><Slider value={priceRange} min={0} max={priceCeiling} step={venue ? 5000 : 1000} onChange={(_, value) => { setPriceRange(value); setPage(1); }} getAriaLabel={(index) => index === 0 ? 'Minimum price' : 'Maximum price'} getAriaValueText={(value) => listingPrice(value)} disableSwap sx={{ color: '#b61f4b', height: 4, '& .MuiSlider-thumb': { width: 18, height: 18, bgcolor: '#fff', border: '1px solid #b3acd5' }, '& .MuiSlider-rail': { bgcolor: '#f3d7e0', opacity: 1 } }} /></div><p className={styles.rangeLabel}>{listingPrice(priceRange[0])} &ndash; {listingPrice(priceRange[1])}{priceRange[1] === priceCeiling && '+'}</p></div>
            <div className={styles.filterGroup}><h3>Location</h3>{cityInput('Filter city')}{cities.error && <div role="alert" className={styles.error}>{cities.error}<button type="button" onClick={cities.retry} className={styles.textButton}> Retry</button></div>}</div>
          </div>
        </aside>
        <section aria-label={`Wedding ${noun} results`} className={styles.results}>
          <div className={styles.toolbar}><div className={styles.resultsSummary}><h2 aria-live="polite">{current && !current.error ? total != null ? `${total} ${venue ? 'Venues' : 'Services'} Found` : `${items.length} ${venue ? 'Venues' : 'Services'} on this page` : `Wedding ${venue ? 'Venues' : 'Services'}`}</h2>
            {activeFilters.length > 0 && <ul className={styles.filterChips} aria-label="Active filters">{activeFilters.map((filter) => <li key={filter.key}><button type="button" onClick={filter.remove} aria-label={`Remove ${filter.label} filter`} title={`Remove ${filter.label}`}><span>{filter.label}</span><span aria-hidden="true">&times;</span></button></li>)}</ul>}
          </div><div className={styles.toolbarActions}>
            <div className={styles.viewSwitch} aria-label="Results layout"><button type="button" aria-label="Grid view" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}><MarketplaceIcon name="grid" /></button><button type="button" aria-label="List view" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><MarketplaceIcon name="list" /></button></div>
          </div></div>
          {!filtersReady && currentSubs?.error ? <Alert severity="error">Unable to apply category filters. Retry the category options in the sidebar.</Alert> : !current ? <div role="status" className={styles.grid}><span className="sr-only">Loading {noun}...</span>{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className={styles.skeleton} />)}</div> : current.error ? <Alert severity="error" action={<Button onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert> : items.length ? <div className={`${styles.grid} ${layout === 'list' ? styles.list : ''}`}>{items.map((item, index) => <MarketplaceResultCard key={item.id || item.slug || index} item={item} venue={venue} />)}</div> : <div className={styles.empty}><div className={styles.emptyImage}><Image src={heroImage} alt="" fill sizes="120px" className={styles.photo} /></div><h2>No {noun} found</h2><p>Try another city, category, or search term.</p><button type="button" onClick={clearFilters} className={styles.textButton}>Clear filters</button></div>}
          {(page > 1 || hasNextPage) && <nav aria-label={`${venue ? 'Venue' : 'Service'} marketplace pages`} className={styles.pagination}><Button disabled={!current || page === 1} onClick={() => setPage(page - 1)} sx={{ color: '#b61f4b' }}>Previous</Button><span>Page {page}</span><Button disabled={!current || Boolean(current.error) || !hasNextPage} onClick={() => setPage(page + 1)} sx={{ color: '#b61f4b' }}>Next</Button></nav>}
        </section>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-8 text-center text-sm leading-7 text-stone-600">{pageContent.intro[0]}</div>
      <WebsiteSections pageKey={contentKey} />
      <WebsiteActions pageKey={contentKey} />
    </main><Footer /></>;
}
