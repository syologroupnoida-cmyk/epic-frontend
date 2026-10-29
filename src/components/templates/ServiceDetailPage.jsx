import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import { marketplaceListingDetailUrl, requestMarketplace } from '@/util/marketplaceListings.mjs';

import ServiceDetailContent from '@/components/common/ServiceListingDetail';
export { ServiceDetailContent };

export default function ServiceDetailPage() {
  const router = useRouter();
  const slug = router.isReady && typeof router.query.listingSlug === 'string' ? router.query.listingSlug : '';
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    requestMarketplace(marketplaceListingDetailUrl(slug), controller.signal).then((data) => {
      const listing = data?.listing || data;
      if (!listing || typeof listing !== 'object' || Array.isArray(listing) || !listing.title) throw new Error('Service details are unavailable.');
      if (!controller.signal.aborted) setResult({ slug, attempt, listing });
    }).catch((err) => { if (!controller.signal.aborted) setResult({ slug, attempt, error: err.message }); });
    return () => controller.abort();
  }, [slug, attempt]);
  const current = result?.slug === slug && result?.attempt === attempt ? result : null;
  return <><Head><title>{current?.listing?.title || 'Service details'} | Epic</title>{current?.listing?.description && <meta name="description" content={current.listing.description.slice(0, 160)} />}</Head><Header /><main className="min-h-[60vh] bg-stone-50">{!current ? <div role="status" className="mx-auto max-w-7xl animate-pulse px-4 py-16 sm:px-6 lg:px-8"><div className="h-12 w-2/3 rounded bg-rose-100" /><div className="mt-8 h-80 rounded-xl bg-rose-50" /><span className="sr-only">Loading service details...</span></div> : current.error ? <div role="alert" className="mx-auto max-w-xl px-6 py-20 text-center"><h1 className="font-serif text-2xl font-bold">{current.error}</h1><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-5 rounded-lg bg-[#b61f4b] px-5 py-2 text-sm text-white">Try again</button><Link href="/#wedding-services" className="ml-4 text-sm text-[#b61f4b]">Browse services</Link></div> : <ServiceDetailContent key={slug} listing={current.listing} listingSlug={slug} />}</main><Footer /></>;
}
