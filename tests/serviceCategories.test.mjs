import assert from "node:assert/strict";
import test from "node:test";
import { loadAllServiceCategories, loadAllServiceSubcategories, normalizeCategoryResponse } from "../src/util/serviceCategories.mjs";

const category = (id) => ({ id: String(id), name: `Category ${id}` });

test("loads every category page using nested pagination instead of only the first page", async () => {
  const calls = [];
  const categories = await loadAllServiceCategories(async (url, { params }) => {
    calls.push({ url, ...params });
    return { data: { success: true, data: { categories: [category(params.page)], pagination: { page: params.page, totalPages: 3, hasNextPage: params.page < 3 } } } };
  });
  assert.deepEqual(categories.map((item) => item.id), ["1", "2", "3"]);
  assert.deepEqual(calls.map((item) => item.page), [1, 2, 3]);
  assert.ok(calls.every((item) => item.url === "/admin/service-categories"));
});

test("handles array data with pagination outside data and deduplicates overlapping pages", async () => {
  const records = await loadAllServiceCategories(async (_, { params }) => ({ data: {
    data: params.page === 1 ? [category(1), category(2)] : [category(2), category(3)],
    pagination: { page: params.page, limit: 2, total: 3 },
  } }));
  assert.equal(records.length, 3);
});

test("accepts an unpaginated array endpoint without looping indefinitely", async () => {
  let calls = 0;
  const records = await loadAllServiceCategories(async () => {
    calls += 1;
    return { data: Array.from({ length: 25 }, (_, index) => category(index)) };
  });
  assert.equal(records.length, 25);
  assert.equal(calls, 2);
});

test("does not silently return incomplete categories when an explicit next page repeats", async () => {
  await assert.rejects(loadAllServiceCategories(async () => ({ data: { data: {
    items: [category(1)], pagination: { hasNextPage: true },
  } } })), /next page/);
});

test("normalizes table pagination and inactive status with one record per category", () => {
  const result = normalizeCategoryResponse({ data: {
    serviceCategories: [{ ...category(1), isActive: false, subcategories: [{ id: "a", name: "Candid" }, { id: "b", name: "Traditional" }] }],
    pagination: { total: 41, page: 2, limit: 20, totalPages: 3 },
  } });
  assert.equal(result.total, 41);
  assert.equal(result.totalPages, 3);
  assert.equal(result.categories.length, 1);
  assert.equal(result.categories[0].isActive, false);
  assert.equal(result.categories[0].subcategories.length, 2);
  assert.equal(result.categories[0].subcategoriesLoaded, true);
});

test("distinguishes missing subcategories from an empty list and never invents actionable IDs", () => {
  const { categories } = normalizeCategoryResponse([category(1), { ...category(2), subcategories: [] }, { ...category(3), subcategories: ["Name only"] }]);
  assert.equal(categories[0].subcategoriesLoaded, false);
  assert.equal(categories[1].subcategoriesLoaded, true);
  assert.equal(categories[2].subcategories[0].id, "");
});

test("loads all subcategories for the selected category", async () => {
  const services = await loadAllServiceSubcategories(async (url, { params }) => {
    assert.equal(url, "/service-subcategories");
    assert.equal(params.serviceCategoryId, "photography");
    return { data: { data: { subcategories: [{ id: String(params.page), name: `Service ${params.page}` }], pagination: { hasNextPage: params.page < 2 } } } };
  }, "photography");
  assert.equal(services.length, 2);
});

test("stops requests after cancellation", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadAllServiceCategories(async () => ({ data: [] }), { signal: controller.signal }), { name: "AbortError" });
});
