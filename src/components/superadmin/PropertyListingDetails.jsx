import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { PropertyDetailContent } from '@/components/common/PropertyDetailContent';
import { adminPropertyId, fetchAdminProperty, propertyReviewActions } from '@/util/adminProperties.mjs';
import { displayName, listingError } from '@/util/adminListings.mjs';

export default function PropertyListingDetails({ id, onClose, onAction, busy }) {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchAdminProperty(id, controller.signal).then((record) => { if (!controller.signal.aborted) setProperty(record); })
            .catch((err) => { if (!controller.signal.aborted) setError(listingError(err)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id, attempt]);
    const vendor = property?.vendor?.profile || property?.vendor?.vendorProfile || property?.vendorProfile || property?.vendor || {};
    return <Dialog open onClose={() => { if (!busy) onClose(); }} maxWidth="md" fullWidth disableScrollLock aria-labelledby="admin-property-detail-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e2e8f0' }}><Typography component="h2" id="admin-property-detail-title" sx={{ fontSize: 18, fontWeight: 600 }}>{property?.title || 'Property details'}</Typography><IconButton aria-label="Close property details" disabled={busy} onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '50%', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" /></svg></IconButton></DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>{loading ? <Box role="status" sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading property details" /></Box> : error ? <p role="alert" className="py-6 text-sm text-red-700">{error}</p> : property && <>
            <dl className="mb-5 grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-3">{[
                ['Vendor', displayName(vendor) || displayName(property.vendorUser) || property.vendorName],
                ['Email', vendor.email || property.vendor?.email || property.vendorUser?.email],
                ['Phone', vendor.phone || property.vendor?.phone || property.vendorUser?.phone],
            ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{value || 'Not provided'}</dd></div>)}</dl>
            <PropertyDetailContent property={property} />
            {property.rejectionReason && <div className="mt-5 rounded border border-red-100 bg-red-50 p-3"><h3 className="text-xs font-semibold text-red-800">Rejection reason</h3><p className="mt-1 text-sm text-red-700">{property.rejectionReason}</p></div>}
        </>}</DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
            {error && <Button disabled={busy} onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }}>Retry</Button>}
            <Button disabled={busy} onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Close</Button>
            {!loading && !error && property && ['approve', 'reject'].map((action) => <Button key={action} disabled={busy || !propertyReviewActions(property).includes(action)} variant={action === 'approve' ? 'contained' : 'outlined'} onClick={() => onAction({ ...property, id: adminPropertyId(property) || id }, action)} sx={{ textTransform: 'none', color: action === 'approve' ? '#fff' : '#b61f4b', bgcolor: action === 'approve' ? '#b61f4b' : undefined, borderColor: '#b61f4b', '&:hover': { bgcolor: action === 'approve' ? '#981a3f' : '#fff1f2' } }}>{action === 'approve' ? 'Approve property' : 'Reject property'}</Button>)}
        </DialogActions>
    </Dialog>;
}
