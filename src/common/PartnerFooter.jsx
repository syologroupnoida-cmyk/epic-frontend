import Image from "next/image";
import Link from "next/link";
import { brandTagline } from "@/data/homeData";

export default function PartnerFooter() {
  return (
    <footer className="bg-[#2a1119] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/partner" className="inline-flex rounded bg-white px-3 py-2">
            <Image
              src="/images/epic-logo.webp"
              alt="Epic Wedz"
              width={142}
              height={50}
              className="h-11 w-auto object-contain"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-rose-100/80">
            Epic - {brandTagline}
          </p>
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold">Partner Links</h3>
          <div className="mt-4 grid gap-2 text-sm text-rose-100/80">
            <Link href="/agent/login" className="hover:text-white">Login</Link>
            <Link href="/agent/sign-up" className="hover:text-white">Sign up</Link>
            <Link href="/kyc" className="hover:text-white">KYC form</Link>
            <a href="#workflow" className="hover:text-white">How it works</a>
            <a href="#vendors" className="hover:text-white">Vendor network</a>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold">Support</h3>
          <div className="mt-4 grid gap-2 text-sm text-rose-100/80">
            <a href="tel:+919999999999" className="hover:text-white">+91 99999 99999</a>
            <a href="mailto:info@wedplanners.in" className="hover:text-white">info@wedplanners.in</a>
            <span>Epic Wedz Partner Desk</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-rose-100/70">
        Copyright 2026 Epic Wedz. All rights reserved.
      </div>
    </footer>
  );
}
