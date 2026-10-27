import MainApi from '@/util/MainApi';

export const LISTINGS_ENDPOINT = '/vendor/listings';

// Public lookup routes; overrides allow the same UI to target another deployment.
export const listingApiConfig = {
    categories: process.env.NEXT_PUBLIC_VENDOR_SERVICE_CATEGORIES_ENDPOINT || '/service-categories',
    subcategories: process.env.NEXT_PUBLIC_VENDOR_SERVICE_SUBCATEGORIES_ENDPOINT || '/service-categories/{categoryId}',
    cities: process.env.NEXT_PUBLIC_VENDOR_CITIES_ENDPOINT || '/cities',
    restoreMethod: process.env.NEXT_PUBLIC_VENDOR_LISTING_RESTORE_METHOD || 'post',
    archivedStatus: process.env.NEXT_PUBLIC_VENDOR_LISTING_ARCHIVED_STATUS || '',
};

export function apiData(response) {
    const body = response?.data ?? response;
    if (body?.success === false) throw new Error(body.message || 'The request could not be completed.');
    return body?.data ?? body;
}

export function listItems(value) {
    if (Array.isArray(value)) return value;
    for (const key of ['items', 'listings', 'categories', 'serviceCategories', 'subcategories', 'subCategories', 'serviceSubcategories', 'cities', 'results', 'content']) {
        if (Array.isArray(value?.[key])) return value[key];
    }
    if (value?.category) return listItems(value.category);
    if (value?.serviceCategory) return listItems(value.serviceCategory);
    return [];
}

export const itemId = (item) => String(item?.id ?? item?._id ?? item?.listingId ?? item?.serviceSubcategoryId ?? item?.serviceCategoryId ?? item?.cityId ?? '');
export const itemName = (item) => item?.name || item?.title || item?.label || item?.cityName || item?.categoryName || item?.subcategoryName || '';
export const errorMessage = (error, fallback = 'Unable to complete the request. Please try again.') => error?.response?.data?.message || error?.message || fallback;
const listingPath = (id) => `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`;

export async function fetchListings(page = 1, limit = 20, status = '', signal, search = '') {
    const response = await MainApi.get(LISTINGS_ENDPOINT, { params: { page, limit, ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) }, signal });
    const data = apiData(response);
    const pagination = data?.pagination || data?.meta || response.data?.pagination || {};
    const total = data?.total ?? data?.totalItems ?? data?.totalElements ?? pagination.total ?? pagination.totalItems;
    return { items: listItems(data), total: total == null ? -1 : Number(total) };
}

export async function fetchListing(id, signal) {
    const data = apiData(await MainApi.get(listingPath(id), { signal }));
    return data?.listing || data;
}

export async function saveListing(id, payload) {
    if (!id) return apiData(await MainApi.post(LISTINGS_ENDPOINT, payload));
    const updatePayload = { ...payload };
    // Review submission is a separate action; PATCH rejects this creation flag.
    delete updatePayload.submitForReview;
    return apiData(await MainApi.patch(listingPath(id), updatePayload));
}

export async function submitListing(id) {
    return apiData(await MainApi.post(`${listingPath(id)}/submit`));
}

export async function deleteListing(id) {
    return apiData(await MainApi.delete(listingPath(id)));
}

export async function restoreListing(id) {
    const method = listingApiConfig.restoreMethod.toLowerCase();
    if (!['post', 'patch'].includes(method)) throw new Error('The restore API method has not been configured.');
    return apiData(await MainApi[method](`${listingPath(id)}/unarchive`, {}));
}

export async function fetchLookup(endpoint, params = {}, signal) {
    if (!endpoint) throw new Error('Service options are currently unavailable. Please try again later.');
    let page = 1;
    const all = [];
    const seen = new Set();
    while (true) {
        const data = apiData(await MainApi.get(endpoint, { params: { ...params, page, limit: 100 }, signal, skipAuth: true }));
        const items = listItems(data);
        const additions = items.filter((item) => !seen.has(itemId(item)));
        for (const item of additions) { all.push(item); seen.add(itemId(item)); }
        const pagination = data?.pagination;
        if (!additions.length || !pagination || !(pagination.hasNextPage ?? (page < pagination.totalPages))) break;
        page += 1;
    }
    return all;
}

export async function fetchOfferingCapabilities(offeringKind, signal) {
    // This endpoint accepts offeringKind only; it does not support pagination.
    const data = apiData(await MainApi.get('/vendor/capabilities', { signal, params: { offeringKind } }));
    signal?.throwIfAborted();
    const capabilities = Array.isArray(data?.capabilities) ? data.capabilities : listItems(data);
    const services = capabilities.map((capability) => {
        const service = capability.service || capability.serviceSubcategory || capability.subcategory || capability.venueType || capability;
        const category = service.category || service.serviceCategory || capability.category || capability.serviceCategory;
        const kind = service.offeringKind || category?.offeringKind || capability.offeringKind;
        return {
            ...service,
            id: kind && kind !== offeringKind ? '' : itemId(service),
            name: itemName(service),
            category,
        };
    }).filter((service) => service.id && service.name);
    const categories = new Map();
    for (const service of services) {
        const category = service.category;
        const id = itemId(category);
        if (!id || !itemName(category) || category.isActive === false || service.isActive === false) continue;
        if (!categories.has(id)) categories.set(id, { ...category, id, name: itemName(category), subcategories: [] });
        const subcategories = categories.get(id).subcategories;
        if (!subcategories.some((item) => item.id === service.id)) subcategories.push(service);
    }
    return [...categories.values()];
}

export function fetchServiceCapabilities(signal) {
    return fetchOfferingCapabilities('SERVICE', signal);
}

export async function uploadListingImage(file, purpose = 'listing-media') {
    const form = new FormData();
    form.append('file', file);
    form.append('purpose', purpose);
    const data = apiData(await MainApi.post('/uploads/image', form));
    const uploaded = data?.image || data?.file || data;
    const url = uploaded?.url || uploaded?.secure_url || uploaded?.imageUrl;
    if (!url) throw new Error('The uploaded image did not return a URL. Please try again.');
    return { url, publicId: uploaded.publicId || uploaded.public_id || '', mediaType: 'IMAGE' };
}
