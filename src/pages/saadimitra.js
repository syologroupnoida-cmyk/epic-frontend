import Image from "next/image";
import Link from "next/link";
import styles from "@/components/templates/SaadiMitra.module.css";
import { useState } from "react";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import QuoteModal from "@/components/common/QuoteModal";
import {
  destinationOptions,
} from "@/data/homeData";

const heroFeatures = [
  { title: "Tailored", text: "Vendor Picks", icon: "search" },
  { title: "Best", text: "Deals", icon: "deal" },
  { title: "Expert Help &", text: "Support", icon: "support" },
];

const packages = [
  {
    title: "SaadiMitra Venue Assist",
    price: "Free",
    text: "Get venue and vendor suggestions matched to your city, budget, dates, and guest count.",
    features: ["Tailored vendor picks", "Budget range guidance", "Callback from planning team"],
  },
  {
    title: "SaadiMitra Complete",
    price: "Rs. 999",
    text: "For families who want deeper support with shortlists, vendor calls, and package comparison.",
    features: ["Multiple category shortlist", "Best deal assistance", "Priority planning support"],
    featured: true,
  },
  {
    title: "Destination Wedding Help",
    price: "Custom",
    text: "For India and abroad celebrations with venue, travel, decor, and hospitality planning help.",
    features: ["Destination shortlist", "Guest stay guidance", "Premium vendor matching"],
  },
];

const helpCards = [
  {
    title: "Tell us your requirements",
    text: "Share your date, city, budget, guest count, and the kind of wedding vendors you are looking for.",
  },
  {
    title: "Get curated options",
    text: "SaadiMitra reviews your preferences and suggests suitable venues, vendors, and package paths.",
  },
  {
    title: "Connect and book",
    text: "Move ahead with quote calls, availability checks, and clearer vendor conversations.",
  },
];

const serviceChips = [
  "Venues",
  "Vendors",
  "Decor",
  "Photography",
  "Makeup",
  "Catering",
  "Destination Wedding",
  "Planning",
];

function FeatureIcon({ type, className }) {
  const paths = {
    search: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 9-5" /><circle cx="17" cy="16" r="4" /><path d="m20 19 3 3" /></>,
    deal: <><path d="M20 13 11 22 2 13V3h10l8 8a1.5 1.5 0 0 1 0 2Z" /><circle cx="7" cy="8" r="1.5" /><path d="m11 12 5 5m0-5h.01m-5 5h.01" /></>,
    support: <><path d="M3 13v-2a9 9 0 0 1 18 0v7a4 4 0 0 1-4 4h-3" /><rect x="2" y="11" width="4" height="8" rx="2" /><rect x="18" y="11" width="4" height="8" rx="2" /><path d="M11 22h3" /></>,
    venue: <><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" /></>,
    sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] || paths.search}</svg>;
}

export default function SaadiMitraPage() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  return <div className={styles.page}>
    <Header />
    <main>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">SaadiMitra</span></nav>
        <section className={styles.hero} aria-labelledby="saadimitra-title">
          <div className={styles.heroCopy}>
            <div className={styles.brand}>
              <p className={styles.eyebrow}>Epic Wedz</p>
              <h1 id="saadimitra-title">Saadi</h1>
              <p className={styles.brandSubtitle}>Mitra Virtual Planning Service</p>
            </div>
            <h2 className={styles.heroHeading}>The smart way to find venues &amp; vendors for your wedding</h2>
            <div className={styles.heroActions}><a href="#saadimitra-packages" className={styles.primary}>Explore packages <FeatureIcon type="arrow" /></a><button type="button" className={styles.secondary} onClick={() => setIsQuoteOpen(true)}>Talk to a planner</button></div>
            <div className={styles.benefits}>{heroFeatures.map((feature) => <div key={feature.icon}><FeatureIcon type={feature.icon} /><p>{feature.title}<br />{feature.text}</p></div>)}</div>
          </div>
          <div className={styles.heroVisual}>
            <Image src="/images/content/home-wedding-garden-v1.webp" alt="An Indian wedding couple celebrating in a palace garden" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className={styles.heroImage} />
            <div className={styles.photoCaption}><span className={styles.captionIcon}><FeatureIcon type="sparkles" /></span><div><strong>Your wedding, thoughtfully planned.</strong><span>Venues, vendors &amp; a little expert guidance.</span></div></div>
          </div>
        </section>
        <section id="saadimitra-packages" className={styles.packageSection} aria-labelledby="saadimitra-packages-title">
          <header className={styles.sectionHeader}><p className={styles.eyebrow}>A little help, your way</p><h2 id="saadimitra-packages-title">Select Package</h2><p>SaadiMitra can help out!</p></header>
          <div className={styles.packages}>{packages.map((pkg, index) => <article key={pkg.title} className={[styles.packageCard, pkg.featured && styles.featured].filter(Boolean).join(' ')}>
            <div className={styles.packageTop}><span className={styles.packageIcon}><FeatureIcon type={['venue', 'sparkles', 'globe'][index]} /></span>{pkg.featured && <span className={styles.popular}>Popular</span>}</div>
            <h3>{pkg.title}</h3><p className={styles.price}>{pkg.price}</p><p className={styles.packageDescription}>{pkg.text}</p>
            <ul className={styles.packageFeatures}>{pkg.features.map((feature) => <li key={feature}><FeatureIcon type="check" /><span>{feature}</span></li>)}</ul>
            <button type="button" aria-label={'Select ' + pkg.title} onClick={() => setIsQuoteOpen(true)} className={pkg.featured ? styles.primary : styles.outlineButton}>Select Package <FeatureIcon type="arrow" /></button>
          </article>)}</div>
        </section>
        <section className={styles.processSection} aria-labelledby="saadimitra-process-title">
          <header className={styles.sectionHeader}><p className={styles.eyebrow}>Simple steps. Thoughtful support.</p><h2 id="saadimitra-process-title">How SaadiMitra works</h2></header>
          <div className={styles.steps}>{helpCards.map((card, index) => <article key={card.title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
        </section>
        <section className={styles.coverage} aria-labelledby="saadimitra-coverage-title">
          <div className={styles.coverageImage}><Image src={destinationOptions[1].image} alt="An elegant destination wedding setting" fill sizes="(min-width: 1024px) 40vw, 100vw" className={styles.heroImage} /></div>
          <div className={styles.coverageCopy}><p className={styles.eyebrow}>What we cover</p><h2 id="saadimitra-coverage-title">Find the right wedding team faster</h2><p>SaadiMitra helps you shortlist options across venues, vendors, destination weddings, and planning support so you can start conversations with more clarity.</p><div className={styles.serviceChips}>{serviceChips.map((chip) => <span key={chip}>{chip}</span>)}</div><button type="button" className={styles.textButton} onClick={() => setIsQuoteOpen(true)}>Get planning support <FeatureIcon type="arrow" /></button></div>
        </section>
      </div>
    </main>
    <Footer />
    <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
  </div>;
}
