import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const menuItems = [
  { label: "Overview", href: "#overview" },
  { label: "How It Works", href: "#workflow" },
  { label: "Benefits", href: "#benefits" },
  { label: "Vendors", href: "#vendors" },
  { label: "Clients", href: "#clients" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Join", href: "#join" },
];

export default function AgentHeader() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <header className="agent-header border-b border-[#f2d4dd] bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/agent" className="flex items-center">
          <Image
            src="/images/epic-logo.webp"
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

        <div
          className="relative"
          onMouseLeave={() => setIsLoginOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLoginOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-[#b61f4b] px-4 py-2 text-sm font-bold text-[#b61f4b] hover:bg-rose-50"
          >
            Login
            <span className="header-chevron" aria-hidden="true" />
          </button>
          <div
            onMouseEnter={() => setIsLoginOpen(true)}
            className={`absolute right-0 top-full w-40 rounded border border-rose-100 bg-white p-2 shadow-xl transition duration-150 ${
              isLoginOpen
                ? "pointer-events-auto visible translate-y-0 opacity-100"
                : "pointer-events-none invisible translate-y-2 opacity-0"
            }`}
          >
            <Link
              href="/agent/login"
              onClick={() => setIsLoginOpen(false)}
              className="block rounded px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-rose-50 hover:text-[#b61f4b]"
            >
              Agent Login
            </Link>
            <Link
              href="/agent/sign-up"
              onClick={() => setIsLoginOpen(false)}
              className="block rounded px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-rose-50 hover:text-[#b61f4b]"
            >
              Agent Sign up
            </Link>
          </div>
        </div>
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
