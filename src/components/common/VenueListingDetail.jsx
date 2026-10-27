import Link from 'next/link';
import { ListingGallery } from './ServiceListingDetail';
import { listingName, listingPrice, publicMediaUrl } from '@/util/marketplaceListings.mjs';
import { normalizeVenueType } from '@/components/vendor/properties/propertyModel';
import styles from './ServiceListingDetail.module.css';
import venueStyles from './VenueListingDetail.module.css';

const label = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
function readable(value) {
  if (value == null || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(readable).join(', ');
  if (typeof value === 'object') return listingName(value) || Object.entries(value).map(([key, item]) => `${label(key)}: ${readable(item)}`).join('; ');
  return String(value);
}
function Facts({ entries }) {
  return <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{entries.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([title, value]) => <div key={title} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4"><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-2 break-words text-sm font-semibold text-slate-900">{readable(value)}</dd></div>)}</dl>;
}

export default function VenueListingDetail({ property }) {
  const vendor = property.vendor?.profile || property.vendor?.vendorProfile || property.vendorProfile || property.vendor || {};
  const vendorName = listingName(vendor) || listingName(property.vendorUser) || property.vendorName;
  const phone = vendor.phone || vendor.businessPhone || property.vendor?.phone || property.vendorUser?.phone;
  const email = vendor.email || property.vendor?.email || property.vendorUser?.email;
  const whatsapp = vendor.whatsappNumber || vendor.whatsappPhone || property.vendor?.whatsappNumber;
  const phoneDigits = String(phone || '').replace(/[^+\d]/g, '');
  const whatsappDigits = String(whatsapp || '').replace(/\D/g, '');
  const types = (property.venueTypes || []).map(normalizeVenueType).map((item) => item.name).filter(Boolean);
  const city = listingName(property.city) || property.cityName;
  const address = property.address || {};
  const location = [...new Set([address.street, address.locality, city, address.state, address.pincode, address.country].filter(Boolean))].join(', ');
  const media = (property.media || []).filter((item) => publicMediaUrl(item.url));
  if (!media.length && publicMediaUrl(property.coverImageUrl || property.imageUrl)) media.push({ url: property.coverImageUrl || property.imageUrl, mediaType: 'IMAGE' });
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const reviews = Array.isArray(property.reviews) ? property.reviews : [];
  const rating = property.averageRating ?? property.rating;
  const sections = [['overview', 'Overview'], ['facilities', 'Facilities'], ['location', 'Location'], ...(reviews.length ? [['reviews', 'Reviews']] : [])];
  return <div className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/#wedding-venues">Wedding venues</Link><span>›</span><strong>{property.title}</strong></nav>
    <div className={styles.layout}>
      <div className={`${styles.mainColumn} ${venueStyles.main}`}>
        <ListingGallery key={property.slug || property.id || property.title} media={media} title={property.title || 'Wedding venue'} />
        <section id="venue-overview" className={`${styles.summary} ${styles.anchor}`}>
          {types.length > 0 && <div className={styles.badges}>{[...new Set(types)].map((type) => <span key={type}>{type}</span>)}</div>}
          <div className={`${styles.titleRow} ${venueStyles.title}`}><h1>{property.title}</h1><div className={styles.price}><span>{property.priceType === 'STARTING_FROM' ? 'Starting from' : 'Price'}</span><strong>{listingPrice(property.startingPrice)}</strong></div></div>
          <div className={styles.summaryMeta}>{city && <span>{city}</span>}{rating != null && <span>★ {readable(rating)}{property.reviewCount != null && ` (${property.reviewCount} reviews)`}</span>}</div>
          {property.description && <p className={styles.description}>{property.description}</p>}
        </section>
        <nav className={styles.tabs} aria-label="Venue detail sections">{sections.map(([id, title]) => <a key={id} href={`#venue-${id}`}>{title}</a>)}</nav>
        <section id="venue-facilities" className={`${styles.panel} ${styles.anchor}`}><h2>Capacity &amp; facilities</h2>
          <Facts entries={[
            ['Minimum capacity', property.capacityMin], ['Maximum capacity', property.capacityMax], ['Rooms', property.rooms], ['Parking capacity', property.parkingCapacity],
            ['Venue types', types.length ? types.join(', ') : undefined], ['Price type', property.priceType ? label(property.priceType.toLowerCase()) : undefined],
          ]} />
          {amenities.length > 0 && <div className="mt-6"><h3 className="mb-3 text-base font-semibold">Amenities</h3><ul className="flex flex-wrap gap-2">{amenities.map((item, index) => <li key={index} className="rounded-full bg-blue-50 px-4 py-2 text-xs text-blue-900">{readable(item)}</li>)}</ul></div>}
          {Object.keys(property.metadata || {}).length > 0 && <div className="mt-6"><h3 className="mb-3 text-base font-semibold">Venue information &amp; policies</h3><Facts entries={Object.entries(property.metadata).map(([key, value]) => [label(key), value])} /></div>}
        </section>
        <section id="venue-location" className={`${styles.panel} ${styles.anchor}`}><h2>Location</h2><p className="text-sm leading-7 text-slate-600">{location || 'Address available on request.'}</p>{location && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-700">View on map ↗</a>}</section>
        {reviews.length > 0 && <section id="venue-reviews" className={`${styles.panel} ${styles.anchor}`}><h2>Guest reviews</h2>{reviews.map((review, index) => <article key={review.id || index} className={styles.review}><strong>{listingName(review.user) || review.reviewerName || 'Guest'}</strong>{review.rating != null && <span className="ml-3 text-amber-600">★ {readable(review.rating)}</span>}<p>{review.comment || review.review || review.description}</p></article>)}</section>}
      </div>
      <aside className={`${styles.sidebar} ${venueStyles.sidebar}`}>
        <section className={styles.vendorCard}><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-700">Plan your celebration</p><h2 className="font-serif text-2xl font-bold">{vendorName || 'Enquire about this venue'}</h2>{(vendor.about || vendor.description) && <p className={styles.vendorDescription}>{vendor.about || vendor.description}</p>}
          <div className="my-6 rounded-xl bg-blue-50 p-4"><p className="text-xs text-slate-500">{property.priceType === 'STARTING_FROM' ? 'Starting from' : 'Venue price'}</p><p className="mt-2 text-3xl font-bold text-blue-700">{listingPrice(property.startingPrice)}</p>{property.capacityMax != null && <p className="mt-2 text-sm text-slate-600">Up to {property.capacityMax} guests</p>}</div>
          {location && <p className="mb-5 text-sm leading-6 text-slate-600">{location}</p>}
          {phoneDigits && <a href={`tel:${phoneDigits}`} className={styles.primaryButton}>Call venue</a>}
          {(whatsappDigits || email) && <div className={styles.contactButtons}>{whatsappDigits && <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}{email && <a href={`mailto:${email}`}>Email venue</a>}</div>}
          {!phoneDigits && !whatsappDigits && !email && <p className="text-sm text-slate-500">Contact details have not been provided for this venue.</p>}
          <p className={styles.contactNote}>Contact the venue to confirm availability, inclusions, and final pricing.</p>
        </section>
      </aside>
    </div>
  </div>;
}
