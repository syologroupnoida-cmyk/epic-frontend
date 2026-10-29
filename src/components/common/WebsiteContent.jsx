import { useState } from 'react';
import QuoteModal from './QuoteModal';
import Head from 'next/head';
import Link from 'next/link';
import { websiteContent, websiteActions } from '@/data/websiteContent.mjs';
import styles from './ContentPages.module.css';

export function WebsiteSeo({ pageKey, title, description, path }) {
  const page = websiteContent[pageKey];
  return <Head><title>{title || page.seoTitle}</title><meta name="description" content={description || page.description} /><link rel="canonical" href={path || page.path} /></Head>;
}

export function WebsiteActions({ pageKey, dark = false }) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  return <><div id={pageKey === 'partner' ? 'join' : undefined} className={`mt-7 flex flex-wrap ${pageKey === 'home' && dark ? 'justify-start' : 'justify-center'} gap-3`}>{websiteActions(pageKey).map((action, index) => {
    const className = pageKey === 'home' ? `inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-normal ${dark ? 'border-white/70 text-white hover:border-white' : 'border-[#b61f4b] text-[#b61f4b] hover:border-[#981a3f]'}` : index === 0 ? 'inline-flex items-center justify-center rounded-full border border-[#b61f4b] bg-[#b61f4b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#981a3f]' : `inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold ${dark ? 'border-white/70 text-white hover:bg-white/10' : 'border-[#b61f4b] text-[#b61f4b] hover:bg-rose-50'}`;
    const opensQuote = /quote|consultation|^start planning|^plan your luxury/i.test(action.label);
    return opensQuote ? <button type="button" key={action.label} className={className} onClick={() => setQuoteOpen(true)}>{action.label}</button> : <Link key={action.label} href={action.href} className={className}>{action.label}</Link>;
  })}</div><QuoteModal isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} /></>;
}

export function WebsiteSections({ pageKey, titles, omit = [], className = '' }) {
  const sections = websiteContent[pageKey].sections.filter((section) => (!titles || titles.includes(section.title)) && !omit.includes(section.title));
  if (!sections.length) return null;
  return <div className={`${styles.sectionGrid} ${className}`}>{sections.map((section, index) => <section key={section.title} id={pageKey === 'partner' ? ({ 'Why Join?': 'benefits', 'How It Works': 'workflow' })[section.title] : undefined} className={styles.sectionCard}>
    <div className={`${styles.sectionTitle} ${pageKey === 'luxury' ? styles.leftTitle : ''}`}><span aria-hidden="true" className={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2></div>
    {section.paragraphs.map((paragraph) => paragraph.includes(';') ? <ul key={paragraph}>{paragraph.split(';').map((item) => <li key={item}><span aria-hidden="true" className={styles.bullet}>&bull;</span><span>{item.trim()}</span></li>)}</ul> : <p key={paragraph}>{paragraph}</p>)}
  </section>)}</div>;
}
