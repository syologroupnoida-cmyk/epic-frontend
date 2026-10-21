import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCityResponse } from "../src/util/cities.mjs";

const records = Array.from({ length: 45 }, (_, index) => ({ id: String(index + 1), name: `City ${index + 1}`, isActive: index !== 0 }));

test("reads nested admin city pagination and enables Next until the last page", () => {
  for (const [page, length, hasNextPage] of [[1, 20, true], [2, 20, true], [3, 5, false]]) {
    const result = normalizeCityResponse({ success: true, data: {
      cities: records.slice((page - 1) * 20, page * 20),
      pagination: { total: 45, page, limit: 20, totalPages: 3, hasNextPage },
    } }, page, 20);
    assert.equal(result.cities.length, length);
    assert.equal(result.total, 45);
    assert.equal(result.totalPages, 3);
    assert.equal(result.hasNextPage, hasNextPage);
    assert.equal(result.cities[0].id, String((page - 1) * 20 + 1));
  }
});

test("limits an unpaginated full list to the selected number of rows without repeating records", () => {
  const pages = [1, 2, 3].map((page) => normalizeCityResponse({ data: records }, page, 20));
  assert.deepEqual(pages.map((page) => page.cities.length), [20, 20, 5]);
  assert.deepEqual(pages.map((page) => page.hasNextPage), [true, true, false]);
  assert.ok(pages.every((page) => page.totalPages === 3));
  assert.equal(new Set(pages.flatMap((page) => page.cities.map((city) => city.id))).size, 45);
});

test("supports changing to 50 rows and an empty city filter result", () => {
  const all = normalizeCityResponse({ data: { cities: records, pagination: { total: 45, page: 1, limit: 50, totalPages: 1, hasNextPage: false } } }, 1, 50);
  assert.equal(all.cities.length, 45);
  assert.equal(all.hasNextPage, false);
  assert.equal(all.cities[0].isActive, false);
  const empty = normalizeCityResponse({ data: { cities: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false } } }, 1, 20);
  assert.equal(empty.total, 0);
  assert.equal(empty.cities.length, 0);
  assert.equal(empty.hasNextPage, false);
});

test("supports pagination outside an array data envelope", () => {
  const result = normalizeCityResponse({ data: records.slice(0, 20), pagination: { total: 45, page: 1, limit: 20, totalPages: 3 } }, 1, 20);
  assert.equal(result.total, 45);
  assert.equal(result.hasNextPage, true);
  assert.equal(result.cities.length, 20);
});
