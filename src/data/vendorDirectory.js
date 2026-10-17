import photography from "@/images/category-photography.png";
import decor from "@/images/category-decor.png";
import catering from "@/images/category-catering.png";
import makeup from "@/images/category-makeup.png";
import mehendi from "@/images/category-mehendi.png";
import planning from "@/images/blog-planning.png";
import { weddingCategories } from "@/data/weddingCategories.mjs";

export function getVendorCategory(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90) return null;
  const service = weddingCategories.flatMap((category) => category.services).find((item) => item.slug === slug);
  const title = service?.name || weddingCategories.find((category) => category.slug === slug)?.name || slug.split("-").map((word) => word === "dj" ? "DJ" : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const image = /photo|video|shoot|film/.test(slug) ? photography
    : /decor|floris|flower|tent/.test(slug) ? decor
    : /cater|food|counter|bbq|cake/.test(slug) ? catering
    : /makeup|beauty|hair|styling/.test(slug) ? makeup
    : /mehendi/.test(slug) ? mehendi : planning;
  return { slug, title, image };
}

export function vendorHref(vendor) {
  return vendor.slug ? `/vendors/${encodeURIComponent(vendor.categorySlug)}/${encodeURIComponent(vendor.slug)}` : null;
}

export function formatVendorPrice(price) {
  return price === null || price === undefined ? "Price on request" : `₹${price.toLocaleString("en-IN")}`;
}
