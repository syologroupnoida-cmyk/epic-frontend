import { itemId, itemName } from './listingApi';
import { getMetadataFields, serializeMetadata } from './metadata/fields';

export const emptyService = () => ({ categoryId: '', serviceSubcategoryId: '', price: '', metadata: {}, categoryName: '', subcategoryName: '' });
export const emptyListing = () => ({ title: '', description: '', startingPrice: '', priceType: 'STARTING_FROM', cityId: '', city: null, serviceAreaCities: [], metadata: {}, services: [emptyService()], media: [] });

export function enrichListingLookups(form, categories, cities) {
    const services = form.services.map((service) => {
        const category = categories.find((item) => (item.subcategories || item.serviceSubcategories || []).some((subcategory) => itemId(subcategory) === service.serviceSubcategoryId)) || categories.find((item) => itemId(item) === service.categoryId);
        const subcategory = (category?.subcategories || category?.serviceSubcategories || []).find((item) => itemId(item) === service.serviceSubcategoryId);
        return { ...service, categoryId: itemId(category) || service.categoryId, categoryName: itemName(category) || service.categoryName, subcategoryName: itemName(subcategory) || service.subcategoryName };
    });
    return { ...form, services, city: cities.find((city) => itemId(city) === form.cityId) || form.city, serviceAreaCities: form.serviceAreaCities.map((selected) => cities.find((city) => itemId(city) === itemId(selected)) || selected) };
}

export function listingToForm(listing) {
    const initial = emptyListing();
    return {
        ...initial,
        title: listing.title || '', description: listing.description || '',
        startingPrice: listing.startingPrice ?? '', priceType: listing.priceType || initial.priceType,
        cityId: String(listing.cityId ?? itemId(listing.city)),
        city: listing.city || (listing.cityId ? { id: listing.cityId, name: listing.cityName || String(listing.cityId) } : null),
        serviceAreaCities: (listing.serviceAreaCities || listing.serviceAreas || listing.serviceAreaCityIds || []).map((city) => typeof city === 'object' ? city.city || (city.cityId ? { ...city, id: city.cityId } : city) : { id: city, name: String(city) }),
        metadata: { ...(listing.metadata || {}) },
        services: listing.services?.length ? listing.services.map((service) => {
            const subcategory = service.serviceSubcategory || service.subcategory || service.service || {};
            const category = subcategory.serviceCategory || subcategory.category || service.serviceCategory || service.category || {};
            return {
                ...emptyService(),
                categoryId: String(service.serviceCategoryId ?? subcategory.serviceCategoryId ?? subcategory.categoryId ?? itemId(category)),
                categoryName: service.categoryName || itemName(category),
                serviceSubcategoryId: String(service.serviceSubcategoryId ?? service.subcategoryId ?? service.serviceId ?? itemId(subcategory)),
                subcategoryName: service.subcategoryName || itemName(subcategory),
                price: service.price ?? '', metadata: { ...(service.metadata || {}) },
            };
        }) : initial.services,
        media: (listing.media || []).map((media) => ({ ...media })),
    };
}

function priceNumber(value, label) {
    if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0) throw new Error(`${label} must be a valid non-negative amount.`);
    return Number(value);
}

export function buildListingPayload(form, submitForReview) {
    if (!form.title.trim()) throw new Error('Enter a listing title.');
    if (submitForReview && !form.description.trim()) throw new Error('Enter a description before submitting the listing.');
    if (!form.cityId) throw new Error('Select the primary city.');
    if (!form.services.length) throw new Error('Add at least one service.');
    const metadataFields = Object.keys(form.metadata).map((key) => ({ key, label: key, type: ['teamSize', 'guestCapacity'].includes(key) ? 'number' : Array.isArray(form.metadata[key]) ? 'array' : typeof form.metadata[key] }));
    const services = form.services.map((service, index) => {
        if (!service.serviceSubcategoryId) throw new Error(`Select the subcategory for service ${index + 1}.`);
        return {
            serviceSubcategoryId: service.serviceSubcategoryId,
            price: priceNumber(service.price, `Service ${index + 1} price`),
            metadata: serializeMetadata(service.metadata, getMetadataFields(service.categoryName, service.subcategoryName, service.metadata)),
        };
    });
    if (new Set(services.map((service) => service.serviceSubcategoryId)).size !== services.length) throw new Error('Each service subcategory can only be added once.');
    const media = form.media.map((item) => {
        try {
            const url = new URL(item.url);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
            throw new Error('Enter a valid HTTP or HTTPS URL for every media item.');
        }
        return { url: item.url.trim(), publicId: item.publicId || '', mediaType: item.mediaType || 'IMAGE' };
    });
    return {
        title: form.title.trim(), description: form.description.trim(),
        startingPrice: priceNumber(form.startingPrice, 'Starting price'), priceType: form.priceType,
        cityId: form.cityId, serviceAreaCityIds: [...new Set(form.serviceAreaCities.map(itemId).filter(Boolean))],
        metadata: serializeMetadata(form.metadata, metadataFields), services, media, submitForReview: Boolean(submitForReview),
    };
}
