import CompactPageBanner from '@/components/common/CompactPageBanner';
import { websiteContent } from '@/data/websiteContent.mjs';
import { WebsiteSeo, WebsiteSections, WebsiteActions } from '@/components/common/WebsiteContent';
import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import { blogPosts } from "@/data/homeData";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <WebsiteSeo pageKey="blog" />
      <Header />
      <main>
        <CompactPageBanner title={websiteContent.blog.title} label={websiteContent.blog.label} image={websiteContent.blog.image} />
        <p className="mx-auto mt-6 max-w-4xl px-4 text-center text-lg leading-7 text-stone-600">{websiteContent.blog.subtitle}</p>

        <p className="mx-auto max-w-4xl px-4 pt-8 text-center text-sm leading-7 text-stone-600">{websiteContent.blog.intro[0]}</p>
        <WebsiteSections pageKey="blog" />
        <section id="articles" className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/details/${post.slug}`}
                className="group overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b61f4b]">
                    {post.category}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl font-bold text-stone-950">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    Fresh wedding ideas, styling notes, and practical planning
                    inspiration for modern celebrations.
                  </p>
                  <span className="mt-5 inline-flex text-sm font-bold text-[#b61f4b]">
                    Read Details
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <WebsiteActions pageKey="blog" />
      </main>
      <Footer />
    </div>
  );
}
