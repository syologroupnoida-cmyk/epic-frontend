import Image from 'next/image';
import Link from 'next/link';
import Header from '@/common/Header';
import Footer from '@/common/Footer';
import PartnerHeader from '@/common/PartnerHeader';
import PartnerFooter from '@/common/PartnerFooter';
import { WebsiteSeo, WebsiteSections, WebsiteActions } from '@/components/common/WebsiteContent';
import ContactEnquiryForm from '@/components/common/ContactEnquiryForm';
import CompactPageBanner from '@/components/common/CompactPageBanner';
import styles from '@/components/common/ContentPages.module.css';
import { websiteContent, contactDetails } from '@/data/websiteContent.mjs';
import { destinationOptions, stories, invitationCards } from '@/data/homeData';

export default function WebsiteContentPage({ pageKey }) {
  const page = websiteContent[pageKey];
  const partner = pageKey === 'partner';
  const gallery = pageKey === 'destinations' ? destinationOptions : pageKey === 'stories' ? stories : pageKey === 'invitations' ? invitationCards : [];
  const galleryHref = (item) => pageKey === 'destinations' ? `/destination/${item.slug}` : `/details/${item.slug}`;
  return <div className="min-h-screen bg-[#fff9f5] text-stone-900"><WebsiteSeo pageKey={pageKey} />{partner ? <><PartnerHeader /><div className="agent-header-spacer" aria-hidden="true" /></> : <Header />}<main>
    <CompactPageBanner id="overview" title={page.title} label={page.label} image={page.image} />
    <div className={styles.pageBody}>
      <section className={styles.lead} aria-label={`${page.label} introduction`}><p className={styles.leadSubtitle}>{page.subtitle}</p>{page.intro.map((paragraph) => <p key={paragraph} className={styles.leadText}>{paragraph}</p>)}<WebsiteActions pageKey={pageKey} /></section>
      <WebsiteSections pageKey={pageKey} omit={pageKey === 'contact' ? ['Contact Details', 'Enquiry Form'] : []} />
    </div>
    {pageKey === 'contact' && <div className={styles.contactLayout}><section className={styles.contactDetails}><h2>Contact Details</h2><p>Connect with Epic Wedz to explore the next steps in planning your celebration.</p><a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a><p>{contactDetails.hours}</p></section><ContactEnquiryForm embedded /></div>}
    {gallery.length > 0 && <section id={pageKey === 'stories' ? 'stories' : 'inspiration'} className="mx-auto max-w-[1184px] px-4 pb-14 pt-3 sm:px-6 lg:px-8"><h2 className="mb-6 text-center font-serif text-3xl font-bold">{pageKey === 'stories' ? 'Explore Real Wedding Stories' : pageKey === 'destinations' ? 'Explore Wedding Destinations' : 'Explore Wedding Invitations'}</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{gallery.map((item) => <Link key={item.slug} href={galleryHref(item)} className="group overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm"><div className="relative aspect-[4/3]"><Image src={item.image} alt={item.title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" /></div><div className="p-5"><h3 className="font-serif text-xl font-bold">{item.title}</h3>{item.text && <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>}<span className="mt-4 inline-flex text-sm font-semibold text-[#b61f4b]">Explore &rarr;</span></div></Link>)}</div></section>}
    {pageKey === 'planner' && <section className="mx-auto max-w-[1184px] px-4 pb-14 text-center"><Link href="/services?search=Wedding%20Planning" className="text-sm font-semibold text-[#b61f4b] underline">Explore wedding planning services &rarr;</Link></section>}
  </main>{partner ? <PartnerFooter /> : <Footer />}</div>;
}
