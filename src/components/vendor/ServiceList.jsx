import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { VENDOR_SERVICE_ROUTES } from '@/util/serviceRoutes';
import { DeleteOutline, EditOutlined, Restore, ViewOutlined } from './listings/ServiceIcons';
import VendorServiceDetails from './listings/VendorServiceDetails';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, ListItemText, Menu, MenuItem, Stack, TablePagination, Typography } from '@mui/material';
import { agentListPaginationSlotProps, agentListPaginationSx } from './listings/tableStyles';
import { deleteListing, errorMessage, fetchListings, itemId, itemName, listingApiConfig, restoreListing } from './listings/listingApi';

const isArchived = (listing) => Boolean(listing.isArchived || listing.archivedAt || listing.deletedAt || ['ARCHIVED', 'DELETED'].includes(String(listing.status).toUpperCase()));
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const date = (value) => { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }); };
const orange = '#b61f4b';

export default function ServiceList({ routes = VENDOR_SERVICE_ROUTES }) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(-1);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [view, setView] = useState('');
    const [search, setSearch] = useState('');
    const [apiSearch, setApiSearch] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [menu, setMenu] = useState(null);
    const [detailId, setDetailId] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionBusy, setActionBusy] = useState(false);
    const [recentlyDeleted, setRecentlyDeleted] = useState([]);
    const mounted = useRef(true);
    const displayedRows = [...rows, ...recentlyDeleted.filter((listing) =>
        !rows.some((row) => itemId(row) === itemId(listing))
        && (!apiSearch || String(listing.title || '').toLowerCase().includes(apiSearch.toLowerCase()))
    )].map((listing) => recentlyDeleted.find((deleted) => itemId(deleted) === itemId(listing)) || listing);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const timeout = setTimeout(() => { setApiSearch(search.trim()); setPage(0); }, 350);
        return () => clearTimeout(timeout);
    }, [search]);
    useEffect(() => {
        const controller = new AbortController();
        queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(''); } });
        fetchListings(page + 1, limit, view, controller.signal, apiSearch).then(({ items, total: count }) => {
            if (controller.signal.aborted) return;
            if (!items.length && page > 0) { setPage((current) => current - 1); return; }
            setRows(items); setTotal(count);
        }).catch((err) => {
            if (!controller.signal.aborted) {
                const message = errorMessage(err, 'Unable to load service listings.');
                setError(message); setFeedback({ status: 'error', message, retry: true }); setRows([]);
            }
        }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, limit, view, refresh, apiSearch]);

    async function remove() {
        if (!deleteTarget || actionBusy) return;
        setActionBusy(true); setError('');
        try {
            await deleteListing(itemId(deleteTarget));
            if (!mounted.current) return;
            setRecentlyDeleted((current) => [...current.filter((item) => itemId(item) !== itemId(deleteTarget)), { ...deleteTarget, isArchived: true }]);
            setFeedback({ status: 'success', message: 'Service deleted successfully. Use its three-dot menu to restore it.' });
            setDeleteTarget(null); setRefresh((current) => current + 1);
        } catch (err) { if (mounted.current) setFeedback({ status: 'error', message: errorMessage(err) }); }
        finally { if (mounted.current) setActionBusy(false); }
    }

    async function restore(listing) {
        if (actionBusy) return;
        setActionBusy(true); setMenu(null); setError('');
        try {
            await restoreListing(itemId(listing));
            if (!mounted.current) return;
            setRecentlyDeleted((current) => current.filter((item) => itemId(item) !== itemId(listing)));
            setFeedback({ status: 'success', message: 'Service restored successfully.' }); setRefresh((current) => current + 1);
        } catch (err) { if (mounted.current) setFeedback({ status: 'error', message: errorMessage(err) }); }
        finally { if (mounted.current) setActionBusy(false); }
    }

    return (
        <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Services List</h1></div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-b border-slate-200 px-4 py-2.5">
                <label className="relative block w-full md:w-[360px]">
                    <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                        <svg viewBox="0 0 24 24" className="h-full w-full fill-current" aria-hidden="true"><path d="m20.49 19.07-4.35-4.35a7.1 7.1 0 1 0-1.42 1.42l4.35 4.35 1.42-1.42ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" /></svg>
                    </span>
                    <input type="search" aria-label="Search services" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services" className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b61f4b]" />
                </label>
            </div>
            {listingApiConfig.archivedStatus && <Stack direction="row" spacing={1} sx={{ m: 2, flexShrink: 0 }}>{[['', 'All listings'], [listingApiConfig.archivedStatus, 'Archived']].map(([value, label]) => <Button key={label} variant={view === value ? 'contained' : 'outlined'} onClick={() => { setView(value); setPage(0); }} sx={{ textTransform: 'none' }}>{label}</Button>)}</Stack>}
            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[760px] table-fixed text-left text-sm" aria-label="Vendor service listings">
                    <colgroup><col className="w-[24%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[17%]" /><col className="w-[14%]" /><col className="w-[15%]" /><col className="w-[6%]" /></colgroup>
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Title', 'City', 'Services', 'Starting price', 'Status', 'Created On', 'Actions'].map((label) => <th key={label} className={`px-4 py-2.5 text-[13px] font-semibold ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">Loading services...</td></tr> : !displayedRows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">{error ? 'Service listings could not be loaded.' : 'No services found.'}</td></tr> : displayedRows.map((listing) => {
                            const id = itemId(listing);
                            const title = listing.title || 'Untitled listing';
                            const titleWords = title.trim().split(/\s+/);
                            const shortTitle = titleWords.length > 3 ? `${titleWords.slice(0, 3).join(' ')}...` : title;
                            const status = isArchived(listing) ? 'ARCHIVED' : listing.status || (listing.submitForReview ? 'PENDING_REVIEW' : 'DRAFT');
                            const statusClass = status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : ['ACTIVE', 'APPROVED', 'PUBLISHED'].includes(status) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600';
                            return <tr key={id} className="bg-white transition hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold text-slate-800"><span className="block truncate" title={title} aria-label={title}>{shortTitle}</span></td>
                                <td className="break-words px-4 py-3 text-xs text-slate-700">{itemName(listing.city) || listing.cityName || '?'}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{listing.services?.length ?? listing.serviceCount ?? '?'}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{listing.startingPrice != null ? currency.format(Number(listing.startingPrice)) : '?'}</td>
                                <td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>{String(status).toLowerCase().replaceAll('_', ' ')}</span></td>
                                <td className="px-4 py-3 text-xs text-slate-700">{date(listing.createdAt)}</td>
                                <td className="px-4 py-3"><button type="button" aria-label={`Actions for ${listing.title || 'listing'}`} aria-haspopup="menu" aria-expanded={menu?.listing === listing ? true : undefined} onClick={(event) => setMenu({ anchor: event.currentTarget, listing })} disabled={actionBusy} className="ml-auto flex h-5 w-5 cursor-pointer items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50">{[0, 1, 2].map((dot) => <span key={dot} className="h-[3px] w-[3px] rounded-full bg-current" aria-hidden="true" />)}</button></td>
                            </tr>;
                        })}
                    </tbody>
                </table>
            </div>
            <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-4 py-2">
                <TablePagination component="div" count={total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || (total < 0 && rows.length < limit) }, previousButton: { disabled: loading || page === 0 } } }} sx={{ ...agentListPaginationSx, width: 'auto', borderTop: 0, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { my: 0, fontSize: 14, lineHeight: '36px' } }} />
            </div>
            <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { dense: true }, paper: { sx: { mt: 0.5, minWidth: 140, borderRadius: 1.5, border: '1px solid #e2e8f0', '& .MuiMenuItem-root': { fontSize: 13 } } } }}>
                {menu && [
                    <MenuItem key="view" disabled={actionBusy} onClick={() => { setDetailId(itemId(menu.listing)); setMenu(null); }}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon><ListItemText>View details</ListItemText></MenuItem>,
                    <MenuItem component={Link} href={routes.edit(itemId(menu.listing))} key="edit" disabled={actionBusy} onClick={() => setMenu(null)}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon><ListItemText>Edit service</ListItemText></MenuItem>,
                    <MenuItem key="restore" disabled={actionBusy || !isArchived(menu.listing)} onClick={() => restore(menu.listing)}><ListItemIcon><Restore fontSize="small" /></ListItemIcon><ListItemText>Restore service</ListItemText></MenuItem>,
                    <MenuItem key="delete" disabled={actionBusy || isArchived(menu.listing)} onClick={() => { setDeleteTarget(menu.listing); setMenu(null); }} sx={{ color: '#b42318' }}><ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete service</ListItemText></MenuItem>,
                ]}
            </Menu>
            {detailId && <VendorServiceDetails key={detailId} id={detailId} onClose={() => setDetailId('')} />}
            <Dialog open={Boolean(deleteTarget)} onClose={() => { if (!actionBusy) setDeleteTarget(null); }} maxWidth="xs" fullWidth aria-labelledby="delete-service-title">
                <DialogTitle id="delete-service-title">Delete service?</DialogTitle><DialogContent><Typography sx={{ color: '#667085', fontSize: 14 }}>Delete “{deleteTarget?.title}”? You can restore it afterwards.</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setDeleteTarget(null)} disabled={actionBusy}>Cancel</Button><Button color="error" variant="contained" disabled={actionBusy} onClick={remove}>{actionBusy ? 'Deleting…' : 'Delete service'}</Button></DialogActions>
            </Dialog>
            <Dialog open={Boolean(feedback)} onClose={() => setFeedback(null)} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="vendor-service-feedback-title" aria-describedby="vendor-service-feedback-message" slotProps={{ paper: { sx: { borderRadius: 2, p: 1, textAlign: 'center' } } }}>
                <div className={`mx-auto mt-5 grid h-14 w-14 place-items-center rounded-full ${feedback?.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{feedback?.status === 'success' ? <><circle cx="12" cy="12" r="10" /><path d="m7 12 3 3 7-7" /></> : <><circle cx="12" cy="12" r="10" /><path d="M12 7v6m0 4h.01" /></>}</svg></div>
                <DialogTitle id="vendor-service-feedback-title">{feedback?.status === 'success' ? 'Service updated' : 'Unable to complete the request'}</DialogTitle>
                <DialogContent><DialogContentText id="vendor-service-feedback-message">{feedback?.message}</DialogContentText></DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    {feedback?.retry && <Button type="button" onClick={() => { setFeedback(null); setRefresh((current) => current + 1); }} sx={{ textTransform: 'none' }}>Retry</Button>}
                    <Button type="button" autoFocus variant="contained" onClick={() => setFeedback(null)} sx={{ minWidth: 100, textTransform: 'none', bgcolor: orange, '&:hover': { bgcolor: '#981a3f' } }}>OK</Button>
                </DialogActions>
            </Dialog>
        </section>
    );
}
