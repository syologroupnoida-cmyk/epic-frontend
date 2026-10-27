import { Alert, Box } from '@mui/material';

const listingId = (item) => String(item?.id ?? item?._id ?? item?.listingId ?? '');
const displayName = (item) => typeof item === 'string' ? item : item?.name || item?.title || item?.cityName || item?.companyName || item?.businessName || '';
const statusLabel = (status) => String(status || 'Unknown').toLowerCase().replaceAll('_', ' ');

const money = (value) => value == null || !Number.isFinite(Number(value)) ? 'Not provided' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));
const label = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
const readable = (value) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : Array.isArray(value) ? value.map(readable).join(', ') : value && typeof value === 'object' ? Object.entries(value).map(([key, item]) => `${label(key)}: ${readable(item)}`).join('; ') : String(value ?? 'Not provided');

function Detail({ title, children }) {
    return <div className="min-w-0"><dt className="text-xs text-slate-500">{title}</dt><dd className="mt-1 break-words text-sm text-slate-800">{children || 'Not provided'}</dd></div>;
}

export function ServiceListingDetailContent({ listing }) {
    const vendor = listing.vendor?.profile || listing.vendor?.vendorProfile || listing.vendorProfile || listing.vendor || {};
    return <div className="space-y-5">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Detail title="Status"><span className="capitalize">{statusLabel(listing.status)}</span></Detail>
            <Detail title="Starting price">{money(listing.startingPrice)}</Detail>
            <Detail title="Price type"><span className="capitalize">{statusLabel(listing.priceType)}</span></Detail>
            <Detail title="Vendor">{displayName(vendor) || displayName(listing.vendorUser) || listing.vendorName}</Detail>
            <Detail title="Email">{vendor.email || listing.vendor?.email || listing.vendorUser?.email}</Detail>
            <Detail title="Phone">{vendor.phone || listing.vendor?.phone || listing.vendorUser?.phone}</Detail>
            <Detail title="City">{displayName(listing.city) || listing.cityName}</Detail>
            <Detail title="Service area cities">{(listing.serviceAreaCities || listing.serviceAreas || []).map((area) => displayName(area.city || area)).filter(Boolean).join(', ')}</Detail>
            <Detail title="Created on">{listing.createdAt && !Number.isNaN(Date.parse(listing.createdAt)) ? new Date(listing.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : null}</Detail>
        </dl>
        <div className="border-t border-slate-200 pt-4"><h3 className="mb-2 text-sm font-semibold">Description</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{listing.description || 'No description provided.'}</p></div>
        {(listing.rejectionReason || listing.pauseReason) && <Alert severity="warning">{listing.rejectionReason || listing.pauseReason}</Alert>}
        {Object.keys(listing.metadata || {}).length > 0 && <div className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Listing details</h3><dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Object.entries(listing.metadata).map(([key, value]) => <Detail key={key} title={label(key)}>{readable(value)}</Detail>)}</dl></div>}
        <div className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Services and pricing</h3>
            {(listing.services || []).length ? <div className="divide-y divide-slate-200">{listing.services.map((service, index) => {
                const subcategory = service.serviceSubcategory || service.subcategory || service.service;
                const category = service.serviceCategory || service.category || subcategory?.serviceCategory || subcategory?.category;
                return <div key={listingId(service) || index} className="py-3 first:pt-0">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Detail title={`Subcategory / Service ${index + 1}`}>{displayName(subcategory) || service.subcategoryName || service.name}</Detail>
                    <Detail title="Category">{displayName(category) || service.categoryName}</Detail>
                    <Detail title="Price">{money(service.price)}</Detail>
                    {Object.entries(service.metadata || {}).map(([key, value]) => <Detail key={key} title={label(key)}>{readable(value)}</Detail>)}
                </dl>
            </div>; })}</div> : <p className="text-sm text-slate-500">No service details provided.</p>}
        </div>
        {(listing.media || []).length > 0 && <div className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">Portfolio</h3><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{listing.media.map((media, index) => media.mediaType === 'VIDEO' ? <Box key={index} component="video" src={media.url} controls preload="metadata" aria-label={`Service video ${index + 1}`} sx={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 1 }} /> : <Box key={index} component="img" src={media.url} alt={`Service image ${index + 1}`} loading="lazy" sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1 }} />)}</Box></div>}
    </div>;
}

