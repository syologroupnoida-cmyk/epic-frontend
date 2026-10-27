import { useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, ListItemText, Menu, MenuItem, TablePagination, TextField } from '@mui/material';
import { adminPropertyId, fetchAdminProperties, moderateAdminProperty } from '@/util/adminProperties.mjs';
import { displayName, listingError, statusLabel } from '@/util/adminListings.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import { ViewOutlined } from '@/components/vendor/listings/ServiceIcons';
import PropertyFeedback from '@/components/vendor/properties/PropertyFeedback';
import PropertyListingDetails from './PropertyListingDetails';

const statuses = ['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'DRAFT'];
const money = (value) => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
const date = (value) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';

export default function PropertyListingList() {
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(-1);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [apiSearch, setApiSearch] = useState('');
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [menu, setMenu] = useState(null);
    const [detailId, setDetailId] = useState('');
    const [target, setTarget] = useState(null);
    const [reason, setReason] = useState('');
    const [actionError, setActionError] = useState('');
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const actionLock = useRef(false);
    const mounted = useRef(true);
    const statusOptions = [...new Set([...statuses, status, ...rows.map((property) => property.status).filter(Boolean)])].filter(Boolean);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const timeout = setTimeout(() => { setApiSearch(search.trim()); setPage(0); }, 350);
        return () => clearTimeout(timeout);
    }, [search]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setLoadError(''); } });
        fetchAdminProperties({ page: page + 1, limit, status, search: apiSearch }, controller.signal).then((result) => {
            if (controller.signal.aborted) return;
            if (!result.items.length && page > 0) { setPage((value) => value - 1); return; }
            setRows(result.items); setTotal(result.total); setHasNextPage(result.hasNextPage);
        }).catch((err) => {
            if (!controller.signal.aborted) { const message = listingError(err); setLoadError(message); setRows([]); setTotal(-1); setHasNextPage(false); setFeedback({ status: 'error', message }); }
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, limit, status, apiSearch, refresh]);

    function openAction(property, action) { setMenu(null); setReason(''); setActionError(''); setTarget({ property, action }); }
    function closeAction() { if (!actionLock.current) setTarget(null); }
    async function confirmAction(event) {
        event.preventDefault();
        if (!target || actionLock.current) return;
        if (target.action === 'reject' && !reason.trim()) { setActionError('Enter a rejection reason.'); return; }
        actionLock.current = true; setBusy(true); setActionError('');
        try {
            await moderateAdminProperty(adminPropertyId(target.property), target.action, reason);
            if (!mounted.current) return;
            setFeedback({ status: 'success', message: target.action === 'approve' ? 'Property approved successfully.' : 'Property rejected successfully.' });
            setTarget(null); setDetailId(''); setRefresh((value) => value + 1);
        } catch (err) { if (mounted.current) setActionError(listingError(err)); }
        finally { actionLock.current = false; if (mounted.current) setBusy(false); }
    }

    return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Property List</h1>{loadError && <Button onClick={() => setRefresh((value) => value + 1)} sx={{ textTransform: 'none' }}>Retry</Button>}</div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
            <TextField select label="Status" size="small" value={status} disabled={busy} onChange={(event) => { setStatus(event.target.value); setPage(0); setLoading(true); }} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, MenuProps: { disableScrollLock: true } } }} sx={{ minWidth: 180, '& .MuiInputBase-root': { fontSize: 13 } }}>
                <MenuItem value="" sx={{ fontSize: 13 }}>All statuses</MenuItem>{statusOptions.map((value) => <MenuItem key={value} value={value} sx={{ fontSize: 13, textTransform: 'capitalize' }}>{statusLabel(value)}</MenuItem>)}
            </TextField>
            <label className="relative block w-full md:w-[360px]">
                <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></span>
                <input type="search" aria-label="Search properties" placeholder="Search properties" value={search} disabled={busy} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#b61f4b]" />
            </label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm" aria-label="Admin property listings">
            <colgroup><col className="w-[25%]" /><col className="w-[17%]" /><col className="w-[13%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[11%]" /><col className="w-[6%]" /></colgroup>
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Title', 'Vendor', 'City', 'Starting price', 'Status', 'Created On', 'Actions'].map((title) => <th key={title} className={`px-4 py-2.5 text-[13px] font-semibold ${title === 'Actions' ? 'text-right' : ''}`}>{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">{loading ? <tr><td colSpan={7} role="status" className="px-4 py-12 text-center text-slate-500">Loading properties...</td></tr> : !rows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{loadError ? 'Property listings could not be loaded.' : 'No properties found.'}</td></tr> : rows.map((property) => {
                const id = adminPropertyId(property);
                const badge = ['APPROVED', 'ACTIVE', 'PUBLISHED'].includes(property.status) ? 'bg-emerald-100 text-emerald-700' : property.status === 'REJECTED' ? 'bg-red-50 text-red-700' : property.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
                return <tr key={id} className="bg-white hover:bg-slate-50">
                    <td className="break-words px-4 py-3 font-semibold text-slate-800">{property.title || 'Untitled property'}</td>
                    <td className="break-words px-4 py-3 text-xs text-slate-700">{displayName(property.vendor?.profile || property.vendor?.vendorProfile || property.vendorProfile || property.vendor) || displayName(property.vendorUser) || property.vendorName || '—'}</td>
                    <td className="break-words px-4 py-3 text-xs text-slate-700">{displayName(property.city) || property.cityName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{money(property.startingPrice)}</td>
                    <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge}`}>{statusLabel(property.status)}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-700">{date(property.createdAt)}</td>
                    <td className="px-4 py-3"><button type="button" disabled={busy} aria-label={`Actions for ${property.title || 'property'}`} aria-haspopup="menu" aria-expanded={menu?.property === property ? true : undefined} onClick={(event) => setMenu({ anchor: event.currentTarget, property })} className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">{[0, 1, 2].map((dot) => <span key={dot} className="h-[3px] w-[3px] rounded-full bg-current" aria-hidden="true" />)}</button></td>
                </tr>;
            })}</tbody>
        </table></div>
        <TablePagination component="div" count={total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, value) => { setPage(value); setLoading(true); }} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); setLoading(true); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || busy || !hasNextPage }, previousButton: { disabled: loading || busy || page === 0 } } }} sx={agentListPaginationSx} />
        <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock slotProps={{ list: { dense: true }, paper: { sx: { minWidth: 160, '& .MuiMenuItem-root': { fontSize: 13 } } } }}>
            <MenuItem disabled={busy} onClick={() => { if (menu) { setDetailId(adminPropertyId(menu.property)); setMenu(null); } }}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon><ListItemText>View details</ListItemText></MenuItem>
        </Menu>
        {detailId && <PropertyListingDetails key={detailId} id={detailId} onClose={() => setDetailId('')} onAction={openAction} busy={busy} />}
        <Dialog open={Boolean(target)} onClose={closeAction} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="moderate-property-title" aria-describedby="moderate-property-description">
            <form onSubmit={confirmAction} noValidate><DialogTitle id="moderate-property-title" sx={{ textTransform: 'capitalize' }}>{target?.action} property?</DialogTitle><DialogContent>
                <DialogContentText id="moderate-property-description" sx={{ mb: 2, fontSize: 14 }}>{target?.property.title || 'This property'}</DialogContentText>
                {target?.action === 'reject' && <TextField autoFocus label="Rejection reason" value={reason} onChange={(event) => { setReason(event.target.value); setActionError(''); }} fullWidth multiline minRows={3} size="small" required disabled={busy} />}
                {actionError && <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>}
            </DialogContent><DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={closeAction} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button><Button type="submit" disabled={busy} variant="contained" sx={{ textTransform: 'capitalize', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>{busy ? 'Saving...' : `${target?.action || 'Confirm'} property`}</Button></DialogActions></form>
        </Dialog>
        <PropertyFeedback feedback={feedback} onClose={() => setFeedback(null)} />
    </section>;
}
