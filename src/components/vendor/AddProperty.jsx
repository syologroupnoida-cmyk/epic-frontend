import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Autocomplete, Box, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { CloudUploadOutlined, SaveOutlined, SendOutlined } from './listings/ServiceIcons';
import ListingMediaGallery from './listings/ListingMediaGallery';
import { errorMessage, uploadListingImage } from './listings/listingApi';
import { loadAllCities } from '@/util/cities.mjs';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { buildPropertyPayload, emptyProperty, PROPERTY_ROUTES, propertyId, propertyToForm } from './properties/propertyModel';
import { fetchProperty, fetchPropertyVenueTypes, saveProperty, submitProperty } from './properties/propertyApi';
import PropertyFeedback from './properties/PropertyFeedback';

const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', md: 'repeat(3,minmax(0,1fr))' }, gap: 2.5 };
const buttonSx = { textTransform: 'none', fontWeight: 700, minHeight: 38 };
function Section({ title, children }) {
    return <Box component="section" sx={{ py: 3, borderBottom: '1px solid #e2e8f0', '&:last-of-type': { borderBottom: 0 } }}><Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, color: '#334155', mb: 2.5 }}>{title}</Typography>{children}</Box>;
}

export default function AddProperty({ venuePropertyId = '' }) {
    const router = useRouter();
    const [form, setForm] = useState(emptyProperty);
    const [cities, setCities] = useState([]);
    const [venueTypes, setVenueTypes] = useState([]);
    const [loading, setLoading] = useState(Boolean(venuePropertyId));
    const [loadError, setLoadError] = useState('');
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [optionsError, setOptionsError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [saving, setSaving] = useState('');
    const [uploading, setUploading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [destination, setDestination] = useState('');
    const input = useRef(null);
    const operation = useRef(false);
    const mounted = useRef(true);
    const busy = loading || Boolean(saving) || uploading;

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const controller = new AbortController();
        Promise.all([loadAllCities(getPublicCatalog, { signal: controller.signal }), fetchPropertyVenueTypes(controller.signal)]).then(([cityRecords, types]) => {
            if (!controller.signal.aborted) { setCities(cityRecords); setVenueTypes(types); }
        }).catch((err) => {
            if (!controller.signal.aborted) { const message = errorMessage(err, 'Unable to load property options.'); setOptionsError(message); setFeedback({ status: 'error', message }); }
        }).finally(() => { if (!controller.signal.aborted) setOptionsLoading(false); });
        return () => controller.abort();
    }, [attempt]);
    useEffect(() => {
        if (!venuePropertyId) return;
        const controller = new AbortController();
        fetchProperty(venuePropertyId, controller.signal).then((record) => { if (!controller.signal.aborted) setForm(propertyToForm(record)); })
            .catch((err) => { if (!controller.signal.aborted) { const message = errorMessage(err); setLoadError(message); setFeedback({ status: 'error', message }); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [venuePropertyId, attempt]);

    function retry() { setLoadError(''); setOptionsError(''); setOptionsLoading(true); setLoading(Boolean(venuePropertyId)); setAttempt((value) => value + 1); }
    function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
    async function save(review) {
        if (busy || operation.current || loadError) return;
        let payload;
        try {
            if (!(venuePropertyId && review)) {
                if (optionsLoading || optionsError) throw new Error('Load the property options before saving.');
                payload = buildPropertyPayload(form, review);
            }
        } catch (err) { setFeedback({ status: 'error', message: err.message }); return; }
        operation.current = true; setSaving(review ? 'review' : 'draft');
        try {
            const response = venuePropertyId && review ? await submitProperty(venuePropertyId) : await saveProperty(venuePropertyId, payload);
            if (!mounted.current) return;
            if (!venuePropertyId) {
                const id = propertyId(response?.venueProperty || response?.property || response?.listing || response);
                setDestination(id ? PROPERTY_ROUTES.edit(id) : PROPERTY_ROUTES.list);
            }
            setFeedback({ status: 'success', title: 'Property saved', message: review ? 'Your property has been submitted for review.' : 'Your property has been saved as a draft.' });
        } catch (err) { if (mounted.current) setFeedback({ status: 'error', message: errorMessage(err) }); }
        finally { operation.current = false; if (mounted.current) setSaving(''); }
    }
    async function upload(event) {
        const files = Array.from(event.target.files || []); event.target.value = '';
        if (!files.length || busy || operation.current) return;
        if (files.some((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) { setFeedback({ status: 'error', message: 'Choose image files smaller than 10 MB.' }); return; }
        setUploading(true);
        try {
            for (const file of files) {
                const image = await uploadListingImage(file, 'venue-property-media');
                if (!mounted.current) return;
                setForm((current) => ({ ...current, media: [...current.media, image] }));
            }
        } catch (err) { if (mounted.current) setFeedback({ status: 'error', message: errorMessage(err) }); }
        finally { if (mounted.current) setUploading(false); }
    }
    const selectedTypes = form.venueTypes.map((selected) => venueTypes.find((type) => type.id === selected.id) || selected);
    const typeOptions = [...venueTypes, ...selectedTypes.filter((selected) => !venueTypes.some((type) => type.id === selected.id))].sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    const city = cities.find((item) => item.id === form.cityId) || form.city;

    return <Paper component="form" variant="outlined" noValidate onSubmit={(event) => { event.preventDefault(); save(true); }} sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', borderColor: '#e2e8f0', borderRadius: 1, '& .MuiInputBase-root': { fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 13 }, '& .MuiInputLabel-root.Mui-focused': { color: '#b61f4b' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#b61f4b' } }}>
        <Typography component="h1" sx={{ fontSize: 20, fontWeight: 600, pb: 2, borderBottom: '1px solid #e2e8f0' }}>{venuePropertyId ? 'Edit Property' : 'Add Property'}</Typography>
        {loading ? <Box role="status" sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={28} /><Typography sx={{ mt: 2 }}>Loading property...</Typography></Box> : loadError ? <Stack direction="row" spacing={2} sx={{ py: 3 }}><Button onClick={retry}>Retry loading property</Button><Button component={Link} href={PROPERTY_ROUTES.list}>Back to properties</Button></Stack> : <>
            {optionsLoading && <Typography role="status" sx={{ mt: 2, fontSize: 13, color: '#64748b' }}>Loading cities and venue types...</Typography>}
            {optionsError && <Button type="button" onClick={retry} sx={{ mt: 2 }}>Retry loading options</Button>}
            {!optionsLoading && !optionsError && !venueTypes.length && <Typography sx={{ mt: 2, fontSize: 13, color: '#64748b' }}>No approved venue types are available for this account.</Typography>}
            <Box component="fieldset" disabled={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Section title="Property details"><Box sx={grid}>
                    <TextField label="Property title" value={form.title} onChange={(event) => update('title', event.target.value)} size="small" required />
                    <TextField label="Starting price (₹)" type="number" value={form.startingPrice} onChange={(event) => update('startingPrice', event.target.value)} slotProps={{ htmlInput: { min: 0, step: 'any' } }} size="small" required />
                    <TextField select label="Price type" value={form.priceType} onChange={(event) => update('priceType', event.target.value)} size="small">{[...new Set(['STARTING_FROM', form.priceType])].map((type) => <MenuItem key={type} value={type}>{type.toLowerCase().replaceAll('_', ' ')}</MenuItem>)}</TextField>
                    <TextField label="Description" value={form.description} onChange={(event) => update('description', event.target.value)} multiline minRows={4} size="small" sx={{ gridColumn: '1 / -1' }} />
                </Box></Section>
                <Section title="Location and address"><Box sx={grid}>
                    <Autocomplete options={cities} value={city} getOptionLabel={(item) => item.name || 'Selected city'} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, item) => setForm((current) => ({ ...current, city: item, cityId: item?.id || '' }))} disabled={busy || optionsLoading} renderInput={(params) => <TextField {...params} label="City" size="small" required />} />
                    {['street', 'locality', 'state', 'pincode', 'country'].map((key) => <TextField key={key} label={key === 'pincode' ? 'Pincode / Postal code' : key.charAt(0).toUpperCase() + key.slice(1)} value={form.address[key]} onChange={(event) => setForm((current) => ({ ...current, address: { ...current.address, [key]: event.target.value } }))} size="small" />)}
                </Box></Section>
                <Section title="Capacity and amenities"><Box sx={grid}>
                    {[['capacityMin', 'Minimum capacity'], ['capacityMax', 'Maximum capacity'], ['rooms', 'Rooms'], ['parkingCapacity', 'Parking capacity']].map(([key, text]) => <TextField key={key} label={text} type="number" value={form[key]} onChange={(event) => update(key, event.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} size="small" required={key.startsWith('capacity')} />)}
                    <Autocomplete multiple freeSolo options={['Parking', 'Bridal room', 'In-house catering']} value={form.amenities} onChange={(_, items) => update('amenities', items)} disabled={busy} renderInput={(params) => <TextField {...params} label="Amenities" helperText="Type an amenity and press Enter to add it." size="small" />} sx={{ gridColumn: { sm: '1 / -1' } }} />
                    <FormControlLabel control={<Checkbox checked={Boolean(form.metadata.alcoholAllowed)} onChange={(event) => update('metadata', { ...form.metadata, alcoholAllowed: event.target.checked })} disabled={busy} />} label="Alcohol allowed" />
                    <FormControlLabel control={<Checkbox checked={Boolean(form.metadata.outsideCateringAllowed)} onChange={(event) => update('metadata', { ...form.metadata, outsideCateringAllowed: event.target.checked })} disabled={busy} />} label="Outside catering allowed" />
                </Box></Section>
                <Section title="Venue types"><Autocomplete multiple options={typeOptions} value={selectedTypes} groupBy={(item) => item.categoryName} getOptionLabel={(item) => item.name || 'Selected venue type'} isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, items) => update('venueTypes', items)} disabled={busy || optionsLoading} renderInput={(params) => <TextField {...params} label="Venue types" placeholder="Select venue types" size="small" required />} /></Section>
                <Section title="Property images"><input ref={input} type="file" accept="image/*" multiple hidden onChange={upload} /><Button type="button" variant="outlined" onClick={() => input.current?.click()} disabled={busy} startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadOutlined />} sx={buttonSx}>Upload images</Button><ListingMediaGallery media={form.media} disabled={busy} onRemove={(index) => update('media', form.media.filter((_, i) => i !== index))} /></Section>
            </Box>
            {venuePropertyId && <Typography sx={{ mt: 2, fontSize: 13, color: '#64748b' }}>Save changes as a draft before submitting them for review.</Typography>}
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'flex-end', mt: 3, pt: 2.5, borderTop: '1px solid #e2e8f0' }}>
                <Button type="button" variant="outlined" disabled={busy || optionsLoading || Boolean(optionsError)} onClick={() => save(false)} startIcon={saving === 'draft' ? <CircularProgress size={16} /> : <SaveOutlined />} sx={{ ...buttonSx, color: '#b61f4b', borderColor: '#b61f4b' }}>Draft Property</Button>
                <Button type="submit" variant="contained" disabled={busy || (!venuePropertyId && (optionsLoading || Boolean(optionsError)))} startIcon={saving === 'review' ? <CircularProgress size={16} /> : <SendOutlined />} sx={{ ...buttonSx, bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>Submit Property</Button>
            </Stack>
        </>}
        <PropertyFeedback feedback={feedback} onClose={async () => { setFeedback(null); if (destination) { const path = destination; setDestination(''); await router.replace(path); } }} />
    </Paper>;
}
