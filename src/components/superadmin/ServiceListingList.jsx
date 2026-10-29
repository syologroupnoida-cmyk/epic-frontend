import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, TablePagination, TextField } from '@mui/material';
import ServiceListingDetails from './ServiceListingDetails';
import { displayName, fetchAdminListings, listingError, listingId, moderateServiceListing, serviceListingActions, statusLabel } from '@/util/adminListings.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';

const statusOptions = ['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'DRAFT', ''];
const successMessages = { approve: 'Service approved successfully.', reject: 'Service rejected successfully.', pause: 'Service paused successfully.', resume: 'Service resumed successfully.' };
const money = (value) => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));

function ActionIcon({ action }) {
    return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mr-2 shrink-0">
        {action === 'view' ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></> : action === 'pause' ? <><path d="M8 5v14M16 5v14" strokeWidth="3" /></> : <path d="m8 5 11 7-11 7V5Z" strokeLinejoin="round" />}
    </svg>;
}

export default function ServiceListingList() {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(-1);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [status, setStatus] = useState('');
    const [hasNextPage, setHasNextPage] = useState(false);
    const [search, setSearch] = useState('');
    const [apiSearch, setApiSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [menu, setMenu] = useState(null);
    const [detailId, setDetailId] = useState('');
    const [target, setTarget] = useState(null);
    const [reason, setReason] = useState('');
    const [actionError, setActionError] = useState('');
    const [busy, setBusy] = useState(false);
    const actionLock = useRef(false);
    const mounted = useRef(true);
    const requiresReason = target && ['reject', 'pause'].includes(target.action);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const timeout = setTimeout(() => { setApiSearch(search.trim()); setPage(0); }, 350);
        return () => clearTimeout(timeout);
    }, [search]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(''); } });
        fetchAdminListings({ page: page + 1, limit, status, search: apiSearch }, controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            if (!result.items.length && page > 0) { setPage((value) => value - 1); return; }
            setRows(result.items); setTotal(result.total); setHasNextPage(result.hasNextPage);
        }).catch((err) => { if (!controller.signal.aborted) { setError(listingError(err)); setRows([]); setTotal(-1); setHasNextPage(false); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, limit, status, apiSearch, refresh]);

    function openAction(listing, action) {
        setMenu(null); setReason(''); setActionError(''); setTarget({ listing, action });
    }
    function closeAction() { if (!actionLock.current) setTarget(null); }
    async function confirmAction(event) {
        event.preventDefault();
        if (!target || actionLock.current) return;
        if (requiresReason && !reason.trim()) { setActionError('A reason is required.'); return; }
        actionLock.current = true; setBusy(true); setActionError('');
        try {
            await moderateServiceListing(listingId(target.listing), target.action, reason);
            if (!mounted.current) return;
            setNotice(successMessages[target.action]); setTarget(null); setDetailId(''); setRefresh((value) => value + 1);
        } catch (err) { if (mounted.current) setActionError(listingError(err)); }
        finally { actionLock.current = false; if (mounted.current) setBusy(false); }
    }

    return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Service Listings</h1></div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
            <TextField select label="Status" size="small" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, MenuProps: { disableScrollLock: true } } }} sx={{ minWidth: 180, '& .MuiInputBase-root': { fontSize: 13 } }}>{statusOptions.map((value) => <MenuItem key={value} value={value} sx={{ fontSize: 13, textTransform: 'capitalize' }}>{value ? statusLabel(value) : 'All statuses'}</MenuItem>)}</TextField>
            <label className="relative block w-full md:w-[360px]">
                <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></span>
                <input type="search" aria-label="Search service listings" placeholder="Search service listings" value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#b61f4b]" />
            </label>
        </div>
        {error && <Alert severity="error" sx={{ m: 2, flexShrink: 0 }} action={<Button onClick={() => setRefresh((value) => value + 1)}>Retry</Button>}>{error}</Alert>}
        <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm" aria-label="Admin service listings">
                <colgroup><col className="w-[25%]" /><col className="w-[17%]" /><col className="w-[13%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[11%]" /><col className="w-[6%]" /></colgroup>
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Title', 'Vendor', 'City', 'Starting price', 'Status', 'Created On', 'Actions'].map((title) => <th key={title} className={`px-4 py-2.5 text-[13px] font-semibold ${title === 'Actions' ? 'text-right' : ''}`}>{title}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-200">
                    {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500" role="status">Loading service listings…</td></tr> : !rows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{error ? 'Unable to load service listings.' : 'No service listings found.'}</td></tr> : rows.map((listing) => {
                        const id = listingId(listing);
                        const title = listing.title || 'Untitled service';
                        const titleWords = title.trim().split(/\s+/);
                        const shortTitle = titleWords.length > 3 ? `${titleWords.slice(0, 3).join(' ')}...` : title;
                        const approved = ['APPROVED', 'ACTIVE', 'PUBLISHED'].includes(listing.status);
                        const badge = approved ? 'bg-emerald-100 text-emerald-700' : listing.status === 'REJECTED' ? 'bg-red-50 text-red-700' : listing.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
                        return <tr key={id} className="bg-white hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-800"><button type="button" disabled={busy} onClick={() => setDetailId(id)} title={title} aria-label={title} className="block max-w-full cursor-pointer truncate text-left hover:text-[#b61f4b]">{shortTitle}</button></td>
                            <td className="break-words px-4 py-3 text-xs text-slate-700">{displayName(listing.vendor?.profile || listing.vendor?.vendorProfile || listing.vendorProfile || listing.vendor) || displayName(listing.vendorUser) || listing.vendorName || '—'}</td>
                            <td className="break-words px-4 py-3 text-xs text-slate-700">{displayName(listing.city) || listing.cityName || '—'}</td>
                            <td className="px-4 py-3 text-xs text-slate-700">{money(listing.startingPrice)}</td>
                            <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge}`}>{statusLabel(listing.status)}</span></td>
                            <td className="px-4 py-3 text-xs text-slate-700">{listing.createdAt && !Number.isNaN(Date.parse(listing.createdAt)) ? new Date(listing.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'}</td>
                            <td className="px-4 py-3"><button type="button" aria-label={`Actions for ${listing.title || 'service'}`} aria-haspopup="menu" aria-expanded={menu?.listing === listing ? true : undefined} disabled={busy} onClick={(event) => setMenu({ anchor: event.currentTarget, listing })} className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">{[0, 1, 2].map((dot) => <span key={dot} className="h-[3px] w-[3px] rounded-full bg-current" aria-hidden="true" />)}</button></td>
                        </tr>;
                    })}
                </tbody>
            </table>
        </div>
        <TablePagination component="div" count={total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || !hasNextPage }, previousButton: { disabled: loading || page === 0 } } }} sx={{ ...agentListPaginationSx, minHeight: 48 }} />
        <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { dense: true }, paper: { sx: { minWidth: 160, '& .MuiMenuItem-root': { fontSize: 13 } } } }}>
            <MenuItem disabled={busy} onClick={() => { if (menu) { setDetailId(listingId(menu.listing)); setMenu(null); } }}><ActionIcon action="view" />View detail</MenuItem>
            {menu && ['pause', 'resume'].map((action) => <MenuItem key={action} disabled={busy || !serviceListingActions(menu.listing).includes(action)} onClick={() => openAction(menu.listing, action)} sx={{ textTransform: 'capitalize', color: action === 'pause' ? '#b42318' : '#166534' }}><ActionIcon action={action} />{action}</MenuItem>)}
        </Menu>
        {detailId && <ServiceListingDetails key={detailId} id={detailId} onClose={() => setDetailId('')} onAction={openAction} busy={busy} />}
        <Dialog open={Boolean(notice)} onClose={() => setNotice('')} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="service-operation-success-title" aria-describedby="service-operation-success-description" slotProps={{ paper: { sx: { borderRadius: 2, p: 1, textAlign: 'center' } } }}>
            <div className="mx-auto mt-5 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></div>
            <DialogTitle id="service-operation-success-title" sx={{ fontSize: 19, fontWeight: 600 }}>Service updated</DialogTitle>
            <DialogContent><DialogContentText id="service-operation-success-description">{notice}</DialogContentText></DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}><Button type="button" autoFocus variant="contained" onClick={() => setNotice('')} sx={{ textTransform: 'none', minWidth: 100, bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>OK</Button></DialogActions>
        </Dialog>
        <Dialog open={Boolean(target)} onClose={closeAction} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="moderate-service-title" aria-describedby="moderate-service-description">
            <form onSubmit={confirmAction} noValidate>
                <DialogTitle id="moderate-service-title" sx={{ textTransform: 'capitalize', fontSize: 18, fontWeight: 600 }}>{target?.action} service?</DialogTitle>
                <DialogContent>
                    <DialogContentText id="moderate-service-description" sx={{ fontSize: 14, mb: 2 }}>{target?.listing.title || 'This service listing'}</DialogContentText>
                    {requiresReason && <TextField autoFocus label={target.action === 'reject' ? 'Rejection reason' : 'Pause reason'} value={reason} onChange={(event) => { setReason(event.target.value); setActionError(''); }} fullWidth multiline minRows={3} size="small" required disabled={busy} />}
                    {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button type="button" disabled={busy} onClick={closeAction} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button><Button type="submit" disabled={busy} variant="contained" sx={{ textTransform: 'capitalize', bgcolor: '#b61f4b', color: '#fff', '&:hover': { bgcolor: '#981a3f' } }}>{busy ? 'Saving…' : `${target?.action || 'Confirm'} service`}</Button></DialogActions>
            </form>
        </Dialog>
    </section>;
}
