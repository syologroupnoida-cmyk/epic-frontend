import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogTitle, DialogContent, IconButton, Slide } from "@mui/material";
import { weddingCategories, weddingServiceHref } from "@/data/weddingCategories.mjs";
import planning from "@/images/blog-planning.png";
import venues from "@/images/category-venues.png";
import decor from "@/images/category-decor.png";
import photography from "@/images/category-photography.png";
import makeup from "@/images/category-makeup.png";
import mehendi from "@/images/category-mehendi.png";
import catering from "@/images/category-catering.png";
import reception from "@/images/hero-reception.png";
import invitation from "@/images/invite-wedding.png";
import bridal from "@/images/story-jaipur.png";
import groom from "@/images/story-ahmedabad.png";
import jewellery from "@/images/blog-makeup.png";
import cakes from "@/images/blog-catering.png";
import gifts from "@/images/invite-engagement.png";
import transport from "@/images/destination-rajasthan.png";
import hospitality from "@/images/blog-venue.png";
import honeymoon from "@/images/destination-bali.png";
import rentals from "@/images/hero-mandap.png";
import rituals from "@/images/hero-pheras.png";
import favors from "@/images/invite-reception.png";

const categoryImages = {
  "blog-planning": planning, "category-venues": venues, "category-decor": decor,
  "category-photography": photography, "category-makeup": makeup, "category-mehendi": mehendi,
  "category-catering": catering, "hero-reception": reception, "invite-wedding": invitation,
  "story-jaipur": bridal, "story-ahmedabad": groom, "blog-makeup": jewellery,
  "blog-catering": cakes, "invite-engagement": gifts, "destination-rajasthan": transport,
  "blog-venue": hospitality, "destination-bali": honeymoon, "hero-mandap": rentals,
  "hero-pheras": rituals, "invite-reception": favors,
};

export default function WeddingCategoryDirectory() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const hasCategory = Boolean(selectedCategory);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!hasCategory) return;
    // Keep the scrollbar's space without MUI adding padding to the body/header.
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
    };
  }, [hasCategory]);

  return (
    <section aria-labelledby="wedding-categories-title" className="border-b border-rose-100 bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#b61f4b]">Your celebration starts here</p>
            <h2 id="wedding-categories-title" className="font-serif text-2xl font-bold text-stone-950 sm:text-3xl">Find your wedding dream team</h2>
            <p className="mt-2 text-sm text-stone-600">Explore 20 categories. Choose a service and discover wedding vendors.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-6 min-[400px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-10">
          {weddingCategories.map((category) => (
            <button key={category.slug} type="button" aria-haspopup="dialog" onClick={() => { setSelectedCategory(category); setIsOpen(true); }}
              className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b61f4b]">
              <span className="relative block h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-white bg-rose-50 shadow-[0_0_0_1px_#f5dce3] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_0_0_2px_#b61f4b] sm:h-[88px] sm:w-[88px]">
                <Image src={categoryImages[category.image]} alt="" fill sizes="88px" className="object-cover transition duration-300 group-hover:scale-110" />
              </span>
              <span className="max-w-[120px] text-xs font-semibold leading-4 text-stone-800 group-hover:text-[#b61f4b]">{category.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-7 text-center">
          <Link href="/vendors" className="text-sm font-bold text-[#b61f4b] hover:underline">View all vendors <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <Dialog open={isOpen} onClose={close} fullWidth maxWidth="sm" disableScrollLock aria-labelledby="category-services-title"
        slots={{ transition: Slide }}
        slotProps={{
          transition: { direction: "down", timeout: { enter: 320, exit: 220 }, onExited: () => setSelectedCategory(null) },
          paper: { sx: { borderRadius: 3, backgroundColor: "#fffaf7", maxHeight: "85dvh" } },
        }}>
        <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 2, pr: 1.5, borderBottom: "1px solid #f5dce3" }}>
          {selectedCategory && <Image src={categoryImages[selectedCategory.image]} alt="" width={52} height={52} className="h-13 w-13 shrink-0 rounded-full object-cover" />}
          <div className="min-w-0 flex-1">
            <h3 id="category-services-title" className="font-serif text-xl font-bold text-stone-950">{selectedCategory?.name}</h3>
            <p className="mt-1 text-xs text-stone-600">Choose a service to explore vendors</p>
          </div>
          <IconButton onClick={close} aria-label="Close services" sx={{ color: "#8f1f3f" }}>×</IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <ul className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
            {selectedCategory?.services.map((service) => (
              <li key={service.slug}>
                <Link href={weddingServiceHref(service)} onClick={close} className="flex h-full min-h-12 items-center justify-between gap-2 rounded-lg border border-rose-100 bg-white px-3 py-3 text-sm font-semibold text-stone-800 transition hover:border-[#b61f4b] hover:bg-rose-50 hover:text-[#b61f4b] focus-visible:outline-2 focus-visible:outline-[#b61f4b]">
                  {service.name}<span aria-hidden="true" className="text-[#b61f4b]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
