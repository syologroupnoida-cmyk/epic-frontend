function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function name(value) {
  return text(value) || text(value?.name) || text(value?.title);
}

function number(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}

export function normalizeVendor(record, category) {
  const services = [record.services, record.serviceSubcategories, record.capabilities]
    .filter(Array.isArray).flat().map((item) => name(item?.service || item)).filter(Boolean);
  const categories = (Array.isArray(record.serviceCategories) ? record.serviceCategories : [])
    .map(name).filter(Boolean);
  const image = text(record.logoUrl) || text(record.coverImageUrl) || text(record.imageUrl);
  const safeImage = /^(https?:\/\/|\/(?!\/))/.test(image) ? image : null;
  return {
    id: text(record.userId) || text(record.id) || text(record._id) || text(record.slug) || text(record.vendorSlug),
    userId: text(record.userId),
    kycStatus: text(record.kycStatus),
    profileStatus: text(record.profileStatus),
    createdAt: text(record.createdAt),
    updatedAt: text(record.updatedAt),
    slug: text(record.slug) || text(record.vendorSlug),
    name: text(record.businessName) || text(record.name) || "Vendor business",
    about: text(record.about) || text(record.description),
    category: categories.join(", ") || name(record.category) || services.join(", ") || "Wedding services",
    categorySlug: category.slug,
    services: [...new Set([...services, ...categories])],
    city: name(record.primaryCity) || name(record.city),
    stateName: text(record.primaryCity?.stateName) || name(record.state),
    countryCode: text(record.primaryCity?.countryCode),
    citySlug: text(record.primaryCity?.slug),
    area: text(record.area) || text(record.address?.area) || text(record.address?.addressLine1) || text(record.address),
    image: safeImage || category.image,
    hasImage: Boolean(safeImage),
    rating: number(record.averageRating ?? record.rating),
    ratings: number(record.reviewCount ?? record.ratingsCount ?? record.totalReviews),
    price: number(record.startingPrice ?? record.price),
    years: number(record.yearsOfExperience ?? record.experienceYears),
    verified: record.isVerified === true || record.verified === true || record.kycStatus === "VERIFIED" || record.kycStatus === "APPROVED",
    badge: text(record.badge),
    phone: text(record.businessPhone) || text(record.phoneNumber) || text(record.phone),
    whatsapp: text(record.whatsappNumber) || text(record.whatsappPhone),
    website: /^https?:\/\//.test(text(record.website)) ? text(record.website) : '',
  };
}

export function normalizeVendorList(payload, category, requestedPage = 1, resource = 'vendors') {
  const data = payload?.data ?? payload;
  const records = Array.isArray(data) ? data : resource === 'businesses' ? data?.businesses ?? data?.items ?? data?.results ?? data?.vendors : data?.vendors;
  if (!Array.isArray(records)) throw new Error("Invalid vendor directory response.");
  const pagination = data?.pagination || data?.meta?.pagination || data?.meta || payload?.pagination || payload?.meta || {};
  const page = Math.max(1, number(pagination.page) || requestedPage);
  const total = number(pagination.total ?? pagination.totalCount ?? pagination.totalItems ?? data?.total ?? data?.totalCount ?? payload?.total);
  const totalPages = number(pagination.totalPages);
  return {
    vendors: records.map((record) => ({ ...normalizeVendor(record, category), resource })),
    pagination: {
      page, total, totalPages,
      hasNextPage: pagination.hasNextPage ?? (totalPages !== null ? page < totalPages : total !== null ? page * 20 < total : records.length === 20),
      hasPrevPage: pagination.hasPrevPage ?? page > 1,
    },
  };
}

export function vendorDirectoryCount(sourceTotals = {}) {
  const { businesses } = sourceTotals;
  return businesses !== undefined ? `${businesses.toLocaleString('en-IN')} total business profiles` : 'Total business profiles unavailable';
}

export async function fetchVendorDirectory(api, category, { page = 1, filters = {}, signal, includeBusinesses = false } = {}) {
  const { search, cityId, city, serviceCategoryId, serviceSubcategoryId, offeringKind } = filters;
  const params = { page, limit: 20 };
  for (const [key, value] of Object.entries({ search, cityId, serviceCategoryId, serviceSubcategoryId, offeringKind })) {
    if (value) params[key] = value;
  }
  const sources = [{ resource: 'vendors', params }];
  if (includeBusinesses) {
    const businessParams = { page, limit: 20, ...(city?.trim() ? { city: city.trim() } : {}) };
    sources.push({ resource: 'businesses', params: businessParams });
  }
  const responses = await Promise.allSettled(sources.map(async (source) => {
    const { data } = await api.get(`/marketplace/${source.resource}`, { signal, params: source.params });
    if (data?.success === false) throw new Error('Vendor request failed.');
    return normalizeVendorList(data, category, page, source.resource);
  }));
  if (signal?.aborted) throw new Error('Vendor request cancelled.');
  const results = responses.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (!results.length) throw responses[0].reason;
  const seen = new Set();
  let duplicates = false;
  const vendors = results.flatMap((result) => result.vendors).filter((vendor) => {
    const keys = [vendor.userId, vendor.id].filter(Boolean).map((id) => `id:${id}`);
    if (vendor.slug) keys.push(`slug:${vendor.slug}`);
    const duplicate = keys.some((key) => seen.has(key));
    keys.forEach((key) => seen.add(key));
    if (duplicate) duplicates = true;
    return !duplicate;
  });
  const complete = results.length === sources.length;
  const totalsKnown = complete && !duplicates && sources.length === 1 && results.every((result) => result.pagination.total !== null);
  return {
    vendors,
    sourceTotals: Object.fromEntries(responses.flatMap((result, index) =>
      result.status === 'fulfilled' && result.value.pagination.total !== null
        ? [[sources[index].resource, result.value.pagination.total]]
        : [],
    )),
    pagination: {
      page,
      total: totalsKnown ? results.reduce((sum, result) => sum + result.pagination.total, 0) : null,
      totalPages: complete && results.every((result) => result.pagination.totalPages !== null) ? Math.max(...results.map((result) => result.pagination.totalPages)) : null,
      hasNextPage: results.some((result) => result.pagination.hasNextPage),
      hasPrevPage: page > 1,
    },
    warning: complete ? '' : 'Some businesses could not be loaded. Please try again.',
  };
}

export function normalizeVendorDetail(payload, category, resource = 'vendors') {
  const data = payload?.data ?? payload;
  const record = data?.vendor ?? data?.business ?? data;
  if (!record || typeof record !== "object" || Array.isArray(record) || !(record.businessName || record.name)) {
    throw new Error("Invalid vendor profile response.");
  }
  return { ...normalizeVendor(record, category), resource };
}
