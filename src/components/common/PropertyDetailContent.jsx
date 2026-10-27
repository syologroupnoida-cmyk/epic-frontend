import { Box } from '@mui/material';
import { normalizeVenueType } from '@/components/vendor/properties/propertyModel';

const money = (value) => value == null ? 'Not provided' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));
const label = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
function readable(value) {
    if (value == null) return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(readable).join(', ');
    if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${label(key)}: ${readable(item)}`).join('; ');
    return String(value);
}
function Detail({ title, children }) {
    return <div className="min-w-0"><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 break-words text-sm text-slate-800">{children === '' || children == null ? 'Not provided' : children}</dd></div>;
}
export function PropertyDetailContent({ property, venueTypes = [] }) {
    const types = (property.venueTypes || property.venueTypeIds || []).map(normalizeVenueType).map((item) => venueTypes.find((type) => type.id === item.id) || item);
    return <div className="space-y-5">
        <dl className="grid gap-4 sm:grid-cols-3">
            <Detail title="Status"><span className="capitalize">{String(property.status || 'DRAFT').toLowerCase().replaceAll('_', ' ')}</span></Detail>
            <Detail title="Starting price">{money(property.startingPrice)}</Detail>
            <Detail title="Price type">{String(property.priceType || '').toLowerCase().replaceAll('_', ' ')}</Detail>
            <Detail title="City">{property.city?.name || property.cityName}</Detail>
            {[['capacityMin', 'Minimum capacity'], ['capacityMax', 'Maximum capacity'], ['rooms', 'Rooms'], ['parkingCapacity', 'Parking capacity']].map(([key, title]) => <Detail key={key} title={title}>{property[key]}</Detail>)}
            <Detail title="Venue types">{types.map((item) => item.name || 'Venue type name unavailable').join(', ')}</Detail>
            <Detail title="Amenities">{(property.amenities || []).join(', ')}</Detail>
        </dl>
        <section className="border-t border-slate-200 pt-4"><h3 className="mb-2 text-sm font-semibold">Description</h3><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{property.description || 'No description provided.'}</p></section>
        <section className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Address</h3><dl className="grid gap-4 sm:grid-cols-3">{['street', 'locality', 'state', 'pincode', 'country'].map((key) => <Detail key={key} title={label(key)}>{property.address?.[key]}</Detail>)}</dl></section>
        {Object.keys(property.metadata || {}).length > 0 && <section className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Property information</h3><dl className="grid gap-4 sm:grid-cols-3">{Object.entries(property.metadata).map(([key, value]) => <Detail key={key} title={label(key)}>{readable(value)}</Detail>)}</dl></section>}
        {(property.media || []).length > 0 && <section className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Property images</h3><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{property.media.map((item, index) => item.mediaType === 'VIDEO' ? <Box key={index} component="video" src={item.url} controls preload="metadata" aria-label={`Property video ${index + 1}`} sx={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 1 }} /> : <Box key={index} component="img" src={item.url} alt={`Property image ${index + 1}`} loading="lazy" sx={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 1 }} />)}</Box></section>}
    </div>;
}

