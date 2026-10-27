import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Add, CloudUploadOutlined, DeleteOutline, SaveOutlined, SendOutlined } from './listings/ServiceIcons';
import { Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { errorMessage, fetchListing, fetchLookup, fetchServiceCapabilities, itemId, itemName, listingApiConfig, saveListing, submitListing, uploadListingImage } from './listings/listingApi';
import { buildListingPayload, emptyListing, emptyService, enrichListingLookups, listingToForm } from './listings/listingModel';
import { getMetadataFields } from './listings/metadata/fields';
import MetadataFields from './listings/MetadataFields';
import ListingMediaGallery from './listings/ListingMediaGallery';
import { VENDOR_SERVICE_ROUTES } from '@/util/serviceRoutes';

const orange = '#b61f4b';
const grid = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 };
const buttonSx = { textTransform: 'none', fontWeight: 700, borderRadius: 1, minHeight: 38 };
const menuProps = { disableScrollLock: true, slotProps: { paper: { sx: { maxHeight: 300 } } } };
const baseFields = [
    { key: 'teamSize', label: 'Team size', type: 'number', example: 5 },
    { key: 'guestCapacity', label: 'Guest capacity', type: 'number', example: 500 },
];

function Section({ title, children }) {
    return <Box component="section" data-service-form-section sx={{ py: 3, borderBottom: '1px solid #e2e8f0', '&:first-of-type': { pt: 0 }, '&:last-child': { borderBottom: 0, pb: 0 } }}><Typography component="h2" sx={{ fontSize: 14, fontWeight: 600, color: '#334155', mb: 2.5 }}>{title}</Typography>{children}</Box>;
}

export default function AddService({ listingId = '', routes = VENDOR_SERVICE_ROUTES }) {
    const router = useRouter();
    const [storedForm, setForm] = useState(emptyListing);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const form = useMemo(() => enrichListingLookups(storedForm, categories, cities), [storedForm, categories, cities]);
    const listingMetadataFields = [...baseFields, ...getMetadataFields('', '', form.metadata).filter((field) => !baseFields.some((base) => base.key === field.key))];
    const [loading, setLoading] = useState(Boolean(listingId));
    const [lookupLoading, setLookupLoading] = useState(true);
    const [lookupError, setLookupError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(() => router.query.saved === 'review' ? 'Your listing has been submitted for review.' : router.query.saved === 'draft' ? 'Your listing has been saved as a draft.' : '');
    const [savedDestination, setSavedDestination] = useState('');
    const fileInput = useRef(null);
    const busy = loading || Boolean(submitting) || uploading;

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            const result = await Promise.allSettled([
                fetchServiceCapabilities(controller.signal),
                fetchLookup(listingApiConfig.cities, {}, controller.signal),
            ]);
            if (controller.signal.aborted) return;
            if (result[0].status === 'fulfilled') setCategories(result[0].value.filter((item) => item.isActive !== false));
            if (result[1].status === 'fulfilled') setCities(result[1].value.filter((item) => item.isActive !== false));
            if (result.some((item) => item.status === 'rejected')) setLookupError('Some service or city options could not be loaded. Please refresh and try again.');
            setLookupLoading(false);
        }
        load();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!listingId) return undefined;
        const controller = new AbortController();
        fetchListing(listingId, controller.signal).then((listing) => {
            if (!controller.signal.aborted) setForm(listingToForm(listing));
        }).catch((err) => {
            if (!controller.signal.aborted) setLoadError(errorMessage(err, 'Unable to load the listing.'));
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [listingId]);

    const update = (key, value) => { setSaved(''); setForm((current) => ({ ...current, [key]: value })); };
    const updateService = (index, values) => {
        setSaved('');
        setForm((current) => ({ ...current, services: current.services.map((service, i) => i === index ? { ...service, ...values } : service) }));
    };

    async function submit(submitForReview) {
        if (busy) return;
        setError('');
        setSaved('');
        // Review submission publishes the saved listing through its dedicated action.
        if (listingId && submitForReview) {
            setSubmitting('review');
            try {
                await submitListing(listingId);
                setSaved('Your listing has been submitted for review.');
            } catch (err) { setError(errorMessage(err)); }
            finally { setSubmitting(''); }
            return;
        }
        let payload;
        try {
            if (lookupLoading || lookupError) throw new Error('Wait for service options to load, or refresh and try again.');
            if (form.services.some((service) => !categories.some((category) => itemId(category) === service.categoryId && category.subcategories.some((item) => itemId(item) === service.serviceSubcategoryId)))) {
                throw new Error('Select an approved category and subcategory for each service.');
            }
            payload = buildListingPayload(form, submitForReview);
        } catch (err) { setError(err.message); return; }
        setSubmitting(submitForReview ? 'review' : 'draft');
        try {
            const result = await saveListing(listingId, payload);
            const savedId = itemId(result?.listing || result);
            const message = submitForReview ? 'Your listing has been submitted for review.' : 'Your listing has been saved as a draft.';
            if (!listingId && savedId) {
                setSavedDestination(routes.edit(savedId));
            } else if (!listingId) {
                setSavedDestination(routes.list);
            }
            setSaved(message);
        } catch (err) { setError(errorMessage(err)); }
        finally { setSubmitting(''); }
    }

    async function upload(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length) return;
        if (files.some((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) { setError('Choose image files smaller than 10 MB.'); return; }
        setUploading(true); setError('');
        // Keep successful uploads even when a later file fails.
        try {
            for (const file of files) {
                const media = await uploadListingImage(file);
                setForm((current) => ({ ...current, media: [...current.media, media] }));
            }
        } catch (err) { setError(errorMessage(err)); }
        finally { setUploading(false); }
    }

    if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress size={30} /><Typography sx={{ mt: 2 }}>Loading service details…</Typography></Box>;
    if (loadError) return <Alert severity="error" sx={{ m: 3 }} action={<Button component={Link} href={routes.list}>Back to services</Button>}>{loadError}</Alert>;

    return (
        <Paper component="form" variant="outlined" elevation={0} data-service-form-card noValidate onSubmit={(event) => { event.preventDefault(); submit(true); }} sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', borderColor: '#e2e8f0', borderRadius: 1, '& .MuiTextField-root': { minWidth: 0 }, '& .MuiInputBase-root': { fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 13 }, '& .MuiInputLabel-root.Mui-focused': { color: orange }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: orange } }}>
            <Typography component="h1" sx={{ fontSize: 20, fontWeight: 600, color: '#0f172a', mb: 2 }}>{listingId ? 'Edit Service' : 'Add Service'}</Typography>
            <Divider sx={{ mb: 3 }} />
            {lookupLoading && <Alert severity="info" sx={{ mb: 2 }}>Loading service categories and cities…</Alert>}
            {lookupError && <Alert severity="warning" sx={{ mb: 2 }}>{lookupError}</Alert>}
            {!lookupLoading && !lookupError && !categories.length && <Alert severity="info" sx={{ mb: 2 }}>No approved service capabilities are available for your account.</Alert>}
            <Box component="fieldset" disabled={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
                <Section title="Listing details">
                    <Box sx={grid}>
                        <TextField label="Listing title" value={form.title} onChange={(event) => update('title', event.target.value)} fullWidth size="small" required />
                        <TextField label="Starting price (₹)" type="number" value={form.startingPrice} onChange={(event) => update('startingPrice', event.target.value)} slotProps={{ htmlInput: { min: 0, step: 'any' } }} size="small" required /><TextField select label="Price type" value={form.priceType} onChange={(event) => update('priceType', event.target.value)} size="small" slotProps={{ select: { MenuProps: menuProps } }}>{[...new Set(['STARTING_FROM', form.priceType])].map((type) => <MenuItem key={type} value={type}>{type.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())}</MenuItem>)}</TextField>
                        <TextField label="Description" value={form.description} onChange={(event) => update('description', event.target.value)} fullWidth sx={{ gridColumn: '1 / -1' }} multiline minRows={4} size="small" />
                    </Box>
                </Section>
                <Section title="Location and coverage">
                    <Box sx={grid}>
                        <Autocomplete options={cities} value={form.city} getOptionLabel={(city) => itemName(city) || itemId(city)} isOptionEqualToValue={(a, b) => itemId(a) === itemId(b)} onChange={(_, city) => { update('city', city); update('cityId', city ? itemId(city) : ''); }} disabled={busy} renderInput={(params) => <TextField {...params} label="Primary city" required size="small" />} />
                        <Autocomplete multiple size="small" sx={{ '& .MuiOutlinedInput-root.MuiInputBase-sizeSmall': { minHeight: 40, py: 0.5 }, '& .MuiAutocomplete-tag': { height: 22, m: '2px', maxWidth: 'calc(100% - 4px)', fontSize: 12 }, '& .MuiChip-label': { px: 0.75 }, '& .MuiChip-deleteIcon': { fontSize: 16, ml: 0, mr: 0.5 } }} options={cities} value={form.serviceAreaCities} getOptionLabel={(city) => itemName(city) || itemId(city)} isOptionEqualToValue={(a, b) => itemId(a) === itemId(b)} onChange={(_, selected) => update('serviceAreaCities', selected)} disabled={busy} renderInput={(params) => <TextField {...params} label="Service area cities" size="small" />} />
                    </Box>
                </Section>
                <Section title="Team and capacity">
                    <Box sx={grid}><MetadataFields fields={listingMetadataFields} values={form.metadata} onChange={(key, value) => update('metadata', { ...form.metadata, [key]: value })} disabled={busy} /></Box>
                </Section>
                <Section title="Services and pricing">
                    <Stack spacing={2.5}>
                        {form.services.map((service, index) => {
                            const category = categories.find((item) => itemId(item) === service.categoryId);
                            const options = category?.subcategories || [];
                            const fields = getMetadataFields(service.categoryName || itemName(category), service.subcategoryName, service.metadata);
                            return <Box key={index} sx={{ pt: index ? 2.5 : 0, borderTop: index ? '1px solid #e2e8f0' : 0 }}>
                                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between",  mb: 2.5 }}><Typography component="h3" sx={{ fontSize: 14, fontWeight: 800 }}>Service {index + 1}</Typography><IconButton aria-label={`Remove service ${index + 1}`} disabled={busy || form.services.length === 1} onClick={() => update('services', form.services.filter((_, i) => i !== index))} size="small"><DeleteOutline fontSize="small" /></IconButton></Stack>
                                <Box sx={grid}>
                                    <TextField select label="Category" value={service.categoryId} disabled={busy || lookupLoading || !categories.length} size="small" slotProps={{ select: { MenuProps: menuProps } }} onChange={(event) => { const next = categories.find((item) => itemId(item) === event.target.value); updateService(index, { ...emptyService(), categoryId: event.target.value, categoryName: itemName(next), price: service.price }); }}>
                                        {service.categoryId && !category && <MenuItem disabled value={service.categoryId}>{service.categoryName || 'Current category'} (unavailable)</MenuItem>}
                                        {categories.map((item) => <MenuItem key={itemId(item)} value={itemId(item)}>{itemName(item)}</MenuItem>)}
                                    </TextField>
                                    <TextField select label="Subcategory" value={service.serviceSubcategoryId} disabled={busy || lookupLoading || !options.length} required size="small" slotProps={{ select: { MenuProps: menuProps } }} onChange={(event) => { const next = options.find((item) => itemId(item) === event.target.value); updateService(index, { serviceSubcategoryId: event.target.value, subcategoryName: itemName(next), metadata: {} }); }}>
                                        {service.serviceSubcategoryId && !options.some((item) => itemId(item) === service.serviceSubcategoryId) && <MenuItem disabled value={service.serviceSubcategoryId}>{service.subcategoryName || 'Current service'} (unavailable)</MenuItem>}
                                        {options.map((item) => <MenuItem key={itemId(item)} value={itemId(item)}>{itemName(item)}</MenuItem>)}
                                    </TextField>
                                    <TextField label="Service price (₹)" value={service.price} type="number" onChange={(event) => updateService(index, { price: event.target.value })} slotProps={{ htmlInput: { min: 0, step: 'any' } }} required size="small" />
                                </Box>
                                {fields.length > 0 && <><Divider sx={{ my: 2.5 }} /><Typography sx={{ fontSize: 13, fontWeight: 700, mb: 2 }}>Service details</Typography><Box sx={grid}><MetadataFields fields={fields} values={service.metadata} onChange={(key, value) => updateService(index, { metadata: { ...service.metadata, [key]: value } })} disabled={busy} /></Box></>}
                            </Box>;
                        })}
                        <Button onClick={() => update('services', [...form.services, emptyService()])} startIcon={<Add />} variant="outlined" sx={{ ...buttonSx, alignSelf: 'flex-start', color: '#b61f4b', borderColor: orange }}>Add another service</Button>
                    </Stack>
                </Section>
                <Section title="Portfolio media">
                    <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={upload} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
                        <Button startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadOutlined />} onClick={() => fileInput.current?.click()} variant="outlined" sx={{ ...buttonSx, flexShrink: 0 }}>Upload images</Button>
                        <ListingMediaGallery media={form.media} disabled={busy} onRemove={(index) => update('media', form.media.filter((_, i) => i !== index))} />
                    </Box>
                </Section>
            </Box>
            <Dialog open={Boolean(saved)} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="service-success-title" aria-describedby="service-success-description" slotProps={{ paper: { sx: { borderRadius: 2, p: 1, textAlign: 'center' } } }}>
                <Box sx={{ mx: 'auto', mt: 2, width: 64, height: 64, borderRadius: '50%', bgcolor: '#ecfdf5', display: 'grid', placeItems: 'center' }}><Box sx={{ width: 46, height: 46, borderRadius: '50%', bgcolor: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center' }}><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></Box></Box>
                <DialogTitle id="service-success-title" sx={{ fontSize: 19, fontWeight: 600 }}>Listing saved</DialogTitle>
                <DialogContent><DialogContentText id="service-success-description">{saved}</DialogContentText></DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button type="button" autoFocus variant="contained" onClick={async () => {
                        const destination = savedDestination;
                        setSaved('');
                        setSavedDestination('');
                        if (destination) await router.replace(destination);
                    }} sx={{ ...buttonSx, minWidth: 100, bgcolor: orange, '&:hover': { bgcolor: '#981a3f' } }}>OK</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={Boolean(error)} onClose={() => setError('')} maxWidth="xs" fullWidth disableScrollLock role="alertdialog" aria-labelledby="service-error-title" aria-describedby="service-error-description" slotProps={{ paper: { sx: { borderRadius: 2, p: 1, textAlign: 'center' } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Box component="svg" viewBox="0 0 48 48" aria-hidden="true" sx={{ width: 56, height: 56, color: orange }}>
                        <circle cx="24" cy="24" r="21" fill="currentColor" opacity="0.1" />
                        <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M24 14v12m0 7h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </Box>
                </Box>
                <DialogTitle id="service-error-title" sx={{ fontSize: 19, fontWeight: 600, pb: 1 }}>Unable to continue</DialogTitle>
                <DialogContent>
                    <DialogContentText id="service-error-description" sx={{ fontSize: 14, color: '#475569', overflowWrap: 'anywhere' }}>{error}</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button type="button" autoFocus variant="contained" onClick={() => setError('')} sx={{ ...buttonSx, minWidth: 100, bgcolor: orange, color: '#fff', boxShadow: 'none', '&:hover': { bgcolor: '#981a3f' } }}>OK</Button>
                </DialogActions>
            </Dialog>
            {listingId && <Typography sx={{ mt: 2, fontSize: 13, color: '#64748b' }}>Save changes as a draft before submitting them for review.</Typography>}
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "flex-end", pt: 2.5, mt: 3, borderTop: '1px solid #e2e8f0' }}>
                <Button type="button" onClick={() => submit(false)} disabled={busy} startIcon={submitting === 'draft' ? <CircularProgress size={16} /> : <SaveOutlined />} variant="outlined" sx={{ ...buttonSx, color: '#b61f4b', borderColor: orange }}>Draft Listing</Button>
                <Button type="submit" disabled={busy} startIcon={submitting === 'review' ? <CircularProgress size={16} /> : <SendOutlined />} variant="contained" sx={{ ...buttonSx, bgcolor: orange, color: '#fff', boxShadow: 'none', '&:hover': { bgcolor: '#981a3f' } }}>Submit Listing</Button>
            </Stack>
        </Paper>
    );
}
