import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import QuoteModal from "@/components/common/QuoteModal";
import { brandTagline } from "@/data/homeData";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Contact", href: "#" },
      { label: "List Your Business", href: "#" },
      { label: "Blog", href: "/blog" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "SaadiMitra", href: "/saadimitra" },
      { label: "Wedding Destination", href: "/destination/national-wedding" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Address",
    text: [
      "Epic Wedz Wedding Services",
      "Sector 62, Noida",
      "Delhi NCR, India",
      "Call: +91 99999 99999",
      "Email: hello@epicwedz.com",
    ],
  },
  {
    title: "Venues",
    links: [
      "Banquet Hall",
      "Wedding Hotel",
      "Luxury Hotel",
      "Resort",
      "Farmhouse",
      "Palace",
      "Beach Venue",
      "Lawns",
      "Rooftop Venue",
      "Destination Wedding Venue",
    ],
  },
  {
    title: "Decor & Photo",
    links: [
      "Wedding Decoration",
      "Floral Decoration",
      "Mandap Decoration",
      "Stage Decoration",
      "Candid Photography",
      "Cinematic Photography",
      "Pre Wedding Shoot",
      "Drone Photography",
      "Wedding Film",
      "Live Streaming",
    ],
  },
  {
    title: "Beauty & Food",
    links: [
      "Bridal Makeup",
      "Groom Makeup",
      "HD Makeup",
      "Hair Styling",
      "Bridal Mehendi",
      "Arabic Mehendi",
      "North Indian Catering",
      "South Indian Catering",
      "Live Counters",
      "Dessert Counter",
    ],
  },
  {
    title: "Events & Fashion",
    links: [
      "DJ",
      "Live Band",
      "Celebrity Artist",
      "Choreographer",
      "Printed Invitation",
      "Digital Invitation",
      "Bridal Lehenga",
      "Designer Wear",
      "Sherwani",
      "Bridal Jewellery",
    ],
  },
  {
    title: "Wedding Support",
    links: [
      "Hire Free Wedding Planner",
      "Luxury Wedding",
      "Wedding Rentals",
      "Transportation",
      "Hospitality",
      "Honeymoon Services",
      "Pandit",
      "Wedding Hampers",
      "Photo Booth",
      "Guest Welcome Kits",
    ],
  },
];

function hrefFromLabel(label) {
  if (label === "Hire Free Wedding Planner") {
    return "/hire-free-wedding-planner";
  }

  if (label === "Luxury Wedding") {
    return "/luxury-wedding";
  }

  return `/details/${label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export default function Footer() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  return (
    <footer className="mt-32 bg-[#421321] pt-8 text-rose-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="footer-quote-card -translate-y-1/2 rounded border border-rose-100 bg-white p-6 text-stone-900 shadow-2xl sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
                Get Quote
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold">
                Need help finding the right wedding vendors?
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Share your event details and get curated dummy recommendations
                for venues, planners, decorators, caterers, and artists.
              </p>
            </div>
            <form className="grid gap-2 rounded border border-rose-200 p-4 sm:grid-cols-2 lg:w-[620px]">
              <label className="mui-field">
                <input placeholder=" " />
                <span>Name</span>
              </label>
              <label className="mui-field">
                <input placeholder=" " />
                <span>City</span>
              </label>
              <label className="mui-field">
                <input placeholder=" " />
                <span>Phone number</span>
              </label>
              <label className="mui-field">
                <input placeholder=" " />
                <span>Message</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQuoteOpen(true)}
                className="h-12 rounded bg-[#b61f4b] px-6 text-sm font-bold text-white hover:bg-[#981a3f] sm:col-span-2"
              >
                Get a Free quote
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-10 grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="inline-flex rounded bg-white px-3 py-2">
            <Image
              src="/images/epic-logo.webp"
              alt="Epic Wedz"
              width={150}
              height={52}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 font-serif text-xl font-bold leading-7 text-white">
            Epic - {brandTagline}
          </p>
          <p className="mt-4 text-sm leading-6 text-rose-100/80">
            A modern wedding marketplace for finding trusted venues, vendors,
            planning tools, and celebration ideas in one place.
          </p>
          <div className="mt-5 space-y-2 text-sm text-rose-100/80">
            <p>Call: +91 99999 99999</p>
            <p>Email: hello@epicwedz.com</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
            <a
              href="#"
              aria-label="Instagram"
              className="footer-social footer-social-instagram"
            />
            <a
              href="#"
              aria-label="Facebook"
              className="footer-social footer-social-facebook"
            />
            <a
              href="#"
              aria-label="YouTube"
              className="footer-social footer-social-youtube"
            />
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#f4c27d]">
              {column.title}
            </h3>
            {column.text ? (
              <div className="mt-4 space-y-2 text-sm leading-6 text-rose-100/80">
                {column.text.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-rose-100/80">
                {column.links.map((link) => {
                  const item =
                    typeof link === "string"
                      ? { label: link, href: hrefFromLabel(link) }
                      : link;

                  return (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl justify-center px-4 py-5 text-center text-sm text-rose-100/70 sm:px-6 lg:px-8">
          <p>Copyright 2026 Epic Wedz. All rights reserved.</p>
        </div>
      </div>
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </footer>
  );
}
