import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import SvgIcon from "@mui/material/SvgIcon";
import weddingReception from "@/images/hero-reception.png";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import useMarketplaceVendors from "@/components/vendor/useMarketplaceVendors";
import OwnVendorCard from "@/components/vendor/OwnVendorCard";
import VendorImage from "@/components/vendor/VendorImage";
import VendorActions from "@/components/vendor/VendorActions";
import VendorServiceChips from "@/components/vendor/VendorServiceChips";
import { formatVendorPrice, vendorHref } from "@/data/vendorDirectory";
import useCities from "@/util/useCities";
import { getPublicCatalog } from "@/util/publicCatalog.mjs";
import { loadPublicServiceCategories, loadPublicServiceSubcategories } from "@/util/serviceCategories.mjs";

export { default as VendorActions } from "@/components/vendor/VendorActions";
export { default as VendorImage } from "@/components/vendor/VendorImage";

const queryValue = (value) => typeof value === "string" ? value : "";

function FilterChevron({ open }) {
  return <SvgIcon className={open ? "vd-mui-chevron is-open" : "vd-mui-chevron"} viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" /></SvgIcon>;
}

export function VendorRating({ vendor }) {
  return <div className="vd-rating">{vendor.rating !== null ? <span>{vendor.rating.toFixed(1)} ★</span> : <small>No ratings yet</small>}{vendor.ratings !== null && <span>{vendor.ratings} Ratings</span>}{vendor.badge && <small>{vendor.badge}</small>}</div>;
}

export function VendorRequestState({ loading, error, notFound, retry }) {
  return <div className="vd-empty" role={error ? "alert" : "status"}>{loading ? <p>Loading vendor information…</p> : <><h2>{notFound ? "Business profile not found" : "Something went wrong"}</h2><p>{notFound ? "This vendor may no longer be available." : error}</p>{!notFound && <button type="button" onClick={retry}>Try again</button>}</>}</div>;
}

export default function VendorDirectory({ category }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchBoxRef = useRef(null);
  const deferredSearch = useDeferredValue(search.trim());
  const [cityId, setCityId] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [offeringKind, setOfferingKind] = useState("SERVICE");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [subcategoryLoading, setSubcategoryLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const { cities, loading: citiesLoading, error: citiesError, retry: retryCities } = useCities();

  useEffect(() => {
    if (!router.isReady) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSearch(queryValue(router.query.search));
      setCityId(queryValue(router.query.cityId));
      setCategoryId(queryValue(router.query.serviceCategoryId));
      setExpandedCategoryId(queryValue(router.query.serviceCategoryId));
      setSubcategoryLoading(Boolean(queryValue(router.query.serviceCategoryId)));
      setSubcategoryId(queryValue(router.query.serviceSubcategoryId));
      setOfferingKind(queryValue(router.query.offeringKind) || "SERVICE");
      const requestedPage = Number(router.query.page);
      setPage(Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    });
    return () => { active = false; };
  }, [router.isReady, router.query.cityId, router.query.offeringKind, router.query.page, router.query.search, router.query.serviceCategoryId, router.query.serviceSubcategoryId]);

  useEffect(() => {
    const controller = new AbortController();
    loadPublicServiceCategories(getPublicCatalog, { signal: controller.signal }).then((records) => {
      if (!controller.signal.aborted) setCategories(records);
    }).catch(() => { if (!controller.signal.aborted) setCatalogError("Unable to load service categories."); })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [catalogAttempt]);

  useEffect(() => {
    if (!expandedCategoryId) return undefined;
    const controller = new AbortController();
    loadPublicServiceSubcategories(getPublicCatalog, expandedCategoryId, { signal: controller.signal }).then((records) => {
      if (!controller.signal.aborted) setSubcategories(records);
    }).catch(() => { if (!controller.signal.aborted) setSubcategories([]); })
      .finally(() => { if (!controller.signal.aborted) setSubcategoryLoading(false); });
    return () => controller.abort();
  }, [expandedCategoryId]);

  const apiFilters = useMemo(() => ({ search: deferredSearch, cityId, serviceCategoryId: categoryId, serviceSubcategoryId: subcategoryId, offeringKind }), [categoryId, cityId, deferredSearch, offeringKind, subcategoryId]);
  const { vendors = [], pagination, loading, error, retry } = useMarketplaceVendors(category, { page, filters: apiFilters, enabled: router.isReady });
  const selectedCity = cities.find((item) => item.id === cityId);
  const selectedCityName = selectedCity?.name || (cityId ? queryValue(router.query.city) : "");
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const selectedSubcategory = subcategories.find((item) => item.id === subcategoryId);
  const visibleCities = cities.filter((item) => !citySearch.trim() || `${item.name} ${item.stateName || ""} ${item.countryCode || ""}`.toLowerCase().includes(citySearch.trim().toLowerCase()));
  const searchCategoryOptions = categories.filter((item) => !search.trim() || `${item.name} ${item.description || ""}`.toLowerCase().includes(search.trim().toLowerCase()));
  const filtered = vendors;
  const hasApiFilters = Boolean(deferredSearch || cityId || categoryId || subcategoryId);

  useEffect(() => {
    if (!searchDropdownOpen) return undefined;
    function closeOutside(event) { if (!searchBoxRef.current?.contains(event.target)) setSearchDropdownOpen(false); }
    function closeEscape(event) { if (event.key === "Escape") setSearchDropdownOpen(false); }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [searchDropdownOpen]);

  function replaceUrl(next) {
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.cityId) { params.set("cityId", next.cityId); const item = cities.find((entry) => entry.id === next.cityId); if (item?.name) params.set("city", item.name); }
    if (next.categoryId) { params.set("serviceCategoryId", next.categoryId); const item = categories.find((entry) => entry.id === next.categoryId); if (item?.name) params.set("categoryName", item.name); }
    if (next.subcategoryId) { params.set("serviceSubcategoryId", next.subcategoryId); const item = subcategories.find((entry) => entry.id === next.subcategoryId); if (item?.name) params.set("serviceName", item.name); }
    if (next.offeringKind) params.set("offeringKind", next.offeringKind);
    if (next.page > 1) params.set("page", String(next.page));
    const path = router.asPath.split("?")[0];
    router.replace(`${path}${params.size ? `?${params}` : ""}`, undefined, { shallow: true, scroll: false });
  }

  function changeFilter(name, value) {
    const next = { search, cityId, categoryId, subcategoryId, offeringKind, page: 1, [name]: value };
    if (name === "categoryId") { const item = categories.find((entry) => entry.id === value); next.subcategoryId = ""; setCategoryId(value); setSubcategoryId(""); if (value) { if (expandedCategoryId !== value) { setSubcategories([]); setSubcategoryLoading(true); } setExpandedCategoryId(value); } if (item?.offeringKind) { next.offeringKind = item.offeringKind; setOfferingKind(item.offeringKind); } }
    if (name === "cityId") setCityId(value);
    if (name === "subcategoryId") setSubcategoryId(value);
    if (name === "offeringKind") { setOfferingKind(value); setCategoryId(""); setSubcategoryId(""); setSubcategories([]); next.categoryId = ""; next.subcategoryId = ""; }
    setPage(1); replaceUrl(next);
  }

  function toggleCategory(item) {
    if (expandedCategoryId === item.id) { setExpandedCategoryId(""); return; }
    setExpandedCategoryId(item.id); setSubcategories([]); setSubcategoryLoading(true);
  }

  function selectSubcategory(item, serviceId) {
    const nextOfferingKind = item.offeringKind || offeringKind;
    setCategoryId(item.id); setSubcategoryId(serviceId); setOfferingKind(nextOfferingKind); setPage(1);
    replaceUrl({ search, cityId, categoryId: item.id, subcategoryId: serviceId, offeringKind: nextOfferingKind, page: 1 });
  }

  function selectSearchCategory(item) {
    const nextOfferingKind = item.offeringKind || offeringKind;
    setSearch(""); setSearchDropdownOpen(false); setCategoryId(item.id); setExpandedCategoryId(item.id); setSubcategoryId(""); setSubcategories([]); setSubcategoryLoading(true); setOfferingKind(nextOfferingKind); setPage(1);
    replaceUrl({ search: "", cityId, categoryId: item.id, subcategoryId: "", offeringKind: nextOfferingKind, page: 1 });
  }

  function clearFilters() {
    setSearch(""); setCitySearch(""); setCityId(""); setCategoryId(""); setSubcategoryId(""); setExpandedCategoryId(""); setSubcategories([]); setOfferingKind("SERVICE"); setPage(1);
    replaceUrl({ search: "", cityId: "", categoryId: "", subcategoryId: "", offeringKind: "SERVICE", page: 1 });
  }

  function changePage(nextPage) {
    setPage(nextPage); replaceUrl({ search, cityId, categoryId, subcategoryId, offeringKind, page: nextPage });
    window.scrollTo({ top: 620, behavior: "smooth" });
  }

  const heading = selectedSubcategory?.name || selectedCategory?.name || queryValue(router.query.serviceName) || queryValue(router.query.categoryName) || category.title;
  return <div className="vendor-directory vendor-directory--listing"><Head><title>{heading} | Wedding Vendor Business Profiles | Epic Wedz</title><meta name="description" content={`Browse ${heading.toLowerCase()} business profiles and wedding services on Epic Wedz.`} /></Head><Header /><main className="vd-main">
    <section className="vd-discovery-hero" aria-labelledby="vd-discovery-title"><div className="vd-hero-copy"><span className="vd-hero-kicker"><span aria-hidden="true">✧</span> THE EPIC WEDZ VENDOR EDIT</span><h1 id="vd-discovery-title">Little details.<br /><em>Extraordinary celebrations.</em></h1><p>Find the people who bring your wedding vision to life, one beautiful detail at a time.</p><div className="vd-hero-footnote"><span aria-hidden="true">◇</span> Your vision. Your people. Your perfect day.</div></div><div className="vd-hero-art"><Image src={weddingReception} alt="An elegant Indian wedding celebration" fill priority sizes="(max-width: 700px) 100vw, 40vw" /><div className="vd-hero-image-note"><span aria-hidden="true">✧</span><span>A little inspiration.<br /><strong>A lifetime of memories.</strong></span></div></div></section>
    <div className="vd-search"><div><span className="vd-eyebrow">LET’S FIND YOUR PEOPLE</span><h2>Who’s on your dream team?</h2></div><div ref={searchBoxRef} className="vd-search-category-box"><div className="vd-search-input"><label htmlFor="vd-vendor-search" className="sr-only">Search vendors or choose a category</label><input id="vd-vendor-search" type="search" role="combobox" aria-expanded={searchDropdownOpen} aria-controls="vd-search-categories" aria-autocomplete="list" placeholder="Search categories or vendors…" value={search} onFocus={() => setSearchDropdownOpen(true)} onClick={() => setSearchDropdownOpen(true)} onChange={(event) => { setSearch(event.target.value); setPage(1); setSearchDropdownOpen(true); }} onBlur={() => replaceUrl({ search: search.trim(), cityId, categoryId, subcategoryId, offeringKind, page: 1 })} /><button type="button" className="vd-search-submit" aria-label="Search vendors" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchDropdownOpen(false); replaceUrl({ search: search.trim(), cityId, categoryId, subcategoryId, offeringKind, page: 1 }); }}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg></button></div>{searchDropdownOpen ? <div id="vd-search-categories" role="listbox" className="vd-search-category-menu"><div className="vd-search-category-caption">Service categories</div>{catalogLoading ? <p>Loading categories…</p> : searchCategoryOptions.length ? searchCategoryOptions.map((item) => <button key={item.id} type="button" role="option" aria-selected={categoryId === item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSearchCategory(item)}>{item.name}</button>) : <p>No matching categories</p>}</div> : null}</div></div>
    <nav className="vd-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/vendors">Wedding Vendors</Link><span>›</span><span>{heading}</span></nav>
    <div className="vd-results-heading"><div><span className="vd-eyebrow">A BEAUTIFUL BEGINNING</span><h2 className="vd-list-title">{heading}{selectedCityName ? ` in ${selectedCityName}` : " for your big day"}</h2></div><span className="vd-heading-note">Find a team that feels like you.</span></div>
    <div className="vd-results-meta" role="status">{loading ? "Loading businesses…" : error ? "Vendor directory unavailable" : `${filtered.length} businesses shown${pagination?.total !== null && pagination?.total !== undefined ? ` · ${pagination.total} total` : ""}`}<span>Marketplace filters are applied by the vendor API</span></div>
    <div className="vd-layout"><div className="vd-results">{!hasApiFilters && <OwnVendorCard category={category} publicVendors={vendors} fallback={!loading && !error && !vendors.length ? <div className="vd-empty"><h3>No vendors available yet</h3><p>Please check back soon for business profiles.</p></div> : null} />}{loading || error ? <VendorRequestState loading={loading} error={error} retry={retry} /> : <>{filtered.map((vendor, index) => { const href = vendorHref(vendor); return <article key={vendor.slug || vendor.id || index} className="vd-card"><div className="vd-card-image"><VendorImage key={vendor.image?.src || vendor.image} vendor={vendor} category={category} fill sizes="(max-width: 600px) 104px, 180px" priority={index === 0} /></div><div className="vd-card-body"><h3>{href ? <Link className="vd-card-link" href={href} aria-label={`View ${vendor.name} business profile`}>{vendor.name}</Link> : vendor.name}</h3><VendorRating vendor={vendor} />{vendor.about && <p className="vd-service vd-card-description whitespace-pre-line">{vendor.about}</p>}<p className="vd-location">{[vendor.area, vendor.city].filter(Boolean).join(", ") || "Location not provided"}</p><VendorServiceChips services={vendor.services} />{vendor.years !== null && <p className="vd-service">{vendor.years} years of experience</p>}{vendor.verified && <div className="vd-tags"><span className="vd-verified">✓ Verified profile</span></div>}<p className="vd-price">{formatVendorPrice(vendor.price)}{vendor.price !== null && <span> onwards</span>}</p><VendorActions vendor={vendor} onEnquire={() => setIsQuoteOpen(true)} /></div></article>; })}{filtered.length === 0 && <div className="vd-empty"><h3>No businesses match these filters</h3><p>Try another city, service, or a wider price range.</p><button type="button" onClick={clearFilters}>Clear all filters</button></div>}{pagination && (pagination.hasPrevPage || pagination.hasNextPage) && <nav className="vd-pagination" aria-label="Vendor pages"><button type="button" disabled={!pagination.hasPrevPage} onClick={() => changePage(Math.max(1, page - 1))}>Previous</button><span>Page {pagination.page}{pagination.totalPages > 0 ? ` of ${pagination.totalPages}` : ""}</span><button type="button" disabled={!pagination.hasNextPage} onClick={() => changePage(page + 1)}>Next</button></nav>}</>}</div>
      <aside className="vd-marketplace-sidebar" aria-label="Filter wedding vendors"><div className="vd-marketplace-filter"><div className="vd-filter-heading"><span>Refine results</span><h2>Find your perfect match</h2><p>Open a category, then check the service you want.</p></div><div className="vd-city-filter"><button type="button" className="vd-filter-section-trigger" aria-expanded={cityOpen} onClick={() => setCityOpen((open) => !open)}><span>{selectedCityName || "All cities"}</span><FilterChevron open={cityOpen} /></button>{cityOpen ? <><label className="vd-city-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg><span className="sr-only">Search cities</span><input type="search" value={citySearch} onChange={(event) => setCitySearch(event.target.value)} placeholder="Search city or state…" /></label><div className="vd-checkbox-list">{citiesLoading ? <p>Loading cities…</p> : <><label><Checkbox checked={!cityId} onChange={() => changeFilter("cityId", "")} size="small" disableRipple /><span>All cities</span></label>{visibleCities.map((item) => <label key={item.id}><Checkbox checked={cityId === item.id} onChange={() => changeFilter("cityId", item.id)} size="small" disableRipple /><span>{item.label}</span></label>)}{!visibleCities.length ? <p>No matching cities</p> : null}</>}</div></> : null}</div><div className="vd-category-filter"><div className="vd-category-filter-title"><span>All categories</span>{categoryId ? <button type="button" onClick={() => changeFilter("categoryId", "")}>Clear</button> : null}</div>{catalogLoading ? <p className="vd-category-message">Loading categories…</p> : <div className="vd-category-accordion">{categories.map((item) => { const expanded = expandedCategoryId === item.id; const selected = categoryId === item.id; return <div key={item.id} className="vd-category-group"><div className="vd-category-trigger"><label><Checkbox checked={selected} onChange={() => changeFilter("categoryId", selected ? "" : item.id)} size="small" disableRipple /><span>{item.name}</span></label><button type="button" aria-label={`${expanded ? "Hide" : "Show"} ${item.name} subcategories`} aria-expanded={expanded} onClick={() => toggleCategory(item)}><FilterChevron open={expanded} /></button></div>{expanded ? <div className="vd-subcategory-filter">{subcategoryLoading ? <p>Loading subcategories…</p> : <div className="vd-subcategory-list"><label><Checkbox checked={selected && !subcategoryId} onChange={() => selectSubcategory(item, "")} size="small" disableRipple /><span>All subcategories</span></label>{subcategories.map((service) => <label key={service.id}><Checkbox checked={selected && subcategoryId === service.id} onChange={() => selectSubcategory(item, service.id)} size="small" disableRipple /><span>{service.name}</span></label>)}</div>}</div> : null}</div>; })}</div>}</div>{(citiesError || catalogError) && <p className="vd-filter-error">{citiesError || catalogError} <button type="button" onClick={() => { retryCities(); setCatalogLoading(true); setCatalogError(""); setCatalogAttempt((value) => value + 1); }}>Try again</button></p>}<button type="button" className="vd-filter-reset" onClick={clearFilters}>Reset all filters</button></div></aside>
    </div>
  </main><Footer /><QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} /></div>;
}
