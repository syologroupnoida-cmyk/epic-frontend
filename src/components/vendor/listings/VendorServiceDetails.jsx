import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { ServiceListingDetailContent } from '@/components/common/ServiceListingDetailContent';
import { errorMessage, fetchListing } from './listingApi';

export default function VendorServiceDetails({ id, onClose }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchListing(id, controller.signal).then((record) => { if (!controller.signal.aborted) setListing(record); })
            .catch((err) => { if (!controller.signal.aborted) setError(errorMessage(err)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id, attempt]);
    return <Dialog open onClose={onClose} maxWidth="md" fullWidth disableScrollLock aria-labelledby="vendor-service-detail-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography component="h2" id="vendor-service-detail-title" sx={{ fontSize: 18, fontWeight: 600 }}>{listing?.title || 'Service details'}</Typography>
            <IconButton aria-label="Close service details" onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '50%', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" /></svg></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>{loading ? <Box role="status" sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading service details" /></Box> : error ? <p role="alert" className="py-6 text-sm text-red-700">{error}</p> : listing && <ServiceListingDetailContent listing={listing} />}</DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>{error && <Button onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }}>Retry</Button>}<Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button></DialogActions>
    </Dialog>;
}
