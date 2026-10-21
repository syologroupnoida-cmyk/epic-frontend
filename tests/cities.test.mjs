import assert from "node:assert/strict";
import test from "node:test";
import { filterCities, loadAllCities, normalizeCity } from "../src/util/cities.mjs";
import { loadPublicServiceCategories } from "../src/util/serviceCategories.mjs";

test("city lists include every page returned by the cities API", async () => {
  const calls = [];
  const cities = await loadAllCities(async (url, { params }) => {
    calls.push(url);
    return { data: { success: true, data: {
      cities: [{ id: `city-${params.page}`, name: `City ${params.page}`, stateName: "UP", countryCode: "IN" }],
      pagination: { page: params.page, totalPages: 3 },
    } } };
  });
  assert.deepEqual(cities.map((city) => city.name), ["City 1", "City 2", "City 3"]);
  assert.ok(calls.every((url) => url === "/cities"));
});

test("accepts an API array response without replacing it with fallback cities", async () => {
  const cities = await loadAllCities(async () => ({ data: { success: true, data: [
    { cityId: "bijnor", cityName: "Bijnor", state: "UP", country: "IN" },
  ] } }));
  assert.equal(cities.length, 1);
  assert.equal(cities[0].label, "Bijnor, UP");
});

test("city search matches city, state, and country and clearing returns the entire list", () => {
  const cities = [normalizeCity({ id: "1", name: "Bijnor", stateName: "UP", countryCode: "IN" }), normalizeCity({ id: "2", name: "Jaipur", state: { name: "Rajasthan" }, country: { code: "IN" } })];
  assert.deepEqual(filterCities(cities, "  BIJ ").map((city) => city.id), ["1"]);
  assert.equal(filterCities(cities, "rajasthan")[0].name, "Jaipur");
  assert.equal(filterCities(cities, "IN").length, 2);
  assert.equal(filterCities(cities, "").length, 2);
  assert.equal(filterCities(cities, "Unknown city").length, 0);
});

test("empty city lists stay empty and API errors are not hidden by sample options", async () => {
  assert.deepEqual(await loadAllCities(async () => ({ data: { data: [] } })), []);
  await assert.rejects(loadAllCities(async () => ({ data: { success: false, message: "Cities unavailable" } })), /Cities unavailable/);
});

test("homepage category loader uses the public endpoint and supports array data with root pagination", async () => {
  const categories = await loadPublicServiceCategories(async (url, { params }) => {
    assert.equal(url, "/service-categories");
    return { data: { data: [{ id: `category-${params.page}`, name: `Category ${params.page}` }], pagination: { page: params.page, totalPages: 2 } } };
  });
  assert.deepEqual(categories.map((category) => category.name), ["Category 1", "Category 2"]);
});
