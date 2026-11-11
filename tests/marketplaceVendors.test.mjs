import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVendorDetail, normalizeVendorList, fetchVendorDirectory, vendorDirectoryCount } from "../src/util/marketplaceVendors.mjs";
import http from 'node:http';
import { once } from 'node:events';
import axios from 'axios';
const category = { slug: "wedding-photographers", image: "/fallback.png" };

test('directory summary shows only the total business profile count', () => {
  assert.equal(vendorDirectoryCount({ businesses: 800, vendors: 4 }), '800 total business profiles');
  assert.equal(vendorDirectoryCount({ businesses: 0, vendors: 0 }), '0 total business profiles');
  assert.equal(vendorDirectoryCount({ vendors: 1 }), 'Total business profiles unavailable');
});

test('business totals support nested metadata and alternative count fields', () => {
  const result = normalizeVendorList({ data: { businesses: [], meta: { pagination: { totalCount: 800, page: 2, totalPages: 40 } } } }, category, 2, 'businesses');
  assert.equal(result.pagination.total, 800);
  assert.equal(result.pagination.hasNextPage, true);
});

test('business list and detail map the verified public response fields', () => {
  const record = { id: 'business-one', slug: 'noida-planner', businessName: 'Noida Planner', category: 'Wedding planner', website: 'https://example.com/', address: 'Greater Noida, Noida', city: 'Noida', state: 'Uttar Pradesh', rating: '4.7', reviewCount: 47 };
  const vendor = normalizeVendorList({ data: { businesses: [record], pagination: { total: 1 } } }, category, 1, 'businesses').vendors[0];
  assert.equal(vendor.name, 'Noida Planner');
  assert.equal(vendor.area, 'Greater Noida, Noida');
  assert.equal(vendor.stateName, 'Uttar Pradesh');
  assert.equal(vendor.rating, 4.7);
  assert.equal(vendor.ratings, 47);
  assert.equal(vendor.website, 'https://example.com/');
  assert.equal(vendor.resource, 'businesses');
  assert.deepEqual(normalizeVendorDetail({ data: record }, category, 'businesses'), vendor);
});

test('directory combines both APIs over HTTP, keeps city query formats and paginates each source', async (t) => {
  const requests = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push(url);
    const page = Number(url.searchParams.get('page'));
    const businesses = url.pathname.endsWith('/businesses');
    const records = page === 1 ? (businesses ? [
      { id: 'same-business', slug: 'shared-studio', businessName: 'Duplicate Studio' },
      { id: 'business-2', slug: 'new-studio', businessName: 'New Studio', primaryCity: { name: 'Noida' } },
    ] : [{ userId: 'vendor-1', slug: 'shared-studio', businessName: 'Existing Studio' }]) : businesses ? [
      { id: 'business-3', businessName: 'Another Studio' },
    ] : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: {
      [businesses ? 'businesses' : 'vendors']: records,
      pagination: { page, total: businesses ? 3 : 1, totalPages: businesses ? 2 : 1, hasNextPage: businesses && page === 1 },
    } }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const api = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}/api/v1`, proxy: false });
  const options = { includeBusinesses: true, filters: { cityId: 'city-noida', city: ' Noida ', search: 'studio', serviceCategoryId: 'photo', offeringKind: 'SERVICE' } };
  const first = await fetchVendorDirectory(api, category, options);
  assert.deepEqual(first.vendors.map((vendor) => vendor.name), ['Existing Studio', 'New Studio']);
  assert.equal(first.vendors[1].city, 'Noida');
  assert.equal(first.pagination.hasNextPage, true);
  assert.equal(first.pagination.total, null); // The sources can overlap across pages.
  assert.deepEqual(first.sourceTotals, { vendors: 1, businesses: 3 });
  assert.equal(first.warning, '');
  const vendorRequest = requests.find((url) => url.pathname.endsWith('/vendors'));
  const businessRequest = requests.find((url) => url.pathname.endsWith('/businesses'));
  assert.equal(vendorRequest.pathname, '/api/v1/marketplace/vendors');
  assert.equal(vendorRequest.searchParams.get('cityId'), 'city-noida');
  assert.equal(businessRequest.searchParams.get('city'), 'Noida');
  assert.equal(businessRequest.searchParams.has('cityId'), false);
  assert.equal(businessRequest.searchParams.get('limit'), '20');
  assert.deepEqual(Object.fromEntries(businessRequest.searchParams), { page: '1', limit: '20', city: 'Noida' });
  const second = await fetchVendorDirectory(api, category, { ...options, page: 2 });
  assert.deepEqual(second.vendors.map((vendor) => vendor.name), ['Another Studio']);
  assert.equal(second.pagination.hasNextPage, false);
  assert.equal(second.pagination.hasPrevPage, true);
  assert.deepEqual(second.sourceTotals, { vendors: 1, businesses: 3 });
  assert.ok(requests.slice(2).every((url) => url.searchParams.get('page') === '2'));
});

test('directory preserves a working source, rejects total failure, and cancels stale results', async () => {
  const api = { get: async (path) => {
    if (path.endsWith('/businesses')) throw new Error('Unavailable');
    return { data: { data: { vendors: [{ id: 'one', businessName: 'Available vendor' }], pagination: { total: 1 } } } };
  } };
  const partial = await fetchVendorDirectory(api, category, { includeBusinesses: true });
  assert.equal(partial.vendors[0].name, 'Available vendor');
  assert.ok(partial.warning);
  assert.equal(partial.pagination.total, null);
  assert.deepEqual(partial.sourceTotals, { vendors: 1 });
  const businessOnly = await fetchVendorDirectory({ get: async (path) => {
    if (path.endsWith('/vendors')) throw new Error('Unavailable');
    return { data: { data: { businesses: [{ businessName: 'Available business' }] } } };
  } }, category, { includeBusinesses: true });
  assert.equal(businessOnly.vendors[0].name, 'Available business');
  assert.ok(businessOnly.warning);
  await assert.rejects(fetchVendorDirectory({ get: async () => { throw new Error('Unavailable'); } }, category, { includeBusinesses: true }), /Unavailable/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchVendorDirectory(api, category, { includeBusinesses: true, signal: controller.signal }), /cancelled/);
  const original = await fetchVendorDirectory(api, category);
  assert.equal(original.warning, '');
  assert.equal(original.pagination.total, 1);
  assert.equal(original.pagination.hasNextPage, false);
});

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
