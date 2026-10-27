import { ServiceListingDetailContent } from "@/components/common/ServiceListingDetailContent";
export { ServiceListingDetailContent };
import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { fetchAdminListing, listingError, listingId, serviceListingActions } from '@/util/adminListings.mjs';

export default function ServiceListingDetails({ id, onClose, onAction, busy }) {
    const [listing, setListing] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchAdminListing(id, controller.signal).then((record) => { if (!controller.signal.aborted) setListing(record); })
            .catch((err) => { if (!controller.signal.aborted) setError(listingError(err)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id, attempt]);
    return <Dialog open onClose={() => { if (!busy) onClose(); }} maxWidth="md" fullWidth disableScrollLock aria-labelledby="admin-service-detail-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e2e8f0' }}><Typography component="h2" id="admin-service-detail-title" sx={{ fontSize: 18, fontWeight: 600 }}>{listing?.title || 'Service details'}</Typography><IconButton aria-label="Close service details" disabled={busy} onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, color: '#64748b', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M6 18 18 6" /></svg></IconButton></DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>{loading ? <Box role="status" sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading service details" /></Box> : error ? <Alert severity="error" action={<Button onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }}>Retry</Button>}>{error}</Alert> : listing && <ServiceListingDetailContent listing={listing} />}</DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none', color: '#64748b' }}>Close</Button>
            {!loading && !error && listing && ['approve', 'reject'].map((action) => <Button key={action} disabled={busy || !serviceListingActions(listing).includes(action)} variant={action === 'approve' ? 'contained' : 'outlined'} onClick={() => onAction({ ...listing, id: listingId(listing) || id }, action)} sx={{ textTransform: 'capitalize', color: action === 'approve' ? '#fff' : '#b61f4b', bgcolor: action === 'approve' ? '#b61f4b' : undefined, borderColor: '#b61f4b', '&:hover': { bgcolor: action === 'approve' ? '#981a3f' : '#fff1f2' } }}>{action} service</Button>)}
        </DialogActions>
    </Dialog>;
}
