import { useEffect, useState } from "react";
import MainApi from "@/util/MainApi";
import Image from "next/image";
import VendorBusinessDetails from "@/components/vendor/VendorBusinessDetails";
import { normalizeVendorDetail } from "@/util/marketplaceVendors.mjs";

function statusClass(value) {
  const status = String(value || "").trim().toUpperCase();
  if (["APPROVED", "APPROVEL", "ACTIVE", "COMPLETE", "COMPLETED", "VERIFIED"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["REJECTED", "INACTIVE", "SUSPENDED"].includes(status)) return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export default function BusinessProfileStatus() {
  const [profile, setProfile] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    MainApi.get("/vendor/profile", { signal: controller.signal }).then((response) => {
      setProfile(response.data?.data || response.data || {});
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, []);

  const vendor = profile?.businessName ? normalizeVendorDetail({ data: profile }, { slug: "wedding-services", image: "" }) : null;

  return <><section aria-label="Business verification status" aria-live="polite" className="grid gap-3 md:grid-cols-2">
    {[["KYC status", profile?.kycStatus], ["Profile status", profile?.profileStatus]].map(([label, value]) => <article key={label} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-700">{label}</h2>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${value ? statusClass(value) : "bg-stone-100 text-stone-600"}`}>{value ? String(value).replaceAll("_", " ") : failed ? "Unavailable" : profile ? "Not provided" : "Loading..."}</span>
    </article>)}
  </section>{vendor && <section aria-label="Business profile" className="mt-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center gap-4">
      {vendor.hasImage ? <Image src={vendor.image} alt={`${vendor.name} logo`} width={80} height={80} unoptimized className="h-20 w-20 rounded-lg object-cover" /> : <div aria-label="No business logo" className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-rose-50 text-3xl font-bold text-[#8f1f3f]">{vendor.name.charAt(0).toUpperCase()}</div>}
      <div><h2 className="text-xl font-semibold text-stone-900">{vendor.name}</h2><p className="mt-1 text-sm text-stone-500">{[vendor.city, vendor.stateName, vendor.countryCode].filter(Boolean).join(", ")}</p></div>
    </div>
    <p className="mb-4 whitespace-pre-line text-sm leading-7 text-stone-600">{vendor.about || "No business description added yet."}</p>
    <VendorBusinessDetails vendor={vendor} />
  </section>}</>;
}
