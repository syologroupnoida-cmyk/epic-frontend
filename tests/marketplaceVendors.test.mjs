import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVendorDetail, normalizeVendorList } from "../src/util/marketplaceVendors.mjs";
const category = { slug: "wedding-photographers", image: "/fallback.png" };

test("live listing envelope handles an empty directory without sample records", () => {
  const result = normalizeVendorList({ success: true, data: { vendors: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false } } }, category);
  assert.deepEqual(result.vendors, []);
  assert.equal(result.pagination.total, 0);
  assert.equal(result.pagination.hasNextPage, false);
});
test("maps API business fields and slug without inventing prices or ratings", () => {
  const { vendors, pagination } = normalizeVendorList({ data: { vendors: [{ id: "db-id", vendorSlug: "real-studio", businessName: "Real Studio", primaryCity: { name: "Delhi" }, capabilities: [{ service: { name: "Wedding Photography" } }], kycStatus: "APPROVED" }], pagination: { page: 2, total: 21, totalPages: 2 } } }, category, 2);
  assert.equal(vendors[0].slug, "real-studio");
  assert.equal(vendors[0].city, "Delhi");
  assert.deepEqual(vendors[0].services, ["Wedding Photography"]);
  assert.equal(vendors[0].verified, true);
  assert.equal(vendors[0].price, null);
  assert.equal(vendors[0].rating, null);
  assert.equal(pagination.hasPrevPage, true);
  assert.equal(pagination.hasNextPage, false);
});
test("detail preserves zero prices and rejects invalid images and numeric values", () => {
  const vendor = normalizeVendorDetail({ data: { vendor: { businessName: "Studio", slug: "studio", startingPrice: 0, rating: "bad", logoUrl: "javascript:alert(1)", about: "Real description" } } }, category);
  assert.equal(vendor.price, 0);
  assert.equal(vendor.rating, null);
  assert.equal(vendor.image, category.image);
  assert.equal(vendor.about, "Real description");
});
test("invalid API envelopes are errors rather than empty results", () => {
  assert.throws(() => normalizeVendorList({ data: {} }, category));
  assert.throws(() => normalizeVendorDetail({ data: null }, category));
});

test("vendor profile response keeps approved KYC separate from draft profile status", () => {
  const vendor = normalizeVendorDetail({ success: true, data: {
    userId: "VEND-566732", kycStatus: "APPROVED", profileStatus: "DRAFT",
    businessName: "Transport", slug: "transport-vend-566732", about: "Description..",
    logoUrl: null, logoPublicId: null,
    primaryCity: { id: "city-id", name: "Bijnor", slug: "bijnor-up-in", stateName: "UP", countryCode: "IN" },
    createdAt: "2026-10-15T06:59:57.953Z", updatedAt: "2026-10-15T13:28:32.160Z",
  } }, category);
  assert.equal(vendor.id, "VEND-566732");
  assert.equal(vendor.userId, "VEND-566732");
  assert.equal(vendor.slug, "transport-vend-566732");
  assert.equal(vendor.name, "Transport");
  assert.equal(vendor.about, "Description..");
  assert.equal(vendor.city, "Bijnor");
  assert.equal(vendor.stateName, "UP");
  assert.equal(vendor.countryCode, "IN");
  assert.equal(vendor.verified, true);
  assert.equal(vendor.kycStatus, "APPROVED");
  assert.equal(vendor.profileStatus, "DRAFT");
  assert.equal(vendor.hasImage, false);
  assert.equal(vendor.updatedAt, "2026-10-15T13:28:32.160Z");
  assert.equal(vendor.price, null);
  assert.equal(vendor.rating, null);
  assert.deepEqual(vendor.services, []);
});
