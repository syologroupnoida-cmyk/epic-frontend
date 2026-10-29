import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { listingHref, listingName, listingPrice, publicMediaUrl } from '@/util/marketplaceListings.mjs';
import { venueHref } from '@/util/marketplaceVenues.mjs';
import { marketplaceRating } from '@/util/marketplacePresentation.mjs';
import styles from '@/components/templates/ListingMarketplace.module.css';

export function MarketplaceIcon({ name, ...props }) {
  const paths = {
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    filter: <path d="M3 4h18l-7 8v8l-4-2v-6L3 4Z" />,
    heart: <path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-6 6 8 15 8 15S26 11 20 5Z" />,
    grid: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /></>,
    list: <><path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1" /></>,
  };
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name] || paths.pin}</svg>;
}

export default function MarketplaceResultCard({ item, venue = false }) {
  const [failedImage, setFailedImage] = useState('');
  const [saved, setSaved] = useState(false);
  const media = (item.media || []).find((entry) => entry.mediaType !== 'VIDEO' && publicMediaUrl(entry.url));
  const photo = publicMediaUrl(media?.url || item.coverImageUrl || item.imageUrl);
  const image = photo && failedImage !== photo ? photo : `/images/marketplace-${venue ? 'venues' : 'services'}-hero.png`;
  const href = venue ? venueHref(item) : listingHref(item);
  const title = item.title || (venue ? 'Wedding venue' : 'Wedding service');
  const rating = marketplaceRating(item);
  const reviewCount = item.reviewCount ?? item.ratingsCount;
  const location = [listingName(item.city) || item.cityName, item.city?.stateName || item.stateName].filter(Boolean).join(', ');
  return <article className={styles.card}>
    <div className={styles.cardImage}>
      <Image src={image} alt={photo && failedImage !== photo ? title : `${venue ? 'Wedding venue' : 'Wedding services'} inspiration`} fill unoptimized sizes="(min-width: 1100px) 24vw, (min-width: 640px) 45vw, 100vw" onError={() => setFailedImage(image)} className={styles.photo} />
      <button type="button" className={`${styles.save} ${saved ? styles.saved : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} ${title}`} aria-pressed={saved} onClick={() => setSaved(!saved)}><MarketplaceIcon name="heart" fill={saved ? 'currentColor' : 'none'} /></button>
      <span className={styles.cardBadge}>{venue ? 'VENUE' : 'SERVICE'}</span>
    </div>
    <div className={styles.cardBody}>
      <h2>{href ? <Link href={href}>{title}</Link> : title}</h2>
      <div className={styles.rating}>{rating !== null ? <><span className={styles.star}>&#9733;</span> {rating.toFixed(1)} {reviewCount != null && <span>({reviewCount} reviews)</span>}</> : <span className={styles.newListing}>Explore this {venue ? 'venue' : 'service'}</span>}{venue && item.capacityMax != null && <span className={styles.capacity}>Up to {item.capacityMax} guests</span>}</div>
      <div className={styles.cardPrice}><span>{item.priceType === 'STARTING_FROM' ? 'Starting from' : 'Price'}</span><strong>{listingPrice(item.startingPrice)}</strong></div>
      <div className={styles.cardFooter}><span title={location}><MarketplaceIcon name="pin" />{location || 'Location on request'}</span>{href && <Link href={href}>View Details</Link>}</div>
    </div>
  </article>;
}
