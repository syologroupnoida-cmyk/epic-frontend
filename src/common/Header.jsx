import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CitySearch from "@/components/common/CitySearch";
import QuoteModal from "@/components/common/QuoteModal";
import {
  destinationOptions,
  stories,
  vendorCategories,
} from "@/data/homeData";

const venueLinks = [
  { title: "Banquet Hall", slug: "banquet-hall" },
  { title: "Wedding Hotel", slug: "wedding-hotel" },
  { title: "Luxury Hotel", slug: "luxury-hotel" },
  { title: "Resort", slug: "resort" },
  { title: "Farmhouse", slug: "farmhouse" },
  { title: "Palace", slug: "palace" },
  { title: "Fort Wedding Venue", slug: "fort-wedding-venue" },
  { title: "Beach Venue", slug: "beach-venue" },
  { title: "Lawns", slug: "lawns" },
  { title: "Garden", slug: "garden" },
  { title: "Club", slug: "club" },
  { title: "Convention Center", slug: "convention-center" },
  { title: "Rooftop Venue", slug: "rooftop-venue" },
  { title: "Heritage Venues", slug: "heritage-venues" },
  { title: "Destination Wedding Venue", slug: "destination-wedding-venue" },
];

const vendorMenuGroups = [
  {
    title: "Decoration Services",
    links: [
      "Wedding Decoration",
      "Floral Decoration",
      "Mandap Decoration",
      "Stage Decoration",
      "Reception Decoration",
      "Haldi Decoration",
      "Mehendi Decoration",
      "Sangeet Decoration",
      "Balloon Decoration",
      "LED Decoration",
      "Theme Decoration",
      "Entry Decoration",
      "Ceiling Decoration",
      "Luxury Decoration",
      "Traditional Decoration",
    ],
  },
  {
    title: "Photography Services",
    links: [
      "Wedding Photography",
      "Candid Photography",
      "Traditional Photography",
      "Cinematic Photography",
      "Pre Wedding Shoot",
      "Post Wedding Shoot",
      "Drone Photography",
      "Wedding Film",
      "Teaser Video",
      "Couple Shoot",
      "Family Photography",
      "Live Streaming",
    ],
  },
  {
    title: "Makeup & Beauty",
    links: [
      "Bridal Makeup",
      "Groom Makeup",
      "Airbrush Makeup",
      "HD Makeup",
      "Engagement Makeup",
      "Reception Makeup",
      "Party Makeup",
      "Hair Styling",
      "Saree Draping",
      "Nail Art",
      "Groom Styling",
    ],
  },
  {
    title: "Mehendi Services",
    links: [
      "Bridal Mehendi",
      "Family Mehendi",
      "Arabic Mehendi",
      "Rajasthani Mehendi",
      "Indo Arabic Mehendi",
      "Contemporary Mehendi",
      "Glitter Mehendi",
    ],
  },
  {
    title: "Catering Services",
    links: [
      "North Indian Catering",
      "South Indian Catering",
      "Mughlai Catering",
      "Chinese Catering",
      "Continental Catering",
      "Italian Catering",
      "Jain Food",
      "Vegan Catering",
      "Live Counters",
      "BBQ",
      "Dessert Counter",
      "Mocktail Counter",
      "Sweet Counter",
    ],
  },
  {
    title: "Entertainment",
    links: [
      "DJ",
      "Live Band",
      "Singer",
      "Celebrity Artist",
      "Choreographer",
      "Dance Group",
      "Anchor",
      "MC",
      "Puppet Show",
      "Magic Show",
      "Fireworks",
      "Live Orchestra",
    ],
  },
  {
    title: "Wedding Invitation",
    links: [
      "Printed Invitation",
      "Luxury Invitation",
      "Digital Invitation",
      "Video Invitation",
      "Acrylic Invitation",
      "Wooden Invitation",
      "Eco Friendly Invitation",
    ],
  },
  {
    title: "Bridal Wear",
    links: [
      "Bridal Lehenga",
      "Bridal Saree",
      "Designer Wear",
      "Indo Western",
      "Reception Gown",
      "Engagement Dress",
    ],
  },
  {
    title: "Groom Wear",
    links: ["Sherwani", "Suit", "Tuxedo", "Kurta", "Indo Western", "Accessories"],
  },
  {
    title: "Jewellery",
    links: [
      "Bridal Jewellery",
      "Artificial Jewellery",
      "Gold Jewellery",
      "Diamond Jewellery",
      "Rental Jewellery",
      "Groom Accessories",
    ],
  },
  {
    title: "Wedding Cakes",
    links: ["Designer Cakes", "Multi Tier Cakes", "Theme Cakes", "Customized Cakes"],
  },
  {
    title: "Gifts",
    links: [
      "Wedding Return Gifts",
      "Corporate Gifts",
      "Customized Gifts",
      "Hampers",
      "Guest Welcome Kits",
    ],
  },
  {
    title: "Transportation",
    links: [
      "Luxury Cars",
      "Vintage Cars",
      "Limousine",
      "Horse",
      "Buggy",
      "Wedding Bike",
      "Helicopter Entry",
    ],
  },
  {
    title: "Hospitality",
    links: [
      "Guest Welcome",
      "Airport Pickup",
      "Hotel Booking",
      "Guest Coordination",
      "Travel Desk",
    ],
  },
  {
    title: "Honeymoon Services",
    links: [
      "Domestic Honeymoon",
      "International Honeymoon",
      "Visa Assistance",
      "Travel Insurance",
      "Luxury Holidays",
    ],
  },
  {
    title: "Wedding Rentals",
    links: [
      "Furniture",
      "Sofa",
      "Stage",
      "Lighting",
      "LED Wall",
      "Generator",
      "Dance Floor",
      "Sound System",
    ],
  },
  {
    title: "Wedding Ritual Services",
    links: [
      "Pandit",
      "Priest",
      "Qazi",
      "Granthi",
      "Church Priest",
      "Astrology",
      "Muhurat Consultation",
    ],
  },
  {
    title: "Wedding Favors & Accessories",
    links: [
      "Wedding Hampers",
      "Welcome Boards",
      "Signages",
      "Customized Name Plates",
      "Guest Books",
      "Photo Booth",
      "Wedding Props",
    ],
  },
].map((group) => ({
  ...group,
  links: group.links.map((title) => ({
    title,
    slug: title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  })),
}));

function getMenuHref(menuTitle, slug) {
  if (menuTitle === "Wedding Destination") {
    return `/destination/${slug}`;
  }

  return `/details/${slug}`;
}

const navItems = [
  {
    title: "Venues",
    icon: "venues",
    links: venueLinks,
    image: "/images/header-menu-venues.png",
    imageAlt: "Wedding venue setup",
  },
  {
    title: "Vendors",
    icon: "vendors",
    groups: vendorMenuGroups,
    image: "/images/header-menu-vendors.png",
    imageAlt: "Wedding vendors",
  },
  {
    title: "Real Weddings",
    icon: "rings",
    links: stories,
    image: "/images/header-menu-real-weddings.png",
    imageAlt: "Real wedding celebration",
  },
  {
    title: "Wedding Destination",
    icon: "destination",
    links: destinationOptions,
    image: "/images/header-menu-destination.png",
    imageAlt: "Destination wedding venue",
  },
];

export default function Header() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Select City");
  const activeNav = navItems.find((item) => item.title === activeMenu);

  useEffect(() => {
    document.body.classList.toggle("drawer-lock", isDrawerOpen);
    return () => document.body.classList.remove("drawer-lock");
  }, [isDrawerOpen]);

  return (
    <>
    <header className="site-header border-b border-rose-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="header-top bg-[#8f1f3f] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-1.5 text-xs sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <a href="tel:+919999999999" className="font-medium hover:text-white">
              +91 99999 99999
            </a>
            <a
              href="mailto:info@wedplanners.in"
              className="hidden font-medium hover:text-white sm:inline-flex"
            >
              info@wedplanners.in
            </a>
            <button
              type="button"
              onClick={() => setIsQuoteOpen(true)}
              className="rounded-full border border-white px-3 py-1 font-semibold text-white hover:bg-white hover:text-[#8f1f3f]"
            >
              Get a Free quote
            </button>
            <CitySearch
              value={selectedCity}
              onSelect={setSelectedCity}
              buttonClassName="flex items-center gap-2 rounded-full border border-white px-3 py-1 text-left font-semibold hover:bg-white hover:text-[#8f1f3f]"
              panelClassName="w-72"
              variant="top"
            />
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link
              href="/agent"
              className="rounded-full border border-white px-3 py-1 text-white hover:bg-white hover:text-[#8f1f3f]"
            >
              Are you a vendor?
            </Link>
            <Link href="/hire-free-wedding-planner" className="hover:text-rose-100">
              Hire Free Wedding Planner
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`mobile-header-row relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8 ${
          isDrawerOpen ? "drawer-open" : ""
        }`}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/epic-logo.webp"
            alt="Epic Wedz"
            width={154}
            height={54}
            priority
            className="h-11 w-auto object-contain"
          />
        </Link>

        <nav
          className="hidden items-stretch gap-6 text-sm font-semibold text-stone-700 lg:flex"
          onWheel={() => setActiveMenu(null)}
        >
          {navItems.map((item) => (
            <div
              key={item.title}
              className="flex items-center"
              onMouseEnter={() => setActiveMenu(item.title)}
            >
              <Link
                href="#"
                className="flex items-center gap-2 py-3 hover:text-[#b61f4b]"
              >
                {item.title}
                <span className="header-chevron" aria-hidden="true" />
              </Link>
            </div>
          ))}
          <Link
            href="/luxury-wedding"
            className="flex items-center gap-2 py-3 hover:text-[#b61f4b]"
            onMouseEnter={() => setActiveMenu(null)}
          >
            Luxury Wedding
          </Link>
          <Link
            href="/saadimitra"
            className="flex items-center gap-2 py-3 hover:text-[#b61f4b]"
            onMouseEnter={() => setActiveMenu(null)}
          >
            SaadiMitra
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 py-3 hover:text-[#b61f4b]"
            onMouseEnter={() => setActiveMenu(null)}
          >
            Marketplace
          </Link>
        </nav>

        <div
          onMouseEnter={() => activeNav && setActiveMenu(activeNav.title)}
          className={`absolute left-1/2 top-full z-50 w-[760px] -translate-x-1/2 transition duration-150 ${
            activeNav
              ? "pointer-events-auto visible translate-y-0 opacity-100"
              : "pointer-events-none invisible translate-y-2 opacity-0"
          }`}
        >
          <div className={`grid gap-4 rounded border border-rose-100 bg-white p-3 shadow-2xl ${
            activeNav?.groups
              ? "w-[980px] max-w-[calc(100vw-2rem)] sm:grid-cols-[1fr_230px]"
              : "sm:grid-cols-[1fr_220px]"
          }`}>
            <div className={`content-start ${
              activeNav?.groups
                ? "header-mega-scroll grid max-h-[62vh] gap-x-5 gap-y-4 overflow-y-auto pr-1 sm:grid-cols-3"
                : "grid gap-1 sm:grid-cols-2"
            }`}>
              {activeNav?.groups
                ? activeNav.groups.map((group) => (
                    <div key={group.title}>
                      <p className="px-3 pb-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#b61f4b]">
                        {group.title}
                      </p>
                      <div className="grid gap-0.5">
                        {group.links.map((link) => (
                          <Link
                            key={link.slug}
                            href={getMenuHref(activeNav.title, link.slug)}
                            onClick={() => setActiveMenu(null)}
                            className="rounded px-3 py-1.5 text-xs font-bold leading-5 text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"
                          >
                            {link.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                : activeNav?.links.map((link) => (
                    <Link
                      key={link.slug}
                      href={getMenuHref(activeNav.title, link.slug)}
                      onClick={() => setActiveMenu(null)}
                      className="rounded px-3 py-2 text-sm font-bold leading-5 text-stone-800 hover:bg-rose-50 hover:text-[#b61f4b]"
                    >
                      {link.title}
                    </Link>
                  ))}
            </div>
            <div className="relative hidden h-full min-h-48 overflow-hidden rounded sm:block">
              {activeNav?.image ? (
                <Image
                  src={activeNav.image}
                  alt={activeNav.imageAlt}
                  fill
                  sizes="220px"
                  className="object-cover object-center"
                />
              ) : null}
            </div>
          </div>
        </div>

        <CitySearch
          value={selectedCity}
          onSelect={setSelectedCity}
          buttonClassName="mobile-city-button"
          panelClassName="w-72 max-w-[calc(100vw-1rem)]"
          align="right"
          variant="mobile"
        />

        <div
          className="header-login-wrap relative flex items-center gap-2"
          onMouseLeave={() => setIsLoginOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLoginOpen((open) => !open)}
            className="flex items-center justify-center gap-2 rounded-full border border-[#b61f4b] px-4 py-2 text-sm font-semibold leading-none text-[#b61f4b] hover:bg-rose-50"
          >
            <span className="login-icon" aria-hidden="true" />
            <span className="inline-flex h-4 items-center">Login</span>
            <span className="header-chevron shrink-0" aria-hidden="true" />
          </button>
          <div
            className={`login-dropdown-panel absolute right-0 top-full transition duration-150 ${
              isLoginOpen
                ? "pointer-events-auto visible translate-y-0 opacity-100"
                : "pointer-events-none invisible translate-y-2 opacity-0"
            }`}
          >
            <div className="login-dropdown-head">
              <span className="login-dropdown-avatar" aria-hidden="true">
                <span className="login-icon" />
              </span>
              <div>
                <p>Welcome to Epic Wedz</p>
                <span>Access your wedding account</span>
              </div>
            </div>
            <Link
              href="/user/login"
              onClick={() => setIsLoginOpen(false)}
              className="login-menu-link"
            >
              <span className="login-menu-icon user-login-icon" aria-hidden="true" />
              <span>
                <strong>User Login</strong>
                <small>Continue planning your wedding</small>
              </span>
            </Link>
            <Link
              href="/user/sign-up"
              onClick={() => setIsLoginOpen(false)}
              className="login-menu-link"
            >
              <span className="login-menu-icon signup-icon" aria-hidden="true" />
              <span>
                <strong>User Sign up</strong>
                <small>Create a wedding account</small>
              </span>
            </Link>
            <Link
              href="/partner"
              onClick={() => setIsLoginOpen(false)}
              className="login-menu-link"
            >
              <span className="login-menu-icon partner-icon" aria-hidden="true" />
              <span>
                <strong>Become a partner</strong>
                <small>Join as a vendor or planner</small>
              </span>
            </Link>
          </div>
        </div>

        <button
          type="button"
          aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsDrawerOpen((open) => !open)}
          className="hamburger-button"
        >
          <span className={isDrawerOpen ? "is-open" : ""} />
        </button>
      </div>
    </header>
    <div className="mobile-header-spacer" aria-hidden="true" />
    {isDrawerOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="mobile-drawer-scrim"
          onClick={() => setIsDrawerOpen(false)}
        />
      ) : null}
      <div
        className={`mobile-drawer ${isDrawerOpen ? "drawer-open" : ""}`}
      >
        <div className="mobile-drawer-inner">
          <p className="mobile-drawer-kicker">Explore</p>
          <div className="mobile-drawer-menu">
            {navItems.map((item) => (
              <details key={item.title} className="mobile-drawer-group">
                <summary>
                  <span>{item.title}</span>
                  <span className="header-chevron" aria-hidden="true" />
                </summary>
                <div className="mobile-drawer-submenu">
                  {item.groups
                    ? item.groups.map((group) => (
                        <div key={group.title} className="grid gap-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.06em] text-[#b61f4b]">
                            {group.title}
                          </p>
                          {group.links.map((link) => (
                            <Link
                              key={link.slug}
                              href={getMenuHref(item.title, link.slug)}
                              onClick={() => setIsDrawerOpen(false)}
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      ))
                    : item.links.map((link) => (
                        <Link
                          key={link.slug}
                          href={getMenuHref(item.title, link.slug)}
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          {link.title}
                        </Link>
                      ))}
                </div>
              </details>
            ))}
            <Link
              href="/luxury-wedding"
              onClick={() => setIsDrawerOpen(false)}
              className="mobile-drawer-link"
            >
              Luxury Wedding
            </Link>
            <Link
              href="/saadimitra"
              onClick={() => setIsDrawerOpen(false)}
              className="mobile-drawer-link"
            >
              SaadiMitra
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsDrawerOpen(false)}
              className="mobile-drawer-link"
            >
              Marketplace
            </Link>
          </div>
          <p className="mobile-drawer-kicker mobile-drawer-more">More</p>
          <div className="mobile-drawer-actions">
            <a href="tel:+919999999999">+91 99999 99999</a>
            <a href="mailto:info@wedplanners.in">info@wedplanners.in</a>
            <Link href="/agent" onClick={() => setIsDrawerOpen(false)}>
              Are you a vendor?
            </Link>
            <Link href="/hire-free-wedding-planner" onClick={() => setIsDrawerOpen(false)}>
              Hire Free Wedding Planner
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsQuoteOpen(true);
              setIsDrawerOpen(false);
            }}
            className="mobile-drawer-quote"
          >
            Get a Free quote
          </button>
        </div>
      </div>
      <QuoteModal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
    </>
  );
}
