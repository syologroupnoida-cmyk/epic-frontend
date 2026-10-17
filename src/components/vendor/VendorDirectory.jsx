import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import weddingReception from "@/images/hero-reception.png";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import useMarketplaceVendors from "@/components/vendor/useMarketplaceVendors";
import OwnVendorCard from "@/components/vendor/OwnVendorCard";
import VendorImage from "@/components/vendor/VendorImage";
import VendorActions from "@/components/vendor/VendorActions";
import VendorServiceChips from "@/components/vendor/VendorServiceChips";
export { default as VendorActions } from "@/components/vendor/VendorActions";
export { default as VendorImage } from "@/components/vendor/VendorImage";
import { formatVendorPrice, vendorHref } from "@/data/vendorDirectory";

export function VendorRating({ vendor }) {
  return <div className="vd-rating">{vendor.rating !== null ? <span>{vendor.rating.toFixed(1)} ★</span> : <small>No ratings yet</small>}{vendor.ratings !== null && <span>{vendor.ratings} Ratings</span>}{vendor.badge && <small>{vendor.badge}</small>}</div>;
}

export function VendorRequestState({ loading, error, notFound, retry }) {
  return <div className="vd-empty" role={error ? "alert" : "status"}>{loading ? <p>Loading vendor information…</p> : <><h2>{notFound ? "Business profile not found" : "Something went wrong"}</h2><p>{notFound ? "This vendor may no longer be available." : error}</p>{!notFound && <button type="button" onClick={retry}>Try again</button>}</>}</div>;
}

export default function VendorDirectory({ category }) {
  const [page, setPage] = useState(1);
  const { vendors = [], pagination, loading, error, retry } = useMarketplaceVendors(category, { page });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("relevance");
  const [topRated, setTopRated] = useState(false);
  const [verified, setVerified] = useState(false);
  const [budget, setBudget] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const filtered = vendors.filter((vendor) => (!city || vendor.city === city) && (!query || `${vendor.name} ${vendor.area} ${vendor.category}`.toLowerCase().includes(query.toLowerCase().trim())) && (!topRated || (vendor.rating !== null && vendor.rating >= 4.5)) && (!verified || vendor.verified) && (!budget || (vendor.price !== null && vendor.price <= Number(budget)))).sort((a, b) => sort === "rating" ? (b.rating ?? -1) - (a.rating ?? -1) : sort === "price" ? (a.price ?? Infinity) - (b.price ?? Infinity) : 0);
  function resetFilters() { setQuery(""); setCity(""); setSort("relevance"); setTopRated(false); setVerified(false); setBudget(""); }

  return <div className="vendor-directory vendor-directory--listing"><Head><title>{category.title} | Wedding Vendor Business Profiles | Epic Wedz</title><meta name="description" content={`Browse ${category.title.toLowerCase()} business profiles, services, and wedding inspiration on Epic Wedz.`} /></Head><Header /><main className="vd-main">
    <section className="vd-discovery-hero" aria-labelledby="vd-discovery-title">
      <div className="vd-hero-copy"><span className="vd-hero-kicker"><span aria-hidden="true">✧</span> THE EPIC WEDZ VENDOR EDIT</span><h1 id="vd-discovery-title">Little details.<br /><em>Extraordinary celebrations.</em></h1><p>Find the people who bring your wedding vision to life, one beautiful detail at a time.</p><div className="vd-hero-footnote"><span aria-hidden="true">◇</span> Your vision. Your people. Your perfect day.</div></div>
      <div className="vd-hero-art"><Image src={weddingReception} alt="An elegant Indian wedding celebration" fill priority sizes="(max-width: 700px) 100vw, 40vw" /><div className="vd-hero-image-note"><span aria-hidden="true">✧</span><span>A little inspiration.<br /><strong>A lifetime of memories.</strong></span></div></div>
    </section>
    <div className="vd-search"><div><span className="vd-eyebrow">LET’S FIND YOUR PEOPLE</span><h2>Who’s on your dream team?</h2></div><div className="vd-search-fields"><label><span className="sr-only">Select vendor city</span><select value={city} onChange={(event) => setCity(event.target.value)}><option value="">All cities</option>{[...new Set(vendors.map((vendor) => vendor.city).filter(Boolean))].map((name) => <option key={name}>{name}</option>)}</select></label><label className="vd-search-input"><span className="sr-only">Search businesses</span><input type="search" placeholder="Search businesses on this page…" value={query} onChange={(event) => setQuery(event.target.value)} /><span aria-hidden="true">⌕</span></label></div></div>
    <nav className="vd-category-shortcuts" aria-label="Explore wedding vendor categories"><span>Explore the essentials</span>{[{ title: "Photography", slug: "wedding-photographers", icon: "◎" }, { title: "Decor & flowers", slug: "wedding-decorators", icon: "✿" }, { title: "Bridal beauty", slug: "bridal-makeup", icon: "✧" }, { title: "Catering", slug: "caterers", icon: "♧" }].map((item) => <Link key={item.slug} href={`/vendors/${item.slug}`} aria-current={category.slug === item.slug ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.title}</Link>)}</nav>
    <nav className="vd-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><span>Wedding Vendors</span><span>›</span><span>{category.title}</span></nav>
    <div className="vd-results-heading"><div><span className="vd-eyebrow">A BEAUTIFUL BEGINNING</span><h2 className="vd-list-title">{category.title}{city ? ` in ${city}` : " for your big day"}</h2></div><span className="vd-heading-note">Find a team that feels like you.</span></div>
    <div className="vd-filters"><label><span className="sr-only">Sort vendors</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Relevance</option><option value="rating">Highest rated</option><option value="price">Price: Low to high</option></select></label><button type="button" aria-pressed={topRated} onClick={() => setTopRated(!topRated)}>★ Top Rated</button><button type="button" aria-pressed={verified} onClick={() => setVerified(!verified)}>✓ Verified</button><label><span className="sr-only">Maximum starting price</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Price</option><option value="25000">Up to ₹25,000</option><option value="50000">Up to ₹50,000</option><option value="100000">Up to ₹1,00,000</option></select></label><button type="button" aria-expanded={filtersOpen} aria-controls="vd-more-filters" onClick={() => setFiltersOpen(!filtersOpen)}>☷ All Filters</button>{(city || query || topRated || verified || budget || sort !== "relevance") && <button type="button" className="vd-clear" onClick={resetFilters}>Clear filters</button>}</div>
    {filtersOpen && <div id="vd-more-filters" className="vd-filter-panel"><strong>Refine your search</strong><p>Choose a city above, set your price range, or filter by ratings and verification. These filters work together.</p><label><input type="checkbox" checked={topRated} onChange={(event) => setTopRated(event.target.checked)} /> Rated 4.5 and above</label><label><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> Verified profiles only</label><button type="button" onClick={() => setFiltersOpen(false)}>Show {filtered.length} businesses</button></div>}
    <div className="vd-results-meta" role="status">{loading ? "Loading businesses…" : error ? "Vendor directory unavailable" : `${filtered.length} businesses shown${pagination?.total !== null && pagination?.total !== undefined ? ` · ${pagination.total} total` : ""}`}<span>Search and filters apply to the current page</span></div>
    <div className="vd-layout"><div className="vd-results"><OwnVendorCard category={category} publicVendors={vendors} fallback={!loading && !error && !vendors.length ? <div className="vd-empty"><h3>No vendors available yet</h3><p>Please check back soon for business profiles.</p></div> : null} />{loading || error ? <VendorRequestState loading={loading} error={error} retry={retry} /> : <>{filtered.map((vendor, index) => {
      const href = vendorHref(vendor);
      return <article key={vendor.slug || vendor.id || index} className="vd-card"><div className="vd-card-image"><VendorImage key={vendor.image?.src || vendor.image} vendor={vendor} category={category} fill sizes="(max-width: 600px) 104px, 180px" priority={index === 0} /></div><div className="vd-card-body"><h3>{href ? <Link className="vd-card-link" href={href} aria-label={`View ${vendor.name} business profile`}>{vendor.name}</Link> : vendor.name}</h3><VendorRating vendor={vendor} />{vendor.about && <p className="vd-service vd-card-description whitespace-pre-line">{vendor.about}</p>}<p className="vd-location">{[vendor.area, vendor.city].filter(Boolean).join(", ") || "Location not provided"}</p><VendorServiceChips services={vendor.services} />{vendor.years !== null && <p className="vd-service">{vendor.years} years of experience</p>}{vendor.verified && <div className="vd-tags"><span className="vd-verified">✓ Verified profile</span></div>}<p className="vd-price">{formatVendorPrice(vendor.price)}{vendor.price !== null && <span> onwards</span>}</p><VendorActions vendor={vendor} onEnquire={() => setIsQuoteOpen(true)} /></div></article>;
    })}{filtered.length === 0 && vendors.length > 0 && <div className="vd-empty"><h3>No businesses match your search</h3><p>Try another city or a wider price range.</p><button type="button" onClick={resetFilters}>Clear all filters</button></div>}
    {pagination && (pagination.hasPrevPage || pagination.hasNextPage) && <nav className="vd-pagination" aria-label="Vendor pages"><button type="button" disabled={!pagination.hasPrevPage} onClick={() => { resetFilters(); setPage(Math.max(1, page - 1)); }}>Previous</button><span>Page {pagination.page}{pagination.totalPages > 0 ? ` of ${pagination.totalPages}` : ""}</span><button type="button" disabled={!pagination.hasNextPage} onClick={() => { resetFilters(); setPage(page + 1); }}>Next</button></nav>}</>}</div>
    <aside className="vd-help"><div className="vd-help-symbol" aria-hidden="true">✧</div><span className="vd-eyebrow">A LITTLE HELP, A LOT OF MAGIC</span><h2>Big dreams.<br /><em>Beautifully planned.</em></h2><p>Tell us what your day looks like. Let’s find the people to make it happen.</p><button type="button" onClick={() => setIsQuoteOpen(true)}>Get a free quote <span aria-hidden="true">↗</span></button><div className="vd-help-divider" /><ol className="vd-help-steps"><li><span>01</span> Discover your favourites</li><li><span>02</span> Explore their work</li><li><span>03</span> Start a conversation</li></ol><small>Made for your kind of celebration.</small></aside></div>
  </main><Footer /><QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} /></div>;
}
