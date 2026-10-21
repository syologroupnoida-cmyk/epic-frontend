import assert from "node:assert/strict";
import test from "node:test";
import handler from "../src/pages/api/catalog/[resource].js";
import { getPublicCatalog, publicCatalogUrl, vendorSearchHref } from "../src/util/publicCatalog.mjs";
import { loadPublicServiceCategories } from "../src/util/serviceCategories.mjs";
import { loadAllCities } from "../src/util/cities.mjs";

function responseRecorder() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test("public dropdowns load all 22 categories and both cities through local catalog routes without auth headers", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const categoryCalls = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(input, "http://localhost");
    assert.equal(options?.headers, undefined);
    if (url.origin === "http://localhost") {
      const res = responseRecorder();
      await handler({ method: "GET", query: { resource: url.pathname.split("/").at(-1), ...Object.fromEntries(url.searchParams) } }, res);
      return { ok: res.statusCode === 200, json: async () => res.body };
    }
    assert.equal(url.origin, "https://api.wedplanners.in");
    const page = Number(url.searchParams.get("page"));
    const city = url.pathname.endsWith("/cities");
    const records = city ? [{ id: "bijnor", name: "Bijnor", stateName: "UP" }, { id: "agra", name: "Agra", stateName: "Uttar Pradesh" }] : Array.from({ length: page === 1 ? 20 : 2 }, (_, index) => ({ id: `${page}-${index}`, name: `Category ${page}-${index}`, slug: `category-${page}-${index}` }));
    if (!city) categoryCalls.push(page);
    return { status: 200, json: async () => ({ success: true, data: { [city ? "cities" : "categories"]: records, pagination: { total: city ? 2 : 22, page, limit: 20, totalPages: city ? 1 : 2, hasNextPage: !city && page === 1 } } }) };
  };
  assert.equal((await loadPublicServiceCategories(getPublicCatalog)).length, 22);
  assert.deepEqual(categoryCalls, [1, 2]);
  assert.deepEqual((await loadAllCities(getPublicCatalog)).map((city) => city.name), ["Bijnor", "Agra"]);
});

test("catalog route rejects non-public resources, writes, and invalid page sizes", async () => {
  for (const [method, query, code] of [
    ["GET", { resource: "admin" }, 404],
    ["POST", { resource: "cities" }, 405],
    ["GET", { resource: "cities", page: "0" }, 400],
    ["GET", { resource: "cities", limit: "500" }, 400],
  ]) {
    const res = responseRecorder();
    await handler({ method, query }, res);
    assert.equal(res.statusCode, code);
  }
  assert.throws(() => publicCatalogUrl("/admin/service-categories"), /Unsupported/);
});

test("search uses the API category slug and encodes the selected city", () => {
  assert.equal(vendorSearchHref({ name: "Wedding Venues", slug: "venue-services" }, "Agra"), "/vendors/venue-services?categoryName=Wedding+Venues&city=Agra&offeringKind=SERVICE");
  assert.equal(vendorSearchHref({ id: "cat-1", name: "Makeup & Beauty", offeringKind: "SERVICE" }, { id: "city-1", name: "Delhi NCR" }), "/vendors/makeup-beauty?serviceCategoryId=cat-1&categoryName=Makeup+%26+Beauty&cityId=city-1&city=Delhi+NCR&offeringKind=SERVICE");
  assert.equal(vendorSearchHref(undefined, "Select city"), "/vendors");
});
