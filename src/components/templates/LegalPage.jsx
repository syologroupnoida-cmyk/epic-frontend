import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import CompactPageBanner from '@/components/common/CompactPageBanner';
import styles from '@/components/common/ContentPages.module.css';
import { legalContent } from '@/data/legalContent.mjs';

export default function LegalPage({ pageKey }) {
  const page = legalContent[pageKey];
  const articleRef = useRef(null);
  const [activeSection, setActiveSection] = useState(page.sections[0].id);
  function navigateSection(event, id) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const article = articleRef.current;
    const target = article?.querySelector(`#${id}`);
    if (!article || !target) return;
    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.history.replaceState(window.history.state, '', `#${id}`);
    setActiveSection(id);
  }
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    let frame;
    function updateSection() {
      frame = undefined;
      const visible = [...article.querySelectorAll('section')].reverse().find((section) => section.getBoundingClientRect().top <= 32);
      setActiveSection(visible?.id || page.sections[0].id);
    }
    function onScroll() {
      if (frame === undefined) frame = window.requestAnimationFrame(updateSection);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [page.sections]);
  return <div className="min-h-screen bg-[#fff9f5] text-stone-900">
    <Head><title>{page.title} | Epic Wedz</title><meta name="description" content={page.description} /><link rel="canonical" href={page.path} /></Head>
    <Header /><main><CompactPageBanner title={page.title} image={page.image} />
      <div className={`${styles.legalLayout} ${pageKey === 'privacy' ? styles.privacyLayout : ''}`}>
        <aside className={styles.contents}><details open><summary>On this page</summary><nav aria-label={`${page.title} contents`}>{page.sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} onClick={(event) => navigateSection(event, section.id)}>{section.title}</a>)}</nav></details></aside>
        <article ref={articleRef} className={styles.legalArticle} aria-label={page.title}>{page.sections.map((section) => <section id={section.id} key={section.id} className={styles.legalSection}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</article>
      </div>
      <nav aria-label="Related information" className={`${styles.pageBody} ${styles.relatedLinks}`}><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/contact-us">Contact Us</Link></nav>
    </main><Footer />
  </div>;
}
