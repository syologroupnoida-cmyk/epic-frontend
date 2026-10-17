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
    stateName: text(record.primaryCity?.stateName),
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
  };
}

export function normalizeVendorList(payload, category, requestedPage = 1) {
  const data = payload?.data ?? payload;
  const records = Array.isArray(data) ? data : data?.vendors;
  if (!Array.isArray(records)) throw new Error("Invalid vendor directory response.");
  const pagination = data?.pagination || {};
  const page = Math.max(1, number(pagination.page) || requestedPage);
  const total = number(pagination.total);
  const totalPages = number(pagination.totalPages);
  return {
    vendors: records.map((record) => normalizeVendor(record, category)),
    pagination: {
      page, total, totalPages,
      hasNextPage: pagination.hasNextPage ?? (totalPages !== null ? page < totalPages : records.length === 20),
      hasPrevPage: pagination.hasPrevPage ?? page > 1,
    },
  };
}

export function normalizeVendorDetail(payload, category) {
  const data = payload?.data ?? payload;
  const record = data?.vendor ?? data;
  if (!record || typeof record !== "object" || Array.isArray(record) || !(record.businessName || record.name)) {
    throw new Error("Invalid vendor profile response.");
  }
  return normalizeVendor(record, category);
}
