import { useEffect, useState, useSyncExternalStore } from "react";
import MainApi from "@/util/MainApi";
import { getAccessToken, getAuthUser } from "@/util/authSession";
import { normalizeVendorDetail } from "@/util/marketplaceVendors.mjs";
import { vendorLocation } from "@/components/vendor/VendorBusinessDetails";
import Link from "next/link";
import { vendorHref } from "@/data/vendorDirectory";
import VendorImage from "@/components/vendor/VendorImage";
import VendorActions from "@/components/vendor/VendorActions";
import VendorEnquiryModal from "@/components/vendor/VendorEnquiryModal";
import VendorServiceChips from "@/components/vendor/VendorServiceChips";

function subscribe(callback) {
  window.addEventListener("epic-auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("epic-auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function sessionSnapshot() {
  const token = getAccessToken();
  const role = String(getAuthUser()?.role || window.localStorage.getItem("epic_auth_role") || "").trim().toUpperCase();
  // Older sessions can have a token without a stored role. The authenticated
  // profile endpoint remains the authority on whether this is a vendor account.
  return token && (!role || ["VENDOR", "AGENT"].includes(role)) ? token : "";
}

export default function OwnVendorCard({ category, publicVendors = [], fallback = null }) {
  const session = useSyncExternalStore(subscribe, sessionSnapshot, () => "");
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    Promise.allSettled([
      MainApi.get("/vendor/profile", { signal: controller.signal }),
      MainApi.get("/vendor/capabilities", { signal: controller.signal }),
    ]).then(([profileResult, capabilitiesResult]) => {
      if (controller.signal.aborted) return;
      if (profileResult.status === "rejected") throw profileResult.reason;
      const { data } = profileResult.value;
      if (data?.success === false) throw new Error("Profile request failed.");
      const profile = data?.data || data;
      const capabilityData = capabilitiesResult.status === "fulfilled" ? capabilitiesResult.value.data?.data ?? capabilitiesResult.value.data : null;
      const capabilities = Array.isArray(capabilityData) ? capabilityData : capabilityData?.capabilities || capabilityData?.items || [];
      setResult({ session, attempt, vendor: normalizeVendorDetail({ ...profile, capabilities: [...(Array.isArray(profile.capabilities) ? profile.capabilities : []), ...capabilities] }, category) });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ session, attempt, error: true });
    });
    return () => controller.abort();
  }, [session, category, attempt]);

  if (!session) return fallback;
  const current = result?.session === session && result?.attempt === attempt ? result : null;
  const vendor = current?.vendor;
  if (vendor && publicVendors.some((item) => (vendor.slug && item.slug === vendor.slug) || (vendor.userId && item.userId === vendor.userId))) return null;
  return <section aria-label="Your business profile">
    {!current ? <p role="status">Loading your business profile…</p> : current.error ? <div role="alert"><p>Unable to load your business profile.</p><button type="button" className="vd-profile-link mt-3" onClick={() => setAttempt((value) => value + 1)}>Try again</button></div> : <>
      <article className="vd-card vd-card-compact">
        <div className="vd-card-image"><VendorImage key={vendor.image?.src || vendor.image} vendor={vendor} category={category} fill sizes="(max-width: 600px) 104px, 180px" /></div>
        <div className="vd-card-body"><h3>{vendorHref(vendor) ? <Link className="vd-card-link" href={vendorHref(vendor)} aria-label={`View ${vendor.name} business profile`}>{vendor.name}</Link> : vendor.name}</h3><p className="vd-location">{vendorLocation(vendor) || "Location not provided"}</p><p className="vd-service vd-card-description whitespace-pre-line">{vendor.about || "Contact this business to learn more about its services."}</p>
          <VendorServiceChips services={vendor.services} />
          <VendorActions vendor={vendor} showProfile={false} onEnquire={() => setIsQuoteOpen(true)} />
        </div>
      </article>
    </>}
    <VendorEnquiryModal vendor={vendor} isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} />
  </section>;
}
