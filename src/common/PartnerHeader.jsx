import Image from "next/image";
import Link from "next/link";
import HeaderAccountMenu from "@/components/common/HeaderAccountMenu";

const menuItems = [
  { label: "Overview", href: "#overview" },
  { label: "How It Works", href: "#workflow" },
  { label: "Benefits", href: "#benefits" },
  { label: "Vendors", href: "#vendors" },
  { label: "Clients", href: "#clients" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Join", href: "#join" },
  { label: "KYC", href: "/kyc" },
];

export default function PartnerHeader() {

  return (
    <header className="agent-header border-b border-[#f2d4dd] bg-white/95 shadow-sm backdrop-blur">
      <div className="bg-[#421321] py-1.5 text-xs font-bold text-white">
        <marquee behavior="scroll" direction="left" scrollamount="5">
          Grow your wedding business with Epic Wedz - Get verified leads, manage vendor inquiries, complete KYC, and connect with couples planning their dream wedding.
        </marquee>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/epic-logo-new.png"
            alt="Epic Wedz"
            width={148}
            height={52}
            priority
            className="h-11 w-auto object-contain"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-stone-700 lg:flex">
          {menuItems.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[#b61f4b]">
              {item.label}
            </a>
          ))}
        </nav>

        <HeaderAccountMenu variant="partner" />
      </div>
      <nav className="agent-mobile-nav flex gap-3 overflow-x-auto border-t border-rose-100 px-4 py-2 text-xs font-bold text-stone-700 lg:hidden">
        {menuItems.map((item) => (
          <a key={item.href} href={item.href} className="shrink-0 rounded-full border border-rose-100 px-3 py-1.5">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
