export const PROPERTY_ROUTES = {
    create: '/agent/add-property',
    list: '/agent/property-list',
    edit: (id) => `/agent/edit-property/${encodeURIComponent(id)}`,
};

export const propertyId = (item) => String(item?.id ?? item?._id ?? item?.venuePropertyId ?? item?.propertyId ?? '');
export const archivedProperty = (item) => Boolean(item.isArchived || item.archivedAt || item.deletedAt || ['ARCHIVED', 'DELETED'].includes(String(item.status).toUpperCase()));
export const emptyProperty = () => ({
    title: '', description: '', startingPrice: '', priceType: 'STARTING_FROM', cityId: '', city: null,
    address: { street: '', locality: '', state: '', pincode: '', country: '' },
    capacityMin: '', capacityMax: '', rooms: '', parkingCapacity: '', amenities: [],
    metadata: { alcoholAllowed: false, outsideCateringAllowed: false }, venueTypes: [], media: [],
});

export function normalizeVenueType(record) {
    if (typeof record === 'string') return { id: record, name: '', categoryName: '' };
    const type = record.serviceSubcategory || record.subcategory || record.service || record.venueType || record;
    return {
        id: String(record.serviceSubcategoryId ?? record.venueTypeId ?? type.id ?? type._id ?? ''),
        name: type.name || type.title || record.name || '',
        categoryName: type.category?.name || type.serviceCategory?.name || record.category?.name || '',
    };
}

export function propertyToForm(property) {
    const initial = emptyProperty();
    return {
        ...initial,
        title: property.title || '', description: property.description || '',
        startingPrice: property.startingPrice ?? '', priceType: property.priceType || initial.priceType,
        cityId: String(property.cityId ?? property.city?.id ?? property.city?._id ?? ''),
        city: property.city || (property.cityId ? { id: String(property.cityId), name: property.cityName || '' } : null),
        address: { ...initial.address, ...(property.address || {}) },
        capacityMin: property.capacityMin ?? '', capacityMax: property.capacityMax ?? '',
        rooms: property.rooms ?? '', parkingCapacity: property.parkingCapacity ?? '',
        amenities: Array.isArray(property.amenities) ? [...property.amenities] : [],
        metadata: { ...initial.metadata, ...(property.metadata || {}) },
        venueTypes: (property.venueTypes || property.venueTypeIds || []).map(normalizeVenueType).filter((item) => item.id),
        media: (property.media || []).map((item) => ({ ...item })),
    };
}

function numeric(value, name, integer = true) {
    const number = Number(value);
    if (value === '' || value == null || !Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
        throw new Error(`${name} must be a valid non-negative ${integer ? 'whole number' : 'amount'}.`);
    }
    return number;
}

export function buildPropertyPayload(form, submitForReview) {
    if (!form.title.trim()) throw new Error('Enter a property title.');
    if (!form.cityId) throw new Error('Select the property city.');
    if (submitForReview && !form.description.trim()) throw new Error('Enter a description before submitting the property.');
    const venueTypes = [...new Set(form.venueTypes.map((item) => typeof item === 'string' ? item : item.id).filter(Boolean))];
    if (!venueTypes.length) throw new Error('Select at least one venue type.');
    const capacityMin = numeric(form.capacityMin, 'Minimum capacity');
    const capacityMax = numeric(form.capacityMax, 'Maximum capacity');
    if (capacityMax < capacityMin) throw new Error('Maximum capacity must be at least the minimum capacity.');
    const media = form.media.map((item) => {
        if (!/^https?:\/\//i.test(item.url || '')) throw new Error('Every property image must have a valid HTTP or HTTPS URL.');
        return { url: item.url.trim(), publicId: item.publicId || '', mediaType: item.mediaType || 'IMAGE' };
    });
    return {
        title: form.title.trim(), description: form.description.trim(),
        startingPrice: numeric(form.startingPrice, 'Starting price', false), priceType: form.priceType,
        cityId: form.cityId,
        address: Object.fromEntries(['street', 'locality', 'state', 'pincode', 'country'].map((key) => [key, String(form.address[key] || '').trim()])),
        capacityMin, capacityMax,
        ...(form.rooms !== '' ? { rooms: numeric(form.rooms, 'Rooms') } : {}),
        ...(form.parkingCapacity !== '' ? { parkingCapacity: numeric(form.parkingCapacity, 'Parking capacity') } : {}),
        amenities: [...new Set(form.amenities.map((item) => item.trim()).filter(Boolean))],
        metadata: { ...form.metadata, alcoholAllowed: Boolean(form.metadata.alcoholAllowed), outsideCateringAllowed: Boolean(form.metadata.outsideCateringAllowed) },
        venueTypes, media, submitForReview: Boolean(submitForReview),
    };
}
