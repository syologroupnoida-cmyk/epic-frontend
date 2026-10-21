export function collectionPage(response, page, limit) {
  if (response?.success === false) throw new Error(response.message || "Unable to load categories.");
  const data = response?.data ?? response ?? {};
  const items = Array.isArray(data) ? data : data.items ?? data.results ?? data.categories ?? data.serviceCategories ?? data.subcategories ?? data.serviceSubcategories ?? data.cities ?? data.data ?? [];
  const pagination = data.pagination ?? data.meta?.pagination ?? response?.pagination ?? response?.meta?.pagination ?? data.meta ?? response?.meta ?? data;
  const rawTotal = pagination.total ?? pagination.totalCount ?? pagination.count;
  const total = rawTotal === undefined ? null : Number(rawTotal);
  const currentPage = Number(pagination.page ?? pagination.currentPage ?? page);
  const pageLimit = Number(pagination.limit ?? pagination.perPage ?? limit);
  const totalPages = Number(pagination.totalPages ?? pagination.pages ?? (total !== null ? Math.ceil(total / pageLimit) : 0));
  const hasPagination = ["total", "totalCount", "count", "totalPages", "pages", "hasNextPage", "hasNext"].some((key) => pagination[key] !== undefined);
  const list = Array.isArray(items) ? items : [];
  return {
    items: list,
    total: total ?? list.length,
    page: currentPage,
    limit: pageLimit,
    totalPages: Math.max(1, totalPages),
    hasPagination,
    hasNextPage: pagination.hasNextPage ?? pagination.hasNext ?? (totalPages ? currentPage < totalPages : list.length >= pageLimit),
  };
}

export function normalizeServiceSubcategory(item) {
  if (typeof item === "string") return { id: "", name: item, description: "", isActive: true };
  return {
    id: item?.id || item?._id || item?.serviceSubcategoryId || item?.serviceSubCategoryId || "",
    name: item?.name || item?.title || "",
    description: item?.description || "",
    isActive: item?.isActive ?? true,
  };
}

export function normalizeServiceCategory(category) {
  const raw = category.subcategories ?? category.subCategories ?? category.serviceSubcategories ?? category.serviceSubCategories ?? category.services ?? category.children;
  const subcategories = Array.isArray(raw) ? raw : raw?.items;
  return {
    id: category.id || category._id || category.serviceCategoryId || "",
    slug: category.slug || "",
    name: category.name || category.title || "",
    description: category.description || "",
    isActive: category.isActive ?? true,
    offeringKind: category.offeringKind,
    subcategories: Array.isArray(subcategories) ? subcategories.map(normalizeServiceSubcategory).filter((item) => item.name) : [],
    subcategoriesLoaded: Array.isArray(subcategories),
    createdAt: category.createdAt || category.created_at || "",
    updatedAt: category.updatedAt || category.updated_at || "",
  };
}

export function normalizeCategoryResponse(response, page = 1, limit = 20) {
  const result = collectionPage(response, page, limit);
  return { ...result, categories: result.items.map(normalizeServiceCategory).filter((item) => item.id && item.name) };
}

export async function loadAllOptions(get, url, normalize, { signal, params = {} } = {}) {
  const records = new Map();
  for (let page = 1; ; page += 1) {
    const response = await get(url, { signal, params: { ...params, page, limit: 20 } });
    signal?.throwIfAborted();
    const result = collectionPage(response.data, page, 20);
    const previousSize = records.size;
    for (const item of result.items.map(normalize)) {
      if (item.id && item.name) records.set(item.id, item);
    }
    if (!result.hasNextPage) break;
    if (records.size === previousSize) {
      if (!result.hasPagination) break;
      throw new Error("The API did not return the next page. Please try again.");
    }
  }
  return [...records.values()];
}

export function loadAllServiceCategories(get, options) {
  return loadAllOptions(get, "/admin/service-categories", normalizeServiceCategory, options);
}

export function loadAllServiceSubcategories(get, categoryId, options = {}) {
  return loadAllOptions(get, "/service-subcategories", normalizeServiceSubcategory, {
    ...options, params: { serviceCategoryId: categoryId },
  });
}

export function loadPublicServiceCategories(get, options) {
  return loadAllOptions(get, "/service-categories", normalizeServiceCategory, options);
}

export function loadPublicServiceSubcategories(get, categoryId, options = {}) {
  return loadAllOptions(get, "/service-subcategories", normalizeServiceSubcategory, {
    ...options, params: { serviceCategoryId: categoryId },
  });
}
