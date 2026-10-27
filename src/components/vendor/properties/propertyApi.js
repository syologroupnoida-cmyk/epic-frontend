import MainApi from '@/util/MainApi';
import { apiData, fetchOfferingCapabilities } from '../listings/listingApi';

export const PROPERTY_ENDPOINT = '/vendor/venue-properties';
const path = (id) => `${PROPERTY_ENDPOINT}/${encodeURIComponent(id)}`;

export async function fetchProperties(page = 1, limit = 20, signal, { status = '', search = '' } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    if (search.trim()) params.search = search.trim();
    const response = await MainApi.get(PROPERTY_ENDPOINT, { params, signal });
    const data = apiData(response);
    const items = Array.isArray(data) ? data : data?.venueProperties || data?.properties || data?.items || data?.results || data?.listings || [];
    const pagination = data?.pagination || data?.meta || response.data?.pagination || {};
    const rawTotal = data?.total ?? data?.totalItems ?? pagination.total ?? pagination.totalItems;
    const total = rawTotal == null ? -1 : Number(rawTotal);
    const hasNextPage = items.length < limit ? false : total >= 0 ? page * limit < total : Boolean(pagination.hasNextPage ?? (page < Number(pagination.totalPages || 0)));
    return { items, total, hasNextPage };
}

export async function fetchProperty(id, signal) {
    const data = apiData(await MainApi.get(path(id), { signal }));
    return data?.venueProperty || data?.property || data?.listing || data;
}

export async function saveProperty(id, payload) {
    if (!id) return apiData(await MainApi.post(PROPERTY_ENDPOINT, payload));
    const update = { ...payload };
    delete update.submitForReview;
    return apiData(await MainApi.patch(path(id), update));
}

export async function submitProperty(id) {
    return apiData(await MainApi.post(`${path(id)}/submit`));
}

export async function deleteProperty(id) {
    return apiData(await MainApi.delete(path(id)));
}

export async function restoreProperty(id) {
    return apiData(await MainApi.post(`${path(id)}/unarchive`, {}));
}

export async function fetchPropertyVenueTypes(signal) {
    const categories = await fetchOfferingCapabilities('VENUE_PROPERTY', signal);
    return categories.flatMap((category) => category.subcategories.map((type) => ({ id: type.id, name: type.name, categoryName: category.name })));
}
