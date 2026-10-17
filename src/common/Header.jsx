import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CitySearch from "@/components/common/CitySearch";
import QuoteModal from "@/components/common/QuoteModal";
import HeaderAccountMenu from "@/components/common/HeaderAccountMenu";
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

const featuredVendorTitles = new Set([
  "Wedding Decoration",
  "Floral Decoration",
  "Candid Photography",
  "Cinematic Photography",
  "Pre Wedding Shoot",
  "Bridal Makeup",
  "HD Makeup",
  "Hair Styling",
  "Bridal Mehendi",
  "Arabic Mehendi",
  "North Indian Catering",
  "Live Counters",
  "DJ",
  "Live Band",
  "Printed Invitation",
  "Digital Invitation",
  "Bridal Lehenga",
  "Sherwani",
  "Bridal Jewellery",
  "Designer Cakes",
  "Wedding Return Gifts",
  "Luxury Cars",
  "Guest Welcome",
  "Honeymoon Services",
]);

const vendorLinks = vendorMenuGroups
  .flatMap((group) => group.links)
  .filter((link) => featuredVendorTitles.has(link.title));

const vendorMegaPrimary = [
  { title: "Wedding Photographers", slug: "wedding-photographers", icon: "camera" },
  { title: "Wedding Videography", slug: "wedding-videography", icon: "video" },
  { title: "Wedding Music", slug: "wedding-music", icon: "music" },
  { title: "Caterers", slug: "caterers", icon: "catering" },
  { title: "Wedding Transportation", slug: "wedding-transportation", icon: "transport" },
  { title: "Wedding Invitations", slug: "wedding-invitations", icon: "invitation" },
  { title: "Wedding Gifts", slug: "wedding-gifts", icon: "gift" },
  { title: "Florists", slug: "florists", icon: "florist" },
  { title: "Wedding Planners", slug: "wedding-planners", icon: "planner" },
];

const vendorMegaSecondary = [
  { title: "Wedding Choreographers", slug: "wedding-choreographers" },
  { title: "Photobooth", slug: "photobooth" },
  { title: "Wedding DJ", slug: "wedding-dj" },
  { title: "Wedding Cakes", slug: "wedding-cakes" },
  { title: "Wedding Decorators", slug: "wedding-decorators" },
  { title: "Party Places", slug: "party-places" },
  { title: "Honeymoon", slug: "honeymoon" },
  { title: "Wedding Entertainment", slug: "wedding-entertainment" },
  { title: "Tent House", slug: "tent-house" },
  { title: "Promotions", slug: "promotions" },
];

function getMenuHref(menuTitle, slug) {
  if (menuTitle === "Wedding Vendors") {
    return `/vendors/${slug}`;
  }

  if (menuTitle === "Destination Wedding") {
    return `/destination/${slug}`;
  }

  return `/details/${slug}`;
}

const navItems = [
  {
    title: "Venues",
    icon: "venues",
    links: venueLinks,
  },
  {
    title: "Wedding Vendors",
    icon: "vendors",
    links: [...vendorMegaPrimary, ...vendorMegaSecondary, ...vendorLinks].filter(
      (link, index, links) => links.findIndex((item) => item.slug === link.slug) === index,
    ),
    isVendorMega: true,
  },
  {
    title: "Real Weddings",
    icon: "rings",
    links: stories,
  },
  {
    title: "Destination Wedding",
    icon: "destination",
    links: destinationOptions,
  },
];

export default function Header() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Select City");
  const activeNav = navItems.find((item) => item.title === activeMenu);
  const isCompactMenu = activeNav && !activeNav.isVendorMega && activeNav.links.length <= 6;
  const megaNav = isCompactMenu ? null : activeNav;

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
            src="/images/epic-logo-new.png"
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
              className="relative flex items-center"
              onMouseEnter={() => setActiveMenu(item.title)}
              onFocus={() => setActiveMenu(item.title)}
              onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActiveMenu(null); }}
              onKeyDown={(event) => { if (event.key === "Escape") setActiveMenu(null); }}
            >
              <Link
                href={item.title === "Wedding Vendors" ? "/vendors" : "#"}
                className="flex items-center gap-2 py-3 hover:text-[#b61f4b]"
              >
                {item.title}
                <span className="header-chevron" aria-hidden="true" />
              </Link>
              {!item.isVendorMega && item.links.length <= 6 && activeMenu === item.title && (
                <div className="header-compact-dropdown">
                  {item.links.map((link) => (
                    <Link key={link.slug} href={getMenuHref(item.title, link.slug)} onClick={() => setActiveMenu(null)}>
                      {link.title}
                    </Link>
                  ))}
                </div>
              )}
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
          onMouseEnter={() => megaNav && setActiveMenu(megaNav.title)}
          className={`absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 transition duration-150 ${
            megaNav
              ? "pointer-events-auto visible translate-y-0 opacity-100"
              : "pointer-events-none invisible translate-y-2 opacity-0"
          }`}
        >
          <div className={`rounded border border-rose-100 bg-white p-3 shadow-2xl ${
            megaNav
              ? "w-screen rounded-none border-x-0 border-t border-b border-rose-100 p-0 shadow-none"
              : ""
          }`}>
            {megaNav?.isVendorMega ? (
              <div className="header-vendor-mega">
                <div className="min-w-0">
                  <div className="header-vendor-primary">
                    {vendorMegaPrimary.map((link) => (
                      <Link
                        key={link.slug}
                        href={getMenuHref(megaNav.title, link.slug)}
                        onClick={() => setActiveMenu(null)}
                        className="header-vendor-card"
                      >
                        <span className={`header-vendor-icon vendor-${link.icon}`} aria-hidden="true" />
                        <span>{link.title}</span>
                      </Link>
                    ))}
                  </div>
                  <h3>Complete your wedding team</h3>
                  <div className="header-vendor-secondary">
                    {vendorMegaSecondary.map((link) => (
                      <Link
                        key={link.slug}
                        href={getMenuHref(megaNav.title, link.slug)}
                        onClick={() => setActiveMenu(null)}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : megaNav ? (
              <div className="header-general-mega">
                <div>
                  <h2>{megaNav.title}</h2>
                  <div className="header-general-grid">
                    {megaNav.links.map((link) => (
                        <Link
                          key={link.slug}
                          href={getMenuHref(megaNav.title, link.slug)}
                          onClick={() => setActiveMenu(null)}
                        >
                          {link.title}
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            ) : null}
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

        <HeaderAccountMenu />

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
