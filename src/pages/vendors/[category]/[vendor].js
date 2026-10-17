import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import { VendorActions, VendorImage, VendorRating, VendorRequestState } from "@/components/vendor/VendorDirectory";
import useMarketplaceVendors from "@/components/vendor/useMarketplaceVendors";
import VendorBusinessDetails, { vendorLocation } from "@/components/vendor/VendorBusinessDetails";
import { formatVendorPrice, getVendorCategory } from "@/data/vendorDirectory";

export default function VendorProfilePage(props) {
  return <BusinessProfile key={`${props.category.slug}:${props.vendorSlug}`} {...props} />;
}

function BusinessProfile({ category, vendorSlug }) {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const { vendor, loading, error, notFound, retry } = useMarketplaceVendors(category, { slug: vendorSlug });
  const location = vendor ? vendorLocation(vendor) : "";
  return <div className="vendor-directory">
    <Head><title>{vendor ? `${vendor.name} | Epic Wedz` : "Vendor Business Profile | Epic Wedz"}</title><meta name="description" content={vendor ? `Explore ${vendor.name}. View services, business information and pricing.` : "Explore wedding vendor business profiles on Epic Wedz."} />{notFound && <meta name="robots" content="noindex" />}</Head>
    <Header />
    <main className="vd-main">
      <nav className="vd-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href={`/vendors/${category.slug}`}>{category.title}</Link><span>›</span><span>{vendor?.name || "Business profile"}</span></nav>
      {loading || error ? <VendorRequestState loading={loading} error={error} notFound={notFound} retry={retry} /> : vendor && <>
        <div className="vd-profile-hero"><div className="vd-profile-cover"><VendorImage vendor={vendor} category={category} fill priority sizes="(min-width: 900px) 55vw, 100vw" /></div>
          <div className="vd-profile-heading"><span className="vd-eyebrow">{vendor.category}</span><h1>{vendor.name}</h1><VendorRating vendor={vendor} /><p className="vd-location">{location || "Location not provided"}</p>
            <div className="vd-tags">{vendor.verified && <span className="vd-verified">✓ KYC verified</span>}{vendor.profileStatus && <span>Profile: {vendor.profileStatus}</span>}{vendor.years !== null && <span>{vendor.years} years of experience</span>}</div>
            <p className="vd-price">{formatVendorPrice(vendor.price)}{vendor.price !== null && <span> onwards</span>}</p><VendorActions vendor={vendor} showProfile={false} onEnquire={() => setIsQuoteOpen(true)} />
          </div></div>
        <nav className="vd-profile-tabs" aria-label="Business profile sections"><a href="#about">Overview</a><a href="#services">Services</a><a href="#pricing">Pricing</a><a href="#business">Business details</a></nav>
        <div className="vd-layout"><div className="vd-profile-sections">
          <section id="about" className="vd-section"><h2>About {vendor.name}</h2><p className="whitespace-pre-line">{vendor.about || "This business has not added a description yet."}</p></section>
          <section id="services" className="vd-section"><h2>Services offered</h2>{vendor.services.length ? <div className="vd-service-grid">{vendor.services.map((service) => <div key={service}><span aria-hidden="true">✓</span> {service}</div>)}</div> : <p>Contact this business for service information.</p>}</section>
          <section id="pricing" className="vd-section"><h2>Pricing & packages</h2><div className="vd-package"><div><h3>{vendor.category}</h3><p>{vendor.price !== null ? "Starting price" : "Contact for a custom quote"}</p></div><strong>{formatVendorPrice(vendor.price)}</strong></div><p>Final pricing depends on your event requirements. Contact the vendor to discuss your celebration.</p><button type="button" className="vd-profile-link" onClick={() => setIsQuoteOpen(true)}>Request a quote</button></section>
          <section id="business" className="vd-section"><h2>Business information</h2><VendorBusinessDetails vendor={vendor} /></section>
        </div><aside className="vd-help"><span className="vd-eyebrow">PLAN YOUR CELEBRATION</span><h2>Have a wedding in mind?</h2><p>Share your date, location, and requirements to start exploring your options.</p><button type="button" onClick={() => setIsQuoteOpen(true)}>Get a free quote →</button><Link href={`/vendors/${category.slug}`}>← Browse more vendors</Link></aside></div>
      </>}
    </main><Footer /><QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
  </div>;
}

export function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export function getStaticProps({ params }) {
  const category = getVendorCategory(params.category);
  if (!category || typeof params.vendor !== "string" || params.vendor.length > 200) return { notFound: true };
  return { props: { category, vendorSlug: params.vendor } };
}
