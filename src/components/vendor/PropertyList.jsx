import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, ListItemText, Menu, MenuItem, TablePagination, TextField } from '@mui/material';
import { DeleteOutline, EditOutlined, Restore } from './listings/ServiceIcons';
import { agentListPaginationSlotProps, agentListPaginationSx } from './listings/tableStyles';
import { errorMessage } from './listings/listingApi';
import { archivedProperty, PROPERTY_ROUTES, propertyId } from './properties/propertyModel';
import { deleteProperty, fetchProperties, restoreProperty } from './properties/propertyApi';
import PropertyDetails from './properties/PropertyDetails';
import PropertyFeedback from './properties/PropertyFeedback';

const statuses = ['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'DRAFT', 'ARCHIVED'];
const propertyStatus = (property) => archivedProperty(property) ? 'ARCHIVED' : property.status || 'DRAFT';

const price = (value) => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
const date = (value) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
function ViewIcon() { return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>; }

export default function PropertyList() {
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
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleted, setDeleted] = useState([]);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const actionLock = useRef(false);
    const mounted = useRef(true);
    const localDeleted = deleted.filter((item) => item.page === page && item.limit === limit && item.search === apiSearch && item.status === status && (!status || propertyStatus(item.property) === status)).map((item) => item.property);
    const localDeletedCount = localDeleted.length;
    const visibleRows = [...rows, ...localDeleted.filter((item) => !rows.some((row) => propertyId(row) === propertyId(item)))].map((item) => localDeleted.find((row) => propertyId(row) === propertyId(item)) || item).filter((item) => !status || propertyStatus(item) === status);
    const statusOptions = [...new Set([...statuses, status, ...rows.map(propertyStatus)])].filter(Boolean);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const timeout = setTimeout(() => { setApiSearch(search.trim()); setPage(0); }, 350);
        return () => clearTimeout(timeout);
    }, [search]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setLoadError(''); } });
        fetchProperties(page + 1, limit, controller.signal, { status, search: apiSearch }).then((result) => {
            if (controller.signal.aborted) return;
            if (!result.items.length && page > 0 && !localDeletedCount) { setPage((value) => value - 1); return; }
            setRows(result.items); setTotal(result.total); setHasNextPage(result.hasNextPage);
        }).catch((err) => {
            if (!controller.signal.aborted) { const message = errorMessage(err); setRows([]); setTotal(-1); setHasNextPage(false); setLoadError(message); setFeedback({ status: 'error', message }); }
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, limit, status, apiSearch, refresh, localDeletedCount]);

    async function act(property, restore = false) {
        if (actionLock.current) return;
        actionLock.current = true; setBusy(true); setMenu(null);
        try {
            if (restore) await restoreProperty(propertyId(property)); else await deleteProperty(propertyId(property));
            if (!mounted.current) return;
            if (restore) setDeleted((items) => items.filter((item) => propertyId(item.property) !== propertyId(property)));
            else setDeleted((items) => [...items.filter((item) => propertyId(item.property) !== propertyId(property)), { page, limit, status, search: apiSearch, property: { ...property, isArchived: true } }]);
            setDeleteTarget(null); setDetailId(''); setRefresh((value) => value + 1);
            setFeedback({ status: 'success', message: restore ? 'Property restored successfully.' : 'Property deleted successfully. Use its three-dot menu to restore it.' });
        } catch (err) { if (mounted.current) setFeedback({ status: 'error', message: errorMessage(err) }); }
        finally { actionLock.current = false; if (mounted.current) setBusy(false); }
    }

    return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Property List</h1>{loadError && <Button onClick={() => setRefresh((value) => value + 1)} sx={{ textTransform: 'none' }}>Retry</Button>}</div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
            <TextField select label="Status" size="small" value={status} disabled={busy} onChange={(event) => { setStatus(event.target.value); setPage(0); setLoading(true); }} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, MenuProps: { disableScrollLock: true } } }} sx={{ minWidth: 180, '& .MuiInputBase-root': { fontSize: 13 } }}>
                <MenuItem value="" sx={{ fontSize: 13 }}>All statuses</MenuItem>{statusOptions.map((value) => <MenuItem key={value} value={value} sx={{ fontSize: 13, textTransform: 'capitalize' }}>{value.toLowerCase().replaceAll('_', ' ')}</MenuItem>)}
            </TextField>
            <label className="relative block w-full md:w-[360px]">
                <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></span>
                <input type="search" aria-label="Search properties" placeholder="Search properties" value={search} disabled={busy} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#b61f4b]" />
            </label>
        </div>
        <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[860px] table-fixed text-left text-sm" aria-label="Vendor property listings">
            <colgroup><col className="w-[26%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[12%]" /><col className="w-[6%]" /></colgroup>
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Title', 'City', 'Capacity', 'Starting price', 'Status', 'Created On', 'Actions'].map((title) => <th key={title} className={`px-4 py-2.5 text-[13px] font-semibold ${title === 'Actions' ? 'text-right' : ''}`}>{title}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">{loading ? <tr><td colSpan={7} role="status" className="px-4 py-12 text-center text-slate-500">Loading properties...</td></tr> : !visibleRows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{loadError ? 'Property listings could not be loaded.' : 'No properties found.'}</td></tr> : visibleRows.map((property) => {
                const id = propertyId(property);
                const status = propertyStatus(property);
                return <tr key={id} className="bg-white hover:bg-slate-50">
                    <td className="break-words px-4 py-3 font-semibold text-slate-800">{property.title || 'Untitled property'}</td>
                    <td className="break-words px-4 py-3 text-xs text-slate-700">{property.city?.name || property.cityName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{property.capacityMin ?? '—'} – {property.capacityMax ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{price(property.startingPrice)}</td>
                    <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${['ACTIVE', 'APPROVED', 'PUBLISHED'].includes(status) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status.toLowerCase().replaceAll('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-700">{date(property.createdAt)}</td>
                    <td className="px-4 py-3"><button type="button" disabled={busy} aria-label={`Actions for ${property.title || 'property'}`} aria-haspopup="menu" aria-expanded={menu?.property === property ? true : undefined} onClick={(event) => setMenu({ anchor: event.currentTarget, property })} className="ml-auto flex h-6 w-6 items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">{[0, 1, 2].map((dot) => <span key={dot} className="h-[3px] w-[3px] rounded-full bg-current" />)}</button></td>
                </tr>;
            })}</tbody>
        </table></div>
        <TablePagination component="div" count={total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || busy || !hasNextPage }, previousButton: { disabled: loading || busy || page === 0 } } }} sx={agentListPaginationSx} />
        <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock slotProps={{ list: { dense: true }, paper: { sx: { minWidth: 160, '& .MuiMenuItem-root': { fontSize: 13 } } } }}>
            {menu && [
                <MenuItem key="view" onClick={() => { setDetailId(propertyId(menu.property)); setMenu(null); }}><ListItemIcon><ViewIcon /></ListItemIcon><ListItemText>View details</ListItemText></MenuItem>,
                <MenuItem key="edit" component={Link} href={PROPERTY_ROUTES.edit(propertyId(menu.property))} disabled={busy || archivedProperty(menu.property)} onClick={() => setMenu(null)}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon><ListItemText>Edit property</ListItemText></MenuItem>,
                <MenuItem key="delete" disabled={busy || archivedProperty(menu.property)} onClick={() => { setDeleteTarget(menu.property); setMenu(null); }} sx={{ color: '#b42318' }}><ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon><ListItemText>Delete property</ListItemText></MenuItem>,
                <MenuItem key="restore" disabled={busy || !archivedProperty(menu.property)} onClick={() => act(menu.property, true)}><ListItemIcon><Restore fontSize="small" /></ListItemIcon><ListItemText>Restore property</ListItemText></MenuItem>,
            ]}
        </Menu>
        {detailId && <PropertyDetails key={detailId} id={detailId} onClose={() => setDetailId('')} />}
        <Dialog open={Boolean(deleteTarget)} onClose={() => { if (!busy) setDeleteTarget(null); }} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="delete-property-title"><DialogTitle id="delete-property-title">Delete property?</DialogTitle><DialogContent><DialogContentText>Delete “{deleteTarget?.title}”? You can restore it from its three-dot menu afterwards.</DialogContentText></DialogContent><DialogActions sx={{ p: 2 }}><Button disabled={busy} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button disabled={busy} color="error" variant="contained" onClick={() => act(deleteTarget)}>{busy ? 'Deleting...' : 'Delete property'}</Button></DialogActions></Dialog>
        <PropertyFeedback feedback={feedback} onClose={() => setFeedback(null)} />
    </section>;
}
