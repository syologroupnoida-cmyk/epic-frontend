import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';
import AgentDashboard from '@/components/dashboard/AgentDashboard';
import AddProperty from '@/components/vendor/AddProperty';

export default function EditPropertyPage() {
    const router = useRouter();
    const id = router.isReady && typeof router.query.venuePropertyId === 'string' ? router.query.venuePropertyId : '';
    return <AgentDashboard activePanel="Edit Property">{id ? <AddProperty key={id} venuePropertyId={id} /> : <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={28} aria-label="Loading property" /></Box>}</AgentDashboard>;
}
