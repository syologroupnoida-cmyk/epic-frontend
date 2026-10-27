import { Box, CircularProgress } from '@mui/material';
import AddService from './AddService';
import { VENDOR_SERVICE_ROUTES } from '@/util/serviceRoutes';

export default function EditService({ listingId, routes = VENDOR_SERVICE_ROUTES }) {
    if (!listingId) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading service" /></Box>;
    return <AddService key={listingId} listingId={listingId} routes={routes} />;
}
