import HomeMarketplaceSection from './HomeMarketplaceSection';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { listingHref, listingName, listingPrice, publicMediaUrl, serviceInfo } from '@/util/marketplaceListings.mjs';

export function ServiceListingCard({ listing, marketplaceHref }) {
  const [failedImage, setFailedImage] = useState('');
  const media = (listing.media || []).find((item) => item.mediaType !== 'VIDEO' && publicMediaUrl(item.url));
  const image = publicMediaUrl(media?.url || listing.coverImageUrl || listing.imageUrl);
  const href = marketplaceHref || listingHref(listing);
  const services = (listing.services || []).map(serviceInfo);
  const content = <>
    <div className="relative aspect-[16/9] overflow-hidden bg-rose-50">
      {image && failedImage !== image ? <Image src={image} alt={listing.title || 'Wedding service'} fill unoptimized sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" onError={() => setFailedImage(image)} className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-rose-50 to-rose-100 text-xs text-rose-800">Wedding services</div>}
    </div>
    <div className="flex flex-1 flex-col p-3">
      {services[0]?.category && <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#b61f4b]">{services[0].category}</p>}
      <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-stone-950 group-hover:text-[#b61f4b]">{listing.title || 'Wedding service'}</h3>
      <p className="mt-1 truncate text-[11px] text-stone-500">{listingName(listing.city) || listing.cityName}</p>
      <div className="mt-auto pt-2"><p className="text-sm font-bold text-[#b61f4b]">{listingPrice(listing.startingPrice)}{listing.priceType === 'STARTING_FROM' && <span className="ml-1 text-[10px] font-normal text-stone-500">onwards</span>}</p></div>
    </div>
  </>;
  return href ? <Link href={href} className="group flex h-full flex-col overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">{content}</Link> : <article className="flex h-full flex-col overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm">{content}</article>;
}

export default function MarketplaceServices({ categories = [], categoriesLoading = false }) {
  return <HomeMarketplaceSection categories={categories} categoriesLoading={categoriesLoading} Card={ServiceListingCard} />;
}
