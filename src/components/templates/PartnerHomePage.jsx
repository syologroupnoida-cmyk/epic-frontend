import HeaderAccountMenu from '@/components/common/HeaderAccountMenu';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { WebsiteSeo } from '@/components/common/WebsiteContent';
import PartnerExpertCalendar from './PartnerExpertCalendar';
import venues from '@/images/category-venues.png';
import planners from '@/images/hero-mandap.png';
import makeup from '@/images/category-makeup.png';
import photography from '@/images/category-photography.png';
import catering from '@/images/category-catering.png';
import decorators from '@/images/category-decor.png';
import styles from './PartnerHomePage.module.css';

function Icon({ name, ...props }) {
  const paths = {
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    building: <><path d="M4 22V6h6V2h5v6h5v14M2 22h20M8 10h.01M8 14h.01M8 18h.01M14 12h.01M14 16h.01" /></>,
    chart: <><path d="M3 21h4v-7H3v7Zm7 0h4V9h-4v12Zm7 0h4V4h-4v17ZM4 9l6-5 5 2 6-5m-5 0h5v5" /></>,
    people: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2" /></>,
    shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" /><path d="m8 12 3 3 5-5" /></>,
    megaphone: <><path d="m3 9 13-5v16L3 15V9Zm3 7 2 6h4l-2-5M16 9h3v6h-3m4-11 2-2m-1 8h2m-3 10 2 2" /></>,
    connect: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" /></>,
    venue: <><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9" /></>,
    planner: <><path d="M9 4H5v18h14V4h-4M9 2h6v5H9zM8 12l1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3" /></>,
    makeup: <><path d="M5 21c1-4 1-6 1-10a6 6 0 0 1 12 0c0 4 0 6 1 10M8 10c1 0 3-1 4-3 1 2 3 3 4 3v4a4 4 0 0 1-8 0v-4ZM9 18l-2 4m8-4 2 4" /></>,
    camera: <><path d="M3 6h5l2-3h4l2 3h5v15H3V6Z" /><circle cx="12" cy="13" r="5" /></>,
    food: <><path d="M2 19h20M4 16a8 8 0 0 1 16 0H4ZM12 4V2m-2 0h4M2 22h20" /></>,
    flower: <><path d="M12 8c-6-9-9-1-4 3-10-1-7 7 0 5-4 8 5 10 6 2 6 6 11-1 4-5 9-4 2-10-3-5 2-9-7-9-6-2" /><circle cx="12" cy="13" r="3" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    phone: <path d="m8 3 3 5-2 2a15 15 0 0 0 5 5l2-2 5 3-1 4C11 22 2 13 4 4Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    register: <><path d="M14 2H4v20h16V8l-6-6Zm0 0v6h6M8 12h8M8 16h5" /><circle cx="18" cy="19" r="3" /></>,
    shop: <><path d="M3 3h18l1 5a4 4 0 0 1-5 3 4 4 0 0 1-5 0 4 4 0 0 1-5 0 4 4 0 0 1-5-3l1-5ZM4 12v10h16V12M9 22v-7h6v7M3 6h18" /></>,
    verified: <><path d="m12 2 3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1 3-2Z" /><path d="m8 12 3 3 5-6" /></>,
    heart: <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-2 12 12 21 12 21S26 12 20 5Z" />,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.people}</svg>;
}

const categories = [
  { name: 'Wedding Venues', icon: 'venue', image: venues, match: /venue|property|banquet/i },
  { name: 'Wedding Planners', icon: 'planner', image: planners, match: /planner|planning/i },
  { name: 'Bridal Makeup', icon: 'makeup', image: makeup, match: /makeup|beauty/i },
  { name: 'Photographers', icon: 'camera', image: photography, match: /photo|video/i },
  { name: 'Catering', icon: 'food', image: catering, match: /cater|food/i },
  { name: 'Decorators', icon: 'flower', image: decorators, match: /decor|flower/i },
];
const benefits = [
  { title: 'Reach More Couples', text: 'Get discovered by thousands of couples every month.', icon: 'people' },
  { title: 'Quality Enquiries', text: 'Receive genuine and relevant leads.', icon: 'chart' },
  { title: 'Build Your Brand', text: 'Showcase your work, packages and unique style.', icon: 'megaphone' },
  { title: 'Be Part of a Trusted Platform', text: 'Join a verified community of wedding professionals.', icon: 'connect' },
];
const steps = [
  { title: 'Register', text: 'Create your partner account in minutes.', icon: 'register' },
  { title: 'Create Your Profile', text: 'Add details, photos, packages and your work.', icon: 'shop' },
  { title: 'Get Verified', text: 'Our team verifies your profile for authenticity.', icon: 'verified' },
  { title: 'Start Receiving Enquiries', text: 'Get connected with interested couples and grow your business.', icon: 'people' },
];
const partnerStories = [
  { name: 'Neha Verma', role: 'Wedding Planner, Jaipur', quote: 'Epic has helped us reach genuine clients and grow our wedding planning business across multiple cities. The platform is easy to use and the support team is always helpful.' },
  { name: 'Ananya Sharma', role: 'Senior Wedding Agent', quote: 'The agent flow makes it easy to move from inquiry to vendor shortlist without losing client context.' },
  { name: 'Rohit Mehra', role: 'Destination Specialist', quote: 'I can compare venue ideas, coordinate calls, and keep follow-ups clear for every family.' },
];
const nav = [{ label: 'Home', href: '/partner' }, { label: 'Be a Partner', href: '#overview' }, { label: 'How It Works', href: '#workflow' }, { label: 'Success Stories', href: '#success-stories' }, { label: 'Resources', href: '/blog' }, { label: 'Support', href: '/contact-us' }];

function SectionHeading({ eyebrow, title, id }) {
  return <header className={styles.sectionHeading}><p><span />{eyebrow}<span /></p><h2 id={id}>{title}</h2></header>;
}

export default function PartnerHomePage() {
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  useEffect(() => {
    const header = headerRef.current;
    function updateHeaderHeight() {
      if (header && pageRef.current) pageRef.current.style.setProperty('--partner-header-height', `${header.offsetHeight}px`);
    }
    updateHeaderHeight();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(header);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);
  const [storyIndex, setStoryIndex] = useState(0);
  const story = partnerStories[storyIndex];
  return <div ref={pageRef} className={styles.page}>
    <WebsiteSeo pageKey="partner" />
    <header ref={headerRef} className={styles.header}><div className={styles.navInner}>
      <Link href="/" className={styles.logo}><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={120} height={42} preload /></Link>
      <nav aria-label="Partner navigation" className={styles.nav}>{nav.map((item) => <Link key={item.href} href={item.href} className={item.href === '/partner' ? styles.activeNav : undefined} aria-current={item.href === '/partner' ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <div className={styles.headerActions}><HeaderAccountMenu variant="partner" guestFallback={<><Link className={styles.login} href="/partner/login">Login</Link><Link className={styles.primary} href="/partner/sign-up">Register as a Partner <Icon name="arrow" /></Link></>} /></div>
    </div></header>
    <main>
      <section id="overview" className={styles.hero} aria-labelledby="partner-hero-title">
        <Image src="/images/content/partner-wedding-hero-v3.webp" alt="An Indian bride planning her wedding using a tablet" fill preload sizes="100vw" className={styles.heroPhoto} /><div className={styles.heroVeil} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>For wedding vendors</p><h1 id="partner-hero-title">Grow Your<br />Wedding Business<br /><em>with Epic</em></h1>
            <p className={styles.heroDescription}>Join India’s trusted wedding planning platform and connect with thousands of couples looking for genuine and verified vendors.</p>
            <div className={styles.heroBenefits}><div><Icon name="chart" /><span>More<br />Visibility</span></div><div><Icon name="people" /><span>Quality<br />Leads</span></div><div><Icon name="shield" /><span>Trusted<br />Platform</span></div></div>
            <div className={styles.heroActions}><Link className={styles.primary} href="/partner/sign-up">Register as a Partner <Icon name="arrow" /></Link><a className={styles.storyButton} href="#success-stories"><span className={styles.play}>▶</span>See Success Stories</a></div>
          </div>
          <div className={styles.joinBadge}><span className={styles.avatars}>{[makeup, photography, '/images/content/partner-story-portrait-v1.webp'].map((image, index) => <Image key={index} src={image} alt="" width={32} height={32} />)}</span><div><strong>Join 10,000+</strong><span>Wedding Vendors Across India</span></div></div>
          <PartnerExpertCalendar />
        </div>
      </section>
      <section id="benefits" className={styles.benefitSection} aria-labelledby="partner-benefits-title"><div className={styles.container}>
        <SectionHeading eyebrow="Why join Epic as a partner" title="Everything You Need to Grow Your Business" id="partner-benefits-title" />
        <div className={styles.benefitGrid}>{benefits.map((benefit) => <article key={benefit.title}><span className={styles.benefitIcon}><Icon name={benefit.icon} /></span><div><h3>{benefit.title}</h3><p>{benefit.text}</p></div></article>)}</div>
      </div></section>
      <section id="categories" className={styles.categorySection} aria-labelledby="partner-categories-title"><div className={styles.container}>
        <SectionHeading eyebrow="Partner categories" title="Join as a Vendor in Your Category" id="partner-categories-title" />
        <div className={styles.categoryGrid}>{categories.map((category) => <Link key={category.name} href="/partner/sign-up" className={styles.categoryCard} aria-label={'Register as ' + category.name}><div className={styles.categoryImage}><Image src={category.image} alt="" fill sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 16vw" /></div><div className={styles.categoryLabel}><span><Icon name={category.icon} /></span><strong>{category.name}</strong><i><Icon name="chevron" /></i></div></Link>)}</div>
      </div></section>
      <section id="workflow" className={styles.workflowSection} aria-labelledby="partner-workflow-title"><div className={styles.container}>
        <SectionHeading eyebrow="How it works" title="Get Started in Just 4 Simple Steps" id="partner-workflow-title" />
        <div className={styles.steps}>{steps.map((step, index) => <article key={step.title}><span className={styles.stepNumber}>{index + 1}</span><span className={styles.stepIcon}><Icon name={step.icon} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div>{index < steps.length - 1 && <Icon name="arrow" className={styles.stepArrow} />}</article>)}</div>
      </div></section>
      <section id="success-stories" className={styles.storiesSection} aria-labelledby="partner-stories-title"><div className={styles.storiesInner}>
        <div className={styles.testimonial}><Image src="/images/content/partner-story-portrait-v1.webp" alt="Wedding planning professional" width={126} height={126} className={styles.portrait} /><div><p className={styles.storyEyebrow}>Success stories</p><h2 id="partner-stories-title">Our Partners Grow with Us</h2><blockquote>{story.quote}</blockquote><p className={styles.author}>— {story.name}, {story.role}</p><div className={styles.storyControls} role="group" aria-label="Partner success stories"><button type="button" aria-label="Previous success story" onClick={() => setStoryIndex((current) => (current + partnerStories.length - 1) % partnerStories.length)}><Icon name="chevron" /></button><span>{partnerStories.map((item, index) => <button key={item.name} type="button" className={index === storyIndex ? styles.selectedStory : undefined} aria-label={'Show success story ' + (index + 1)} aria-pressed={index === storyIndex} onClick={() => setStoryIndex(index)} />)}</span><button type="button" aria-label="Next success story" onClick={() => setStoryIndex((current) => (current + 1) % partnerStories.length)}><Icon name="chevron" /></button></div></div></div>
        <div className={styles.metrics}><div><Icon name="people" /><strong>10K+</strong><span>Verified Vendors</span></div><div><Icon name="heart" /><strong>5K+</strong><span>Real Weddings</span></div><div><Icon name="pin" /><strong>300+</strong><span>Cities Across India</span></div></div>
        <div className={styles.community}><h3>Join India’s Growing<br />Wedding Vendor Community</h3><Link href="/partner/sign-up">Register Now <Icon name="arrow" /></Link></div>
      </div></section>
    </main>
    <footer className={styles.footer}><span>© 2026 Epic Wedz. All Rights Reserved.</span><div><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/contact-us">Support</Link></div></footer>
  </div>;
}
