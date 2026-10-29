import Image from 'next/image';
import Link from 'next/link';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import { WebsiteSeo, WebsiteSections, WebsiteActions } from '@/components/common/WebsiteContent';
import { websiteContent } from '@/data/websiteContent.mjs';
import { allCards, vendorCategories } from '@/data/homeData';

function contentKey(item) {
  if (item.type === 'Invitation') return 'invitations';
  if (item.type === 'Real Wedding') return 'stories';
  if (item.type === 'Wedding Blog') return 'blog';
  if (item.type === 'Wedding Destination') return 'destinations';
  if (item.type === 'Luxury Wedding') return 'luxury';
  if (/venue|banquet|hotel|palace|farmhouse|lawn/.test(item.slug)) return 'venues';
  if (/planner/.test(item.slug)) return 'planner';
  return 'vendors';
}

export default function DetailPage({ item }) {
  const key = contentKey(item);
  const page = websiteContent[key];
  return <div className="min-h-screen bg-[#fff9f5] text-stone-900"><WebsiteSeo pageKey={key} title={`${item.title} | Epic Wedz`} description={item.text || page.description} path={`/details/${item.slug}`} /><Header /><main>
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-rose-100"><Image src={item.image || vendorCategories[0].image} alt={item.title} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" /></div><div><nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-2 text-xs text-stone-500"><Link href="/">Home</Link><span>/</span><Link href={page.path}>{page.label}</Link><span>/</span><span aria-current="page">{item.title}</span></nav><p className="text-xs font-bold uppercase tracking-widest text-[#b61f4b]">{page.label}</p><h1 className="mt-3 font-serif text-4xl font-bold">{item.title}</h1>{item.text && <p className="mt-5 text-lg leading-8 text-stone-600">{item.text}</p>}<p className="mt-4 text-sm leading-7 text-stone-600">{page.intro[0]}</p><WebsiteActions pageKey={key} /></div></section>
    <WebsiteSections pageKey={key} />
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><h2 className="font-serif text-2xl font-bold">Explore wedding services</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{vendorCategories.map((category) => <Link key={category.slug} href={`/vendors?search=${encodeURIComponent(category.title)}`} className="rounded-xl border border-rose-100 bg-white p-4 text-sm font-semibold text-[#b61f4b]">{category.title} &rarr;</Link>)}</div></section>
  </main><Footer /></div>;
}

export function getStaticPaths() {
  return { paths: [...new Set(allCards.map((item) => item.slug))].map((slug) => ({ params: { slug } })), fallback: 'blocking' };
}
export function getStaticProps({ params }) {
  const found = allCards.find((card) => card.slug === params.slug);
  return found ? { props: { item: found } } : { notFound: true };
}
