import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { listingName, listingPrice, publicMediaUrl, serviceInfo } from '@/util/marketplaceListings.mjs';
import styles from './ServiceListingDetail.module.css';
import VendorEnquiryModal from '@/components/vendor/VendorEnquiryModal';

const label = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
function readable(value) {
  if (value == null) return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(readable).join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${label(key)}: ${readable(item)}`).join('; ');
  return String(value);
}
function Icon({ name, ...props }) {
  const paths = {
    camera: <><path d="M3 6h4l2-3h6l2 3h4v15H3Z" /><circle cx="12" cy="13" r="4" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    team: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-4a7 7 0 0 1 14 0v4M17 4a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18" /></>,
    phone: <path d="m5 3 4 1 1 5-3 2a15 15 0 0 0 6 6l2-3 5 1 1 4c-1 4-8 2-13-3S1 4 5 3Z" />,
    share: <><circle cx="18" cy="4" r="3" /><circle cx="5" cy="12" r="3" /><circle cx="18" cy="20" r="3" /><path d="m8 10 7-4M8 14l7 4" /></>,
    expand: <path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m6 6 6 6" />,
    heart: <path d="M20 4c-3-3-7-1-8 1-1-2-5-4-8-1-6 6 8 16 8 16S26 10 20 4Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name] || paths.check}</svg>;
}
function Metadata({ values }) {
  return values && Object.keys(values).length > 0 ? <dl className={styles.metadata}>{Object.entries(values).map(([key, value]) => <div key={key}><Icon name="check" /><div><dt>{label(key)}: </dt><dd>{readable(value)}</dd></div></div>)}</dl> : null;
}
function Media({ item, title, large = false }) {
  const [failed, setFailed] = useState(false);
  if (failed || !publicMediaUrl(item?.url)) return <div className={styles.mediaFallback}><Icon name="camera" /><span>Image unavailable</span></div>;
  return item.mediaType === 'VIDEO' ? <video src={item.url} controls preload="metadata" aria-label={title} className={styles.video} /> : <Image src={item.url} alt={title} fill unoptimized sizes={large ? '(min-width: 1024px) 60vw, 100vw' : '180px'} onError={() => setFailed(true)} className={styles.photo} />;
}
function Gallery({ media, title }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  return <>
    <div className={`${styles.gallery} ${media.length < 2 ? styles.singleMedia : ''}`}>
      <div className={styles.mainMedia}>{media.length ? <Media key={media[active].url} item={media[active]} title={title} large /> : <div className={styles.mediaFallback}><Icon name="camera" /><span>No photos provided</span></div>}{media.length > 0 && <button type="button" className={styles.expandButton} aria-label="Open full gallery" onClick={() => setOpen(true)}><Icon name="expand" /></button>}</div>
      {media.length > 1 && <div className={styles.thumbnails}>{media.slice(0, 4).map((item, index) => <button type="button" key={item.url || index} className={styles.thumbnail} aria-label={index === 3 && media.length > 4 ? `View all ${media.length} photos and videos` : `Show media ${index + 1}`} aria-pressed={active === index} onClick={() => { setActive(index); if (index === 3 && media.length > 4) setOpen(true); }}>{item.mediaType === 'VIDEO' ? <span className={styles.videoThumbnail}>▶ Video</span> : <Media item={item} title={`${title} thumbnail ${index + 1}`} />}{index === 3 && media.length > 4 && <span className={styles.moreMedia}>+{media.length - 3}<small>More</small></span>}</button>)}</div>}
    </div>
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth disableScrollLock aria-labelledby="listing-gallery-title">
      <DialogTitle id="listing-gallery-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>{title}<button type="button" className={styles.iconButton} onClick={() => setOpen(false)} aria-label="Close gallery"><Icon name="close" /></button></DialogTitle>
      <DialogContent>{media.length > 0 && <div className={styles.fullMedia}><Media key={media[active].url} item={media[active]} title={title} large /></div>}<div className={styles.galleryStrip}>{media.map((item, index) => <button type="button" key={item.url || index} className={styles.thumbnail} aria-label={`Show gallery media ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}>{item.mediaType === 'VIDEO' ? <span className={styles.videoThumbnail}>▶ Video</span> : <Media item={item} title={`${title} ${index + 1}`} />}</button>)}</div></DialogContent>
    </Dialog>
  </>;
}

export { Gallery as ListingGallery };

export default function ServiceListingDetail({ listing, listingSlug }) {
  const enquirySlug = listingSlug || listing.slug || listing.listingSlug || '';
  const [activeTab, setActiveTab] = useState('overview');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const vendor = listing.vendor?.profile || listing.vendor?.vendorProfile || listing.vendorProfile || listing.vendor || {};
  const vendorName = listingName(vendor) || listing.vendorName;
  const vendorDescription = vendor.about || vendor.description;
  const vendorId = listing.vendor?.userId || vendor.userId || listing.vendorUser?.userId;
  const services = listing.services || [];
  const categories = [...new Set(services.map(serviceInfo).map((item) => item.category).filter(Boolean))];
  const city = listing.city || {};
  const location = [listingName(city) || listing.cityName, city.stateName || listing.stateName, city.countryCode].filter(Boolean).join(', ');
  const coverage = (listing.serviceAreaCities || listing.serviceAreas || []).map((item) => listingName(item.city || item)).filter(Boolean);
  const phone = vendor.phone || vendor.businessPhone || listing.vendor?.phone || listing.vendorUser?.phone;
  const email = vendor.email || listing.vendor?.email || listing.vendorUser?.email;
  const whatsapp = vendor.whatsappNumber || vendor.whatsappPhone || listing.vendor?.whatsappNumber;
  const phoneUrl = phone ? `tel:${String(phone).replace(/[^+\d]/g, '')}` : '';
  const whatsappUrl = whatsapp ? `https://wa.me/${String(whatsapp).replace(/\D/g, '')}` : '';
  const rating = listing.averageRating ?? listing.rating;
  const reviewCount = listing.reviewCount ?? listing.ratingsCount;
  const reviews = Array.isArray(listing.reviews) ? listing.reviews : [];
  const joined = vendor.createdAt || listing.vendor?.createdAt;
  const logo = publicMediaUrl(vendor.logoUrl || listing.vendor?.logoUrl);
  const metadata = listing.metadata || {};
  const media = (listing.media || []).filter((item) => publicMediaUrl(item.url));
  if (!media.length && publicMediaUrl(listing.coverImageUrl || listing.imageUrl)) media.push({ url: listing.coverImageUrl || listing.imageUrl, mediaType: 'IMAGE' });
  const firstService = services[0]?.serviceSubcategory || services[0]?.subcategory || services[0]?.service;
  const categorySlug = firstService?.category?.slug || firstService?.serviceCategory?.slug;
  const vendorSlug = vendor.slug || vendor.vendorSlug || listing.vendor?.slug || listing.vendor?.vendorSlug;
  const profileHref = categorySlug && vendorSlug ? `/vendors/${encodeURIComponent(categorySlug)}/${encodeURIComponent(vendorSlug)}` : '';
  const tabs = [['overview', 'Overview'], ['packages', 'Services & Packages'], ['gallery', 'Gallery'], ['about-vendor', 'About Vendor'], ...(reviews.length ? [['reviews', 'Reviews']] : [])];
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: listing.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setShareMessage('Link copied'); }
    } catch (error) { if (error.name !== 'AbortError') setShareMessage('Copy the page address to share this service.'); }
  }
  return <div className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/#wedding-services">Services</Link>{categories[0] && <><span>›</span><span>{categories[0]}</span></>}<span>›</span><strong>{listing.title || 'Service details'}</strong></nav>
    <div className={styles.layout}>
      <div className={styles.mainColumn}>
        <div id="service-gallery" className={styles.anchor}><Gallery media={media} title={listing.title || 'Service'} /></div>
        <section id="service-overview" className={`${styles.summary} ${styles.anchor}`}>
          <div className={styles.badges}>{categories.map((category) => <span key={category}>{category}</span>)}</div>
          <div className={styles.titleRow}><h1>{listing.title || 'Service details'}</h1><div className={styles.price}><span>{listing.priceType === 'STARTING_FROM' ? 'Starting from' : 'Price'}</span><strong>{listingPrice(listing.startingPrice)}</strong></div></div>
          <div className={styles.summaryMeta}>{rating != null && <span><span className={styles.star}>★</span><strong>{rating}</strong>{reviewCount != null && ` (${reviewCount} Reviews)`}</span>}{location && <span><Icon name="pin" />{location}</span>}</div>
          {listing.description && <p className={styles.description}>{listing.description}</p>}
        </section>
        <nav className={styles.tabs} aria-label="Service detail sections">{tabs.map(([id, text]) => <a key={id} href={`#service-${id}`} aria-current={activeTab === id ? 'location' : undefined} className={activeTab === id ? styles.activeTab : ''} onClick={() => setActiveTab(id)}>{text}</a>)}</nav>
        <section id="service-packages" className={`${styles.panel} ${styles.anchor}`}><h2>Services &amp; Packages</h2><div className={styles.packages}>{services.length ? services.map((service, index) => {
          const info = serviceInfo(service);
          return <article key={service.id || service.serviceSubcategoryId || index} className={styles.package}><div className={styles.packageIcon}><Icon name="camera" /></div><div className={styles.packageBody}><div className={styles.packageHeading}><div>{info.category && <p>{info.category}</p>}<h3>{info.name || `Service ${index + 1}`}</h3></div><strong>{listingPrice(service.price)}</strong></div><Metadata values={service.metadata} /></div></article>;
        }) : <p>No individual service details provided.</p>}</div>{Object.keys(metadata).some((key) => !['teamSize', 'guestCapacity'].includes(key)) && <div className={styles.listingMetadata}><h3>Additional listing details</h3><Metadata values={Object.fromEntries(Object.entries(metadata).filter(([key]) => !['teamSize', 'guestCapacity'].includes(key)))} /></div>}</section>
        {reviews.length > 0 && <section id="service-reviews" className={`${styles.panel} ${styles.anchor}`}><h2>Reviews</h2>{reviews.map((review, index) => <article key={review.id || index} className={styles.review}><strong>{review.author?.name || review.user?.name || review.name || 'Customer'}</strong>{review.rating != null && <span className={styles.star}> ★ {review.rating}</span>}<p>{review.comment || review.text || review.message}</p></article>)}</section>}
      </div>
      <aside className={styles.sidebar}>
        <section className={`${styles.panel} ${styles.vendorCard}`} aria-label="Service provider and contact">
          <div className={styles.shareRow}><span role="status">{shareMessage}</span><button type="button" className={styles.iconButton} aria-label="Share service" onClick={share}><Icon name="share" /></button><button type="button" className={styles.iconButton} aria-label={saved ? 'Remove service from shortlist' : 'Shortlist service'} aria-pressed={saved} onClick={() => setSaved((value) => !value)}><Icon name="heart" fill={saved ? 'currentColor' : 'none'} /></button></div>
          <div className={styles.vendorHeading}><div className={styles.avatar}>{logo ? <Media item={{ url: logo }} title={vendorName || 'Vendor'} /> : <Icon name="camera" width="38" height="38" />}</div><div><h2>{vendorName || 'Service provider'}</h2>{vendorId && <span className={styles.vendorId}>{vendorId}</span>}{profileHref && <Link href={profileHref} className={styles.profileLink}>View Profile →</Link>}</div></div>
          {vendorDescription && <p className={styles.vendorDescription}>{vendorDescription}</p>}
          {(metadata.teamSize != null || metadata.guestCapacity != null) && <div className={styles.stats}>{[['teamSize', 'Team Size'], ['guestCapacity', 'Guest capacity']].map(([key, text]) => metadata[key] != null && <div key={key}><span className={styles.statIcon}><Icon name="team" /></span><div><p>{text}</p><strong>{Number.isFinite(Number(metadata[key])) ? Number(metadata[key]).toLocaleString('en-IN') : readable(metadata[key])}</strong></div></div>)}</div>}
          <div className={styles.location}>{location && <p><Icon name="pin" /><span>{location}</span></p>}{coverage.length > 0 && <p><Icon name="camera" /><span>Service Areas: <strong>{coverage.join(', ')}</strong></span></p>}</div>
          <button type="button" className={styles.primaryButton} disabled={!enquirySlug} onClick={() => setQuoteOpen(true)}>Send Enquiry</button>
          <div className={styles.contactButtons}>{phoneUrl && <a href={phoneUrl}><Icon name="phone" />Call Now</a>}{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer"><Icon name="phone" />WhatsApp</a>}</div>
          {!phone && !email && !whatsappUrl && <p className={styles.contactNote}>Contact details have not been provided.</p>}
        </section>
        <section id="service-about-vendor" className={`${styles.panel} ${styles.aboutVendor} ${styles.anchor}`}><h2>About This Vendor</h2><div><h3>{vendorName || 'Service provider'}</h3>{vendorDescription ? <p>{vendorDescription}</p> : <p>No vendor description provided.</p>}{email && <a href={`mailto:${email}`}>{email}</a>}</div>{joined && !Number.isNaN(Date.parse(joined)) && <p className={styles.joined}><Icon name="calendar" />Joined: {new Date(joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</p>}</section>
      </aside>
    </div>
    <VendorEnquiryModal listing={{ ...listing, slug: enquirySlug }} isOpen={quoteOpen} onClose={() => setQuoteOpen(false)} />
  </div>;
}
