import MainApi from '@/util/MainApi';

export const ADMIN_LISTINGS_PATH = '/admin/listings';
export const listingId = (item) => String(item?.id ?? item?._id ?? item?.listingId ?? '');
export const displayName = (item) => typeof item === 'string' ? item : item?.name || item?.title || item?.cityName || item?.companyName || item?.businessName || '';
export const listingError = (error) => error?.response?.data?.message || error?.message || 'Unable to complete the request.';
export const statusLabel = (status) => String(status || 'Unknown').toLowerCase().replaceAll('_', ' ');

function unwrap(response) {
    const body = response?.data ?? response;
    if (body?.success === false) throw new Error(body.message || 'Unable to complete the request.');
    return body?.data ?? body;
}

export async function fetchAdminListings({ page = 1, limit = 20, status = '', search = '' } = {}, signal) {
    const response = await MainApi.get(ADMIN_LISTINGS_PATH, {
        params: { page, limit, listingType: 'SERVICE', ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) }, signal,
    });
    const data = unwrap(response);
    const pagination = data?.pagination || data?.meta || response.data?.pagination || response.data?.meta || {};
    const items = Array.isArray(data) ? data : data?.listings || data?.items || data?.results || [];
    const total = data?.total ?? data?.totalItems ?? data?.totalElements ?? pagination.total ?? pagination.totalItems ?? pagination.totalRecords;
    const count = total == null ? -1 : Number(total);
    const hasNextPage = items.length < limit ? false : count >= 0 ? page * limit < count : (pagination.hasNextPage ?? (pagination.totalPages ? page < Number(pagination.totalPages) : false));
    return { items, total: count, hasNextPage };
}

export async function fetchAdminListing(id, signal) {
    const data = unwrap(await MainApi.get(`${ADMIN_LISTINGS_PATH}/${encodeURIComponent(id)}`, { signal }));
    return data?.listing || data;
}

export function serviceListingActions(listing) {
    const status = String(listing?.status || '').toUpperCase();
    if (status === 'PENDING_REVIEW') return ['approve', 'reject'];
    if (['APPROVED', 'ACTIVE', 'PUBLISHED'].includes(status)) return ['pause'];
    if (status === 'PAUSED') return ['resume'];
    return [];
}

export async function moderateServiceListing(id, action, reason = '') {
    if (!id) throw new Error('The service listing ID is missing.');
    if (!['approve', 'reject', 'pause', 'resume'].includes(action)) throw new Error('Unsupported service action.');
    const needsReason = ['reject', 'pause'].includes(action);
    if (needsReason && !reason.trim()) throw new Error('A reason is required.');
    return unwrap(await MainApi.post(`${ADMIN_LISTINGS_PATH}/${encodeURIComponent(id)}/${action}`, needsReason ? { reason: reason.trim() } : {}));
}
