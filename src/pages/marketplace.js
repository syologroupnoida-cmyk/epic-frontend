import Image from "next/image";
import Link from "next/link";
import Header from "@/common/Header";
import Footer from "@/common/Footer";
import {
  brandTagline,
  marketplaceCards,
  weddingDestinationSection,
} from "@/data/homeData";

const filters = {
  City: ["Delhi NCR", "Mumbai", "Jaipur", "Goa"],
  Category: ["Venues", "Planning", "Beauty", "Photo"],
  Rating: ["4.8+", "4.5+", "4.0+"],
};

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#fff9f5] text-stone-900">
      <Header />
      <main>
        <section className="relative isolate min-h-[360px] overflow-hidden">
          <Image
            src={weddingDestinationSection.image}
            alt="Wedding marketplace hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto flex min-h-[360px] max-w-4xl flex-col items-center justify-center px-4 text-center text-white sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ffd18a]">
              Marketplace
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">
              Find Wedding Vendors
            </h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/85">
              {brandTagline}
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto grid max-w-7xl gap-7 px-4 sm:px-6 lg:grid-cols-[340px_1fr] lg:px-8">
            <aside className="h-fit space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">Filters</h2>
                <button className="text-sm font-bold text-[#b61f4b]">
                  Clear
                </button>
              </div>
              <div className="rounded border border-rose-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
                  Price Range
                </h3>
                <input
                  type="range"
                  min="25000"
                  max="500000"
                  defaultValue="250000"
                  className="mt-5 w-full accent-[#b61f4b]"
                />
                <div className="mt-3 flex items-center justify-between text-sm font-bold text-stone-700">
                  <span>Rs. 25k</span>
                  <span>Rs. 5L</span>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries(filters).map(([title, items]) => (
                  <div
                    key={title}
                    className="rounded border border-rose-100 bg-white p-5 shadow-sm"
                  >
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">
                      {title}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {items.map((item) => (
                        <label
                          key={item}
                          className="flex cursor-pointer items-center gap-3 rounded border border-rose-100 px-3 py-2 text-sm font-semibold hover:border-[#b61f4b] hover:bg-rose-50"
                        >
                          <input type="checkbox" className="accent-[#b61f4b]" />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div>
              <div className="mb-5 flex flex-col gap-3 rounded border border-rose-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-stone-700">
                  Showing {marketplaceCards.length} curated results
                </p>
                <select className="h-11 rounded border border-rose-100 bg-white px-3 text-sm font-semibold outline-none focus:border-[#b61f4b]">
                  <option>Recommended</option>
                  <option>Price low to high</option>
                  <option>Top rated</option>
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {marketplaceCards.map((card) => (
                  <article
                    key={card.slug}
                    className="overflow-hidden rounded border border-rose-100 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                        style={{ objectPosition: card.position || "center" }}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-2xl font-bold">
                          {card.title}
                        </h3>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#b61f4b]">
                          4.8
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {card.text}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-700">
                          From Rs. 25,000
                        </span>
                        <Link
                          href={`/details/${card.slug}`}
                          className="text-sm font-bold text-[#b61f4b]"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
                {["Prev", "1", "2", "3", "Next"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`h-10 rounded-full border px-4 text-sm font-bold ${
                      item === "1"
                        ? "border-[#b61f4b] bg-[#b61f4b] text-white"
                        : "border-rose-100 bg-white text-stone-700 hover:border-[#b61f4b] hover:text-[#b61f4b]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
