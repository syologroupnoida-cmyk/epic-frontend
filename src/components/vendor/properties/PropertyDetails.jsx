import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { errorMessage } from '../listings/listingApi';
import { fetchProperty, fetchPropertyVenueTypes } from './propertyApi';
import { PropertyDetailContent } from '@/components/common/PropertyDetailContent';
export { PropertyDetailContent };

export default function PropertyDetails({ id, onClose }) {
    const [property, setProperty] = useState(null);
    const [venueTypes, setVenueTypes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchProperty(id, controller.signal).then((record) => { if (!controller.signal.aborted) setProperty(record); })
            .catch((err) => { if (!controller.signal.aborted) setError(errorMessage(err)); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        fetchPropertyVenueTypes(controller.signal).then((types) => { if (!controller.signal.aborted) setVenueTypes(types); }).catch(() => {});
        return () => controller.abort();
    }, [id, attempt]);
    return <Dialog open onClose={onClose} maxWidth="md" fullWidth disableScrollLock aria-labelledby="vendor-property-detail-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e2e8f0' }}><Typography component="h2" id="vendor-property-detail-title" sx={{ fontSize: 18, fontWeight: 600 }}>{property?.title || 'Property details'}</Typography><IconButton aria-label="Close property details" onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '50%', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" /></svg></IconButton></DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>{loading ? <Box role="status" sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading property details" /></Box> : error ? <p role="alert" className="py-6 text-sm text-red-700">{error}</p> : property && <PropertyDetailContent property={property} venueTypes={venueTypes} />}</DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>{error && <Button onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }}>Retry</Button>}<Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button></DialogActions>
    </Dialog>;
}
