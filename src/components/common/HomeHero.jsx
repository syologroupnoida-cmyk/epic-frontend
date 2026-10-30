import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/router';
import CitySearch from './CitySearch';
import useDismissibleDropdown from '@/util/useDismissibleDropdown';
import { vendorSearchHref } from '@/util/publicCatalog.mjs';
import venues from '@/images/category-venues.png';
import planners from '@/images/hero-mandap.png';
import makeup from '@/images/category-makeup.png';
import photography from '@/images/category-photography.png';
import catering from '@/images/category-catering.png';
import decor from '@/images/category-decor.png';
import { stories } from '@/data/homeData';
import styles from './HomeHero.module.css';

function Icon({ name, ...props }) {
  const paths = {
    venue: <><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9M16 5V3h3v5" /></>,
    rings: <><circle cx="9" cy="14" r="6" /><circle cx="15" cy="14" r="6" /><path d="m10 4 2-2 2 2-2 3-2-3Z" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2" /></>,
    photo: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="8" r="2" /><path d="m3 17 5-5 4 4 3-3 6 5" /></>,
    planner: <><path d="M9 4H5v18h14V4h-4M9 2h6v5H9zM8 12l1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3" /></>,
    makeup: <><path d="M5 21c1-4 1-6 1-10a6 6 0 0 1 12 0c0 4 0 6 1 10M8 10c1 0 3-1 4-3 1 2 3 3 4 3v4a4 4 0 0 1-8 0v-4Zm1 8-2 4m8-4 2 4" /><path d="M9 12h.01m6 0h.01m-5 3c1 1 3 1 4 0" /></>,
    camera: <><path d="M3 6h5l2-3h4l2 3h5v15H3V6Z" /><circle cx="12" cy="13" r="5" /></>,
    catering: <><path d="M2 19h20M4 16a8 8 0 0 1 16 0H4ZM12 4V2m-2 0h4M2 22h20" /></>,
    flower: <><path d="M12 8c-6-9-9-1-4 3-10-1-7 7 0 5-4 8 5 10 6 2 6 6 11-1 4-5 9-4 2-10-3-5 2-9-7-9-6-2" /><circle cx="12" cy="13" r="3" /></>,
    star: <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z" />,
    shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" /><path d="m8 12 3 3 5-5" /></>,
    verified: <><circle cx="12" cy="10" r="7" /><path d="m9 10 2 2 4-4M7 16l-1 6 6-3 6 3-1-6" /></>,
    connect: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" /></>,
    support: <><path d="M3 13v-2a9 9 0 0 1 18 0v7a4 4 0 0 1-4 4h-3" /><rect x="2" y="11" width="4" height="8" rx="2" /><rect x="18" y="11" width="4" height="8" rx="2" /><path d="M11 22h3" /></>,
    arrow: <path d="M3 12h18m-6-6 6 6-6 6" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.rings}</svg>;
}

function Mandala({ className }) {
  return <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth=".8"><circle cx="100" cy="100" r="28" /><circle cx="100" cy="100" r="47" />{Array.from({ length: 12 }, (_, index) => <g key={index} transform={`rotate(${index * 30} 100 100)`}><path d="M100 100C65 75 70 40 100 7c30 33 35 68 0 93ZM100 100C80 70 85 45 100 25c15 20 20 45 0 75Z" /><path d="M100 100 100 9" /></g>)}</svg>;
}

const backgrounds = [
  { src: '/images/content/home-wedding-hero-v2.webp', alt: 'An Indian wedding couple beneath a glowing floral mandap' },
  { src: '/images/content/home-wedding-garden-v1.webp', alt: 'A bride and groom celebrating a palace garden wedding at sunset' },
  { src: '/images/content/home-wedding-palace-v1.webp', alt: 'An Indian couple at a candlelit palace wedding reception' },
];
const cards = [
  { title: 'Wedding Venues', text: 'Banquets, Resorts, Farms', image: venues, icon: 'venue', href: '/venues' },
  { title: 'Wedding Planners', text: 'Plan with Experts', image: planners, icon: 'planner', href: '/vendors?search=Wedding%20Planners' },
  { title: 'Bridal Makeup', text: 'Look Your Best', image: makeup, icon: 'makeup', href: '/vendors?search=Bridal%20Makeup' },
  { title: 'Photography', text: 'Capture Every Moment', image: photography, icon: 'camera', href: '/vendors?search=Photography' },
  { title: 'Wedding Catering', text: 'Delicious & Memorable', image: catering, icon: 'catering', href: '/vendors?search=Catering' },
  { title: 'Decorators', text: 'Beautiful Setups', image: decor, icon: 'flower', href: '/vendors?search=Decorators' },
];

function CategorySelect({ value, options, loading, error, onSelect, onRetry, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useDismissibleDropdown(open, setOpen);
  const id = useId();
  return <div className={styles.select} ref={ref} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}>
    <button type="button" className={styles.selectButton} aria-label="Select wedding category" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((current) => !current)}><Icon name="planner" /><span>{value || (loading ? 'Loading categories...' : placeholder)}</span><span className={styles.chevron} /></button>
    {open && <div className={styles.options} id={id} role="listbox" aria-label="Wedding categories">
      {loading ? <p role="status">Loading categories...</p> : error ? <p role="alert">{error} <button type="button" onClick={onRetry}>Try again</button></p> : options.length ? options.map((option) => <button type="button" role="option" aria-selected={value === option.name} key={option.id} onClick={() => { onSelect(option.name); setOpen(false); }}>{option.name}</button>) : <p>No categories available yet.</p>}
    </div>}
  </div>;
}

export default function HomeHero({ categories, loading, error, onRetry, onPlan }) {
  const router = useRouter();
  const [service, setService] = useState('');
  const [city, setCity] = useState('Select city');
  const [cityRecord, setCityRecord] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [readySlides, setReadySlides] = useState([]);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updatePreference() { setReducedMotion(preference.matches); }
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);
  useEffect(() => {
    if (paused || reducedMotion || readySlides.length < 2) return;
    const available = [...readySlides].sort((a, b) => a - b);
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveSlide((current) => available[(available.indexOf(current) + 1) % available.length]);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, readySlides]);
  const options = categories;
  const selected = options.find((category) => category.name === service) || options[0];
  const selectionLabel = selected?.name || (loading ? 'Loading categories...' : 'Select wedding category');
  function search(event) {
    event.preventDefault();
    router.push(vendorSearchHref(selected, cityRecord || city));
  }
  return <section className={styles.hero} aria-labelledby="home-hero-title">
    <div className={styles.stage}>
      <div className={styles.backdrop}>{backgrounds.map((background, index) => <div key={background.src} className={`${styles.backgroundSlide} ${activeSlide === index ? styles.visibleSlide : ''}`} aria-hidden={activeSlide !== index}><Image src={background.src} alt={background.alt} fill preload={index === 0} loading={index === 0 ? undefined : 'eager'} sizes="100vw" className={styles.background} onLoad={() => setReadySlides((current) => current.includes(index) ? current : [...current, index])} /></div>)}<div className={styles.shade} /></div>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>PLAN <span>◆</span> BOOK <span>◆</span> CELEBRATE <i /></p>
          <h1 id="home-hero-title">Your Dream<br /><span className={styles.headingEnd}><em>Wedding</em> Starts Here</span></h1>
          <p className={styles.description}>Discover the best venues, trusted vendors and wedding planners to bring your special day to life.</p>
          <div className={styles.stats}><div><Icon name="people" /><p><strong>10K+</strong><span>Trusted Vendors</span></p></div><div><Icon name="star" /><p><strong>5K+</strong><span>Real Weddings</span></p></div><div><Icon name="shield" /><p><strong>100%</strong><span>Verified Vendors</span></p></div></div>
          <div className={styles.actions}><button type="button" className={styles.planButton} onClick={onPlan}>Start Planning Your Wedding <Icon name="arrow" /></button><Link href="/real-weddings" className={styles.storyLink}><span className={styles.play}>▶</span>Watch Our Story</Link></div>
        </div>
        <div className={styles.searchWrap}>
          <form className={styles.searchPanel} onSubmit={search} aria-labelledby="home-wedding-search-title">
            <div className={styles.formHeading}>
              <h2 id="home-wedding-search-title">Find Your Perfect <span>Wedding Team</span></h2>
              <p>Search the best venues, vendors and planners in one place.</p>
            </div>
            <div id="hero-search-fields" className={styles.fields}>
              <CategorySelect value={selectionLabel} options={options} loading={loading} error={error} onSelect={setService} onRetry={onRetry} placeholder="Select wedding category" />
              <CitySearch value={city} onSelect={(name, record) => { setCity(name); setCityRecord(record); }} buttonClassName={styles.selectButton} panelClassName="w-full" variant="hero" />
              <button type="submit" className={styles.searchButton}>Search <Icon name="arrow" /></button>
            </div>
            <div className={styles.slideControls} role="group" aria-label="Wedding banner backgrounds">
              {backgrounds.map((background, index) => <button key={background.src} type="button" className={`${styles.slideDot} ${activeSlide === index ? styles.selectedDot : ''}`} aria-label={`Show wedding background ${index + 1}`} aria-pressed={activeSlide === index} disabled={!readySlides.includes(index)} onClick={() => setActiveSlide(index)} />)}
              {!reducedMotion && <button type="button" className={styles.pauseSlides} aria-label={paused ? 'Play banner slideshow' : 'Pause banner slideshow'} aria-pressed={paused} onClick={() => setPaused((current) => !current)}><svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{paused ? <path d="m5 3 8 5-8 5V3Z" /> : <path d="M4 3h3v10H4V3Zm5 0h3v10H9V3Z" />}</svg></button>}
            </div>
          </form>
        </div>
      </div>
      <p className={styles.handwriting}>Beautiful<br />Weddings<br />Happier<br />Stories<span>♡</span></p>
      <svg className={styles.wave} viewBox="0 0 1672 150" preserveAspectRatio="none" aria-hidden="true"><path d="M-5 10C160 170 1512 170 1677 10V155H-5Z" fill="#faf5ee" stroke="#e7be73" strokeWidth="8" /></svg>
    </div>
    <div className={styles.lower}>
      <Mandala className={styles.leftMandala} /><Mandala className={styles.rightMandala} />
      <div className={styles.categories}>{cards.map((card) => <Link href={card.href} key={card.title} className={styles.category}><div className={styles.categoryImage}><Image src={card.image} alt="" fill sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 16vw" /></div><div className={styles.categoryBody}><span className={styles.categoryIcon}><Icon name={card.icon} /></span><div><h3>{card.title}</h3><p>{card.text}</p></div></div></Link>)}</div>
      <div className={styles.trust}><div><Icon name="verified" /><p>Curated &amp; Verified<br />Wedding Vendors</p></div><div><Icon name="connect" /><p>Compare &amp; Connect<br />with Ease</p></div><div><Icon name="support" /><p>End-to-End Wedding<br />Support</p></div><div><Icon name="shield" /><p>Trusted by Thousands<br />of Happy Couples</p></div><div className={styles.weddings}><span className={styles.avatars}>{[stories[0], stories[1], stories[2], stories[0]].map((story, index) => <Image key={index} src={story.image} alt="" width={40} height={40} />)}</span><p><strong>5,000+</strong><br />Real Weddings</p></div></div>
    </div>
  </section>;
}
