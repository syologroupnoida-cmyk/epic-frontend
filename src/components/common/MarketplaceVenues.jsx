import HomeMarketplaceSection from './HomeMarketplaceSection';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { listingName, listingPrice, publicMediaUrl } from '@/util/marketplaceListings.mjs';
import { venueHref } from '@/util/marketplaceVenues.mjs';
import { normalizeVenueType } from '@/components/vendor/properties/propertyModel';

export function VenueCard({ property, marketplaceHref }) {
  const [failedImage, setFailedImage] = useState('');
  const media = (property.media || []).find((item) => item.mediaType !== 'VIDEO' && publicMediaUrl(item.url));
  const image = publicMediaUrl(media?.url || property.coverImageUrl || property.imageUrl);
  const href = marketplaceHref || venueHref(property);
  const type = (property.venueTypes || []).map(normalizeVenueType).find((item) => item.name)?.name;
  const content = <>
    <div className="relative aspect-[16/10] overflow-hidden bg-rose-50">
      {image && failedImage !== image ? <Image src={image} alt={property.title || 'Wedding venue'} fill unoptimized sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" onError={() => setFailedImage(image)} className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-amber-50 font-serif text-lg text-rose-800">Wedding venues</div>}
      {type && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#b61f4b]">{type}</span>}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <h3 className="line-clamp-2 font-serif text-base font-semibold text-stone-950 group-hover:text-[#b61f4b]">{property.title || 'Wedding venue'}</h3>
      <p className="mt-2 text-xs text-stone-500">{[property.address?.locality, listingName(property.city) || property.cityName].filter(Boolean).join(', ') || 'Location on request'}</p>
      {property.capacityMax != null && <p className="mt-3 text-xs text-stone-600">{property.capacityMin != null ? `${property.capacityMin} – ${property.capacityMax}` : `Up to ${property.capacityMax}`} guests</p>}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-rose-50 pt-3"><div><p className="text-[10px] uppercase tracking-wide text-stone-500">{property.priceType === 'STARTING_FROM' ? 'Starting from' : 'Price'}</p><p className="mt-1 text-lg font-bold text-[#b61f4b]">{listingPrice(property.startingPrice)}</p></div>{href && <span className="text-xs font-semibold text-[#b61f4b]">{marketplaceHref ? 'Explore venues' : 'View venue'} &rarr;</span>}</div>
    </div>
  </>;
  return href ? <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{content}</Link> : <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">{content}</article>;
}

export default function MarketplaceVenues({ categories = [], categoriesLoading = false }) {
  return <HomeMarketplaceSection venue categories={categories} categoriesLoading={categoriesLoading} Card={VenueCard} />;
}
