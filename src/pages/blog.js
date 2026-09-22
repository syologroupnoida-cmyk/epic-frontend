import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import { blogPosts, brandTagline } from "@/data/homeData";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />
      <main>
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
              Wedding Blog
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-stone-950 sm:text-6xl">
              Ideas For Your Own Special Day
            </h1>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-stone-600">
              {brandTagline}
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
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
      </main>
      <Footer />
    </div>
  );
}
