import { useEffect, useState } from "react";
import MainApi from "@/util/MainApi";
import { normalizeVendorDetail, normalizeVendorList } from "@/util/marketplaceVendors.mjs";
import { requestVendorDetail } from "@/util/requestVendorDetail.mjs";
import { getAccessToken, getAuthUser } from "@/util/authSession";

export default function useMarketplaceVendors(category, { page = 1, slug, filters = {}, enabled = true } = {}) {
  const [attempt, setAttempt] = useState(0);
  const { search, cityId, serviceCategoryId, serviceSubcategoryId, offeringKind } = filters;
  const filterKey = JSON.stringify(filters);
  const key = `${category.slug}:${slug || page}:${filterKey}:${attempt}`;
  const [state, setState] = useState({ key: "", loading: true });

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const detail = slug !== undefined;
    const role = String(getAuthUser()?.role || window.localStorage.getItem("epic_auth_role") || "").trim().toUpperCase();
    const request = detail ? requestVendorDetail((...args) => MainApi.get(...args), slug, {
      signal: controller.signal,
      allowOwnProfile: Boolean(getAccessToken()) && (!role || ["VENDOR", "AGENT"].includes(role)),
    }) : MainApi.get("/marketplace/vendors", {
      signal: controller.signal,
      params: {
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(cityId ? { cityId } : {}),
        ...(serviceCategoryId ? { serviceCategoryId } : {}),
        ...(serviceSubcategoryId ? { serviceSubcategoryId } : {}),
        ...(offeringKind ? { offeringKind } : {}),
      },
    });
    request.then(({ data }) => {
      if (controller.signal.aborted) return;
      if (data?.success === false) throw new Error("Vendor request failed.");
      const result = detail ? { vendor: normalizeVendorDetail(data, category) } : normalizeVendorList(data, category, page);
      setState({ key, loading: false, ...result });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setState({ key, loading: false, notFound: detail && error.response?.status === 404, error: detail ? "Unable to load this business profile. Please try again." : "Unable to load vendors. Please try again." });
    });
    return () => controller.abort();
  }, [category, cityId, enabled, filterKey, key, offeringKind, page, search, serviceCategoryId, serviceSubcategoryId, slug]);

  return { ...(enabled && state.key === key ? state : { loading: enabled }), retry: () => setAttempt((value) => value + 1) };
}
