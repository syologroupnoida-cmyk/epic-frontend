import { useEffect, useState } from "react";
import MainApi from "@/util/MainApi";
import { fetchVendorDirectory, normalizeVendorDetail } from "@/util/marketplaceVendors.mjs";
import { requestVendorDetail } from "@/util/requestVendorDetail.mjs";
import { getAccessToken, getAuthUser } from "@/util/authSession";

export default function useMarketplaceVendors(category, { page = 1, slug, resource = 'vendors', filters = {}, enabled = true, includeBusinesses = false } = {}) {
  const [attempt, setAttempt] = useState(0);
  const { search, cityId, city, serviceCategoryId, serviceSubcategoryId, offeringKind } = filters;
  const filterKey = JSON.stringify(filters);
  const key = `${category.slug}:${slug || page}:${resource}:${filterKey}:${includeBusinesses}:${attempt}`;
  const [state, setState] = useState({ key: "", loading: true });

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const detail = slug !== undefined;
    const role = String(getAuthUser()?.role || window.localStorage.getItem("epic_auth_role") || "").trim().toUpperCase();
    const request = detail ? requestVendorDetail((...args) => MainApi.get(...args), slug, {
      signal: controller.signal,
      resource,
      allowBusinessProfile: true,
      allowOwnProfile: Boolean(getAccessToken()) && (!role || ["VENDOR", "AGENT"].includes(role)),
    }).then(({ data, marketplaceResource }) => {
      if (data?.success === false) throw new Error("Vendor request failed.");
      return { vendor: normalizeVendorDetail(data, category, marketplaceResource) };
    }) : fetchVendorDirectory(MainApi, category, {
      signal: controller.signal,
      page,
      includeBusinesses,
      filters: { search, cityId, city, serviceCategoryId, serviceSubcategoryId, offeringKind },
    });
    request.then((result) => {
      if (controller.signal.aborted) return;
      setState({ key, loading: false, ...result });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setState({ key, loading: false, notFound: detail && error.response?.status === 404, error: detail ? "Unable to load this business profile. Please try again." : "Unable to load vendors. Please try again." });
    });
    return () => controller.abort();
  }, [category, cityId, city, enabled, filterKey, includeBusinesses, key, offeringKind, page, resource, search, serviceCategoryId, serviceSubcategoryId, slug]);

  // Waiting for router readiness is still loading. The server and the first
  // client render must show the same state, even when isReady differs.
  return { ...(enabled && state.key === key ? state : { loading: true }), retry: () => setAttempt((value) => value + 1) };
}
