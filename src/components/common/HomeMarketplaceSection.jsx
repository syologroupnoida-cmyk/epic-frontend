import { websiteContent } from '@/data/websiteContent.mjs';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { loadMarketplaceSelection } from '@/util/marketplaceSelection.mjs';
import { homeMarketplaceHref } from '@/util/marketplaceNavigation.mjs';
import cardStyles from './MarketplaceCards.module.css';

const limit = 20;
export default function HomeMarketplaceSection({ venue = false, categories = [], categoriesLoading = false, Card }) {
  const noun = venue ? 'venues' : 'services';
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchToggleRef = useRef(null);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [options, setOptions] = useState(null);
  const [optionAttempt, setOptionAttempt] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const optionsRef = useRef(null);
  const [scrollable, setScrollable] = useState({ left: false, right: false });
  const activeCategories = categories.filter((item) => item.isActive !== false && (venue ? item.offeringKind === 'VENUE_PROPERTY' : !item.offeringKind || item.offeringKind === 'SERVICE'));
  const optionKey = JSON.stringify(venue ? activeCategories.map((item) => item.id) : selectedId ? [selectedId] : []);
  const currentOptions = options?.key === optionKey && options?.attempt === optionAttempt ? options : null;
  useEffect(() => {
    const ids = JSON.parse(optionKey);
    if (!ids.length) return;
    const controller = new AbortController();
    Promise.all(ids.map((id) => loadPublicServiceSubcategories(getPublicCatalog, id, { signal: controller.signal }))).then((groups) => {
      const items = [...new Map(groups.flat().filter((item) => item.isActive !== false).map((item) => [item.id, item])).values()];
      if (!controller.signal.aborted) setOptions({ key: optionKey, attempt: optionAttempt, items });
    }).catch((error) => { if (!controller.signal.aborted) setOptions({ key: optionKey, attempt: optionAttempt, error: error.message }); });
    return () => controller.abort();
  }, [optionKey, optionAttempt]);

  const choices = venue ? currentOptions?.items || [] : activeCategories;
  useEffect(() => {
    const element = optionsRef.current;
    if (!element) return;
    function updateScroll() {
      const left = element.scrollLeft > 1;
      const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
      setScrollable((current) => current.left === left && current.right === right ? current : { left, right });
    }
    queueMicrotask(updateScroll);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    observer?.observe(element);
    element.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    return () => { observer?.disconnect(); element.removeEventListener('scroll', updateScroll); window.removeEventListener('resize', updateScroll); };
  }, [choices.length]);
  function scrollOptions(direction) {
    const element = optionsRef.current;
    if (element) element.scrollBy({ left: direction * Math.max(180, element.clientWidth * 0.65), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  const ready = search.trim() === appliedSearch && (!selectedId || venue || Boolean(currentOptions && !currentOptions.error));
  const ids = !selectedId ? [] : venue ? [selectedId] : (currentOptions?.items || []).map((item) => item.id);
  const requestKey = JSON.stringify({ venue, subcategoryIds: ids, search: appliedSearch, page: 1, limit, emptyScope: !venue && Boolean(selectedId) && ready && !ids.length });
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const selection = JSON.parse(requestKey);
    const request = selection.emptyScope ? Promise.resolve({ items: [], total: 0, hasNextPage: false }) : loadMarketplaceSelection(selection, controller.signal);
    request.then((data) => { if (!controller.signal.aborted) setResult({ ...data, key: requestKey, attempt }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ key: requestKey, attempt, error: error.message }); });
    return () => controller.abort();
  }, [requestKey, ready, attempt]);
  const current = ready && result?.key === requestKey && result?.attempt === attempt ? result : null;
  const items = (current?.items || []).slice(0, 10);
  const optionError = currentOptions?.error;
  const displayError = !ready && optionError ? optionError : current?.error;
  function choose(id) { setSelectedId(id); }
  function closeSearch() {
    setSearchOpen(false);
    setSearch('');
    setAppliedSearch('');
   
    searchToggleRef.current?.focus();
  }
  function toggleSearch() {
    if (searchOpen) closeSearch();
    else {
      setSearchOpen(true);
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }

  return <section id={`wedding-${noun}`} className={`${venue ? 'bg-white' : 'bg-[#fff9f5]'} py-12 sm:py-16`}><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className={`${cardStyles.sectionHeading} ${searchOpen ? cardStyles.searchOpenHeading : ''}`}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">{venue ? 'A beautiful place to begin' : 'Find Your Perfect Wedding Team'}</p><h2 className="mt-2 font-serif text-3xl font-bold text-stone-950 sm:text-4xl">{venue ? 'Find your wedding venue' : 'Find your wedding services'}</h2><p className="mt-3 text-sm text-stone-600">{venue ? websiteContent.venues.subtitle : websiteContent.home.sections.find((section) => section.title === 'Find Your Perfect Wedding Team').paragraphs[0]}</p>
    <form role="search" aria-label={`Search wedding ${noun}`} className={`${cardStyles.sectionSearch} ${searchOpen ? cardStyles.searchExpanded : ''}`} onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); setAttempt((value) => value + 1); }} onKeyDown={(event) => { if (event.key === 'Escape') closeSearch(); }}>
      {searchOpen && <input ref={searchInputRef} id={`home-${noun}-search`} type="search" aria-label={`Search wedding ${noun} by name`} placeholder={`Search ${noun}...`} value={search} onChange={(event) => { setSearch(event.target.value); }} />}
      <button ref={searchToggleRef} type="button" onClick={toggleSearch} aria-label={searchOpen ? `Close ${noun} search` : `Search ${noun}`} aria-expanded={searchOpen} aria-controls={searchOpen ? `home-${noun}-search` : undefined}>
        {searchOpen ? <span aria-hidden="true">&times;</span> : <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>}
      </button>
      {searchOpen && <button type="submit" className="sr-only">Search {noun}</button>}
    </form>
    </div>
    <div className={cardStyles.categoryRail}>
      <button type="button" onClick={() => scrollOptions(-1)} disabled={!scrollable.left} aria-label={venue ? 'Previous venue types' : 'Previous service categories'} aria-controls={`${noun}-category-options`} className={cardStyles.scrollArrow}><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg></button>
      <div ref={optionsRef} id={`${noun}-category-options`} role="group" aria-label={venue ? 'Filter wedding venues by type' : 'Filter wedding services by category'} className={cardStyles.categoryScroller}>
        <button type="button" aria-pressed={!selectedId} onClick={() => choose('')} className={cardStyles.categoryTab}>{venue ? 'All venues' : 'All services'}</button>
        {choices.map((item) => <button key={item.id} type="button" aria-pressed={selectedId === item.id} onClick={() => choose(item.id)} className={cardStyles.categoryTab}>{item.name}</button>)}
      </div>
      <button type="button" onClick={() => scrollOptions(1)} disabled={!scrollable.right} aria-label={venue ? 'Next venue types' : 'Next service categories'} aria-controls={`${noun}-category-options`} className={cardStyles.scrollArrow}><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg></button>
    </div>
    {(categoriesLoading || (venue && JSON.parse(optionKey).length > 0 && !currentOptions)) && <p role="status" className="mb-5 text-center text-xs text-stone-500">Loading {venue ? 'venue options' : 'service categories'}...</p>}
    {optionError && ready && <div role="alert" className="mb-5 text-center text-xs text-red-700">{optionError}<button type="button" onClick={() => setOptionAttempt((value) => value + 1)} className="ml-2 underline">Retry options</button></div>}
    {displayError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-8 text-center"><p className="text-sm text-red-700">{displayError}</p><button type="button" onClick={() => !ready ? setOptionAttempt((value) => value + 1) : setAttempt((value) => value + 1)} className="mt-3 font-semibold text-[#b61f4b]">Try again</button></div> : !current ? <div role="status" className={venue ? cardStyles.venues : cardStyles.services}><span className="sr-only">Loading {noun}...</span>{[0, 1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-xl border border-rose-100 bg-rose-50" />)}</div> : items.length ? <div className={venue ? cardStyles.venues : cardStyles.services}>{items.map((item, index) => venue ? <Card key={item.id || item.slug || index} property={item} marketplaceHref={homeMarketplaceHref(item, { venue, selectedId, categories })} /> : <Card key={item.id || item.slug || index} listing={item} marketplaceHref={homeMarketplaceHref(item, { venue, selectedId, categories })} />)}</div> : <div className="rounded-xl border border-rose-100 bg-white p-10 text-center"><h3 className="font-serif text-xl font-bold">No {noun} found</h3><p className="mt-2 text-sm text-stone-500">{appliedSearch ? 'Try another search or category.' : selectedId ? 'Try another category or explore the marketplace.' : `Explore the marketplace for wedding ${noun}.`}</p></div>}
    <div className="mt-16 flex justify-center sm:mt-20"><Link href={venue ? '/venues' : '/services'} className="inline-flex items-center gap-2 rounded-[100px] border border-[#b61f4b] bg-transparent px-5 py-2 text-xs font-semibold text-[#b61f4b] transition hover:border-[#981a3f] hover:text-[#981a3f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b61f4b]" aria-label={`Explore more wedding ${noun}`}>Explore more <span aria-hidden="true">&rarr;</span></Link></div>
  </div></section>;
}
