const resources = new Set(["cities", "service-categories", "service-subcategories"]);

export function publicCatalogUrl(path, params = {}) {
  const resource = path.replace(/^\//, "");
  if (!resources.has(resource)) throw new Error("Unsupported public catalog.");
  const query = new URLSearchParams();
  for (const key of ["page", "limit", "serviceCategoryId"]) {
    if (params[key] !== undefined) query.set(key, String(params[key]));
  }
  return `/api/catalog/${resource}${query.size ? `?${query}` : ""}`;
}

export async function getPublicCatalog(path, { signal, params } = {}) {
  const response = await fetch(publicCatalogUrl(path, params), { signal, cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data?.success === false) throw new Error(data?.message || "Unable to load options.");
  return { data };
}

export function vendorSearchHref(category, city = "") {
  const slug = category?.slug || category?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pathname = slug ? `/vendors/${encodeURIComponent(slug)}` : "/vendors";
  const query = new URLSearchParams();
  if (category?.id) query.set("serviceCategoryId", category.id);
  if (category?.name) query.set("categoryName", category.name);
  if (city && typeof city === "object") {
    if (city.id) query.set("cityId", city.id);
    if (city.name) query.set("city", city.name);
  } else if (city && city !== "Select city") {
    query.set("city", city);
  }
  if (category) query.set("offeringKind", category.offeringKind || "SERVICE");
  return query.size ? `${pathname}?${query}` : pathname;
}
