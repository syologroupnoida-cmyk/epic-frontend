import Head from 'next/head';
import Link from 'next/link';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import { websiteContent } from '@/data/websiteContent.mjs';
import { legalContent } from '@/data/legalContent.mjs';

export default function Sitemap() {
  return <><Head><title>Sitemap | Epic Wedz</title><meta name="description" content="Explore Epic Wedz wedding venues, vendors, planning resources and company information." /></Head><Header /><main className="mx-auto min-h-[50vh] max-w-5xl px-4 py-14"><h1 className="font-serif text-4xl font-bold">Explore Epic Wedz</h1><ul className="mt-8 grid gap-4 sm:grid-cols-2">{[...Object.values(websiteContent), ...Object.values(legalContent).map((page) => ({ ...page, label: page.title }))].map((page) => <li key={page.path}><Link href={page.path} className="text-sm font-semibold text-[#b61f4b] underline">{page.label}</Link></li>)}<li><Link href="/services" className="text-sm font-semibold text-[#b61f4b] underline">Wedding service listings</Link></li></ul></main><Footer /></>;
}
