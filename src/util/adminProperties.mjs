import MainApi from '@/util/MainApi';

export const ADMIN_PROPERTIES_PATH = '/admin/venue-properties';
export const adminPropertyId = (item) => String(item?.id ?? item?._id ?? item?.venuePropertyId ?? item?.propertyId ?? '');
const path = (id) => `${ADMIN_PROPERTIES_PATH}/${encodeURIComponent(id)}`;

function unwrap(response) {
    const body = response?.data ?? response;
    if (body?.success === false) throw new Error(body.message || 'Unable to complete the request.');
    return body?.data ?? body;
}

export async function fetchAdminProperties({ page = 1, limit = 20, status = '', search = '' } = {}, signal) {
    const response = await MainApi.get(ADMIN_PROPERTIES_PATH, { params: { page, limit, ...(status ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) }, signal });
    const data = unwrap(response);
    const items = Array.isArray(data) ? data : data?.venueProperties || data?.properties || data?.items || data?.results || [];
    const pagination = data?.pagination || data?.meta || response.data?.pagination || response.data?.meta || {};
    const rawTotal = data?.total ?? data?.totalItems ?? pagination.total ?? pagination.totalItems ?? pagination.totalRecords;
    const total = rawTotal == null ? -1 : Number(rawTotal);
    const hasNextPage = items.length < limit ? false : total >= 0 ? page * limit < total : Boolean(pagination.hasNextPage ?? (page < Number(pagination.totalPages || 0)));
    return { items, total, hasNextPage };
}

export async function fetchAdminProperty(id, signal) {
    const data = unwrap(await MainApi.get(path(id), { signal }));
    return data?.venueProperty || data?.property || data;
}

export function propertyReviewActions(property) {
    return String(property?.status || '').toUpperCase() === 'PENDING_REVIEW' ? ['approve', 'reject'] : [];
}

export async function moderateAdminProperty(id, action, reason = '') {
    if (!id) throw new Error('The property ID is missing.');
    if (!['approve', 'reject'].includes(action)) throw new Error('Unsupported property action.');
    if (action === 'reject' && !reason.trim()) throw new Error('A rejection reason is required.');
    return unwrap(await MainApi.post(`${path(id)}/${action}`, action === 'reject' ? { reason: reason.trim() } : {}));
}
