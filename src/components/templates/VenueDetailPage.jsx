import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import VenueListingDetail from '@/components/common/VenueListingDetail';
import { requestVenues } from '@/util/marketplaceVenues.mjs';

export default function VenueDetailPage() {
  const router = useRouter();
  const slug = router.isReady && typeof router.query.venuePropertySlug === 'string' ? router.query.venuePropertySlug : '';
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    requestVenues(`/api/marketplace/venue-properties/${encodeURIComponent(slug)}`, controller.signal).then((data) => {
      const property = data?.venueProperty || data?.property || data;
      if (!property || typeof property !== 'object' || Array.isArray(property) || !property.title) throw new Error('Venue details are unavailable.');
      if (!controller.signal.aborted) setResult({ slug, attempt, property });
    }).catch((err) => { if (!controller.signal.aborted) setResult({ slug, attempt, error: err.message }); });
    return () => controller.abort();
  }, [slug, attempt]);
  const current = result?.slug === slug && result?.attempt === attempt ? result : null;
  return <><Head><title>{current?.property?.title || 'Wedding venue'} | Epic</title>{current?.property?.description && <meta name="description" content={current.property.description.slice(0, 160)} />}</Head><Header /><main className="min-h-[60vh] bg-stone-50">{!current ? <div role="status" className="mx-auto max-w-7xl animate-pulse px-6 py-16"><div className="h-12 w-2/3 rounded bg-rose-100" /><div className="mt-8 h-80 rounded-xl bg-rose-50" /><span className="sr-only">Loading venue details...</span></div> : current.error ? <div role="alert" className="mx-auto max-w-xl px-6 py-20 text-center"><h1 className="font-serif text-2xl font-bold">{current.error}</h1><button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-5 rounded-lg bg-[#b61f4b] px-5 py-2 text-sm text-white">Try again</button><Link href="/#wedding-venues" className="ml-4 text-sm text-[#b61f4b]">Browse venues</Link></div> : <VenueListingDetail property={current.property} />}</main><Footer /></>;
}
