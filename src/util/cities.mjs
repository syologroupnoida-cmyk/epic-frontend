import { collectionPage, loadAllOptions } from "./serviceCategories.mjs";

export function normalizeCity(city) {
  const name = city?.name || city?.cityName || "";
  const stateName = city?.stateName || city?.state?.name || (typeof city?.state === "string" ? city.state : "");
  return {
    id: city?.id || city?._id || city?.cityId || city?.slug || "",
    name,
    stateName,
    countryCode: city?.countryCode || city?.country?.code || (typeof city?.country === "string" ? city.country : ""),
    label: [name, stateName].filter(Boolean).join(", "),
  };
}

export function loadAllCities(get, options) {
  return loadAllOptions(get, "/cities", normalizeCity, options);
}

export function filterCities(cities, query) {
  const search = query.trim().toLocaleLowerCase();
  return cities.filter((city) => `${city.name} ${city.stateName} ${city.countryCode}`.toLocaleLowerCase().includes(search));
}

export function normalizeCityResponse(response, page = 1, limit = 20) {
  const result = collectionPage(response, page, limit);
  const records = result.items.map((city) => ({
    ...normalizeCity(city),
    isActive: city.isActive ?? city.active ?? false,
    createdAt: city.createdAt || city.created_at || "",
    updatedAt: city.updatedAt || city.updated_at || "",
  })).filter((city) => city.id);
  // Some API deployments return the full collection rather than a page.
  const fullCollection = records.length > limit;
  const total = Math.max(result.total, records.length);
  const cities = fullCollection ? records.slice((page - 1) * limit, page * limit) : records.slice(0, limit);
  const totalPages = fullCollection ? Math.ceil(total / limit) : Math.max(result.totalPages, Math.ceil(total / limit), result.hasNextPage ? page + 1 : 1);
  return { cities, total, page, limit, totalPages, hasNextPage: fullCollection ? page * limit < total : result.hasNextPage };
}
