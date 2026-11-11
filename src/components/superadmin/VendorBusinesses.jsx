import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, Tab, Tabs, TablePagination, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import { businessDate, businessError, businessLabel, businessStatuses, businessText, businessWebsite, fetchBusinessImportBatches, fetchImportedBusiness, fetchImportedBusinesses, importBatchId, importedBusinessId, updateImportedBusiness } from '@/util/importedBusinesses.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import { EditOutlined, ViewOutlined } from '@/components/vendor/listings/ServiceIcons';

const tabSx = { minHeight: 28, '& .MuiTabs-list': { gap: .75 }, '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTab-root': { minHeight: 28, minWidth: 0, px: 1.5, py: .5, border: '1px solid #e2e8f0', borderRadius: '999px', fontSize: 11, textTransform: 'none', '&.Mui-selected': { color: '#fff', bgcolor: '#b61f4b', borderColor: '#b61f4b' } } };
const compactControlSx = { '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& .MuiInputBase-input': { py: .75 }, '& .MuiInputLabel-root': { fontSize: 12 } };
function RowActions({ label, expanded, disabled = false, onClick }) {
  return <IconButton size="small" aria-label={`Actions for ${label}`} aria-haspopup="menu" aria-expanded={expanded || undefined} disabled={disabled} onClick={onClick} sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg></IconButton>;
}

function BusinessFields({ business }) {
  const hidden = new Set(['id', '_id', 'importedBusinessId', 'slug']);
  return <dl className="overflow-hidden rounded-lg border border-slate-200 text-sm">{Object.entries(business).filter(([key]) => !hidden.has(key)).map(([key, value]) => <div key={key} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[140px_minmax(0,1fr)]"><dt className="font-medium text-slate-500">{businessLabel(key)}</dt><dd className="whitespace-pre-wrap break-words text-slate-900">{key.endsWith('At') ? businessDate(value) : businessText(value)}</dd></div>)}</dl>;
}

function BusinessDetails({ id, edit = false, onClose, onUpdated }) {
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [salesNote, setSalesNote] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveRequest = useRef(null);
  useEffect(() => () => saveRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchImportedBusiness(MainApi, id, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setBusiness(data); setStatus(data.status || 'NEW'); setSalesNote(data.salesNote || ''); setError('');
    }).catch((failure) => { if (!controller.signal.aborted) setError(businessError(failure)); });
    return () => controller.abort();
  }, [id, attempt]);

  async function save(event) {
    event.preventDefault();
    if (!edit || !business || saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller; setSaving(true); setError('');
    try {
      const feedback = await updateImportedBusiness(MainApi, id, { status, salesNote }, controller.signal);
      if (!controller.signal.aborted) { onUpdated(feedback); onClose(); }
    } catch (failure) { if (!controller.signal.aborted) setError(businessError(failure)); }
    finally { if (!controller.signal.aborted) { saveRequest.current = null; setSaving(false); } }
  }

  return <Dialog open onClose={saving ? undefined : onClose} maxWidth={edit ? 'sm' : 'md'} fullWidth aria-labelledby="business-detail-title">
    <form onSubmit={save} aria-busy={saving}>
      <DialogTitle id="business-detail-title">{edit ? 'Update status / Sales note' : 'Vendor business details'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} action={!business ? <Button color="inherit" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</Button> : undefined}>{error}</Alert>}
        {!business ? !error && <p role="status" className="py-10 text-center text-sm text-slate-500">Loading business details...</p> : <>
          <h2 className="mb-4 text-base font-semibold text-slate-900">{business.businessName || business.name || 'Business profile'}</h2>
          {edit ? <div className="mt-6 grid gap-5">
            <TextField select label="Status" size="small" fullWidth required disabled={saving} value={status} onChange={(event) => setStatus(event.target.value)}>{[...new Set([...businessStatuses, business.status].filter(Boolean))].map((value) => <MenuItem key={value} value={value}>{businessLabel(value)}</MenuItem>)}</TextField>
            <TextField label="Sales note" fullWidth multiline minRows={4} value={salesNote} onChange={(event) => setSalesNote(event.target.value)} disabled={saving} placeholder="Record your conversation or follow-up notes" />
          </div> : <BusinessFields business={business} />}
        </>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button type="button" onClick={onClose} disabled={saving}>{edit ? 'Cancel' : 'Close'}</Button>{edit && <Button type="submit" variant="contained" disabled={!business || saving} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>{saving ? 'Saving...' : 'Save changes'}</Button>}</DialogActions>
    </form>
  </Dialog>;
}

export function BusinessImportBatches() {
  return <VendorBusinesses initialTab="batches" />;
}

export default function VendorBusinesses({ initialTab = 'businesses' }) {
  const [tab, setTab] = useState(initialTab);
  const [queries, setQueries] = useState({ businesses: { page: 0, limit: 20, status: 'NEW', search: '' }, batches: { page: 0, limit: 20, search: '' } });
  const [searches, setSearches] = useState({ businesses: '', batches: '' });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(null);
  const [batch, setBatch] = useState(null);
  const [feedback, setFeedback] = useState('');
  const query = queries[tab];
  const search = searches[tab];
  const key = JSON.stringify({ tab, ...query, attempt });
  const batches = tab === 'batches';
  function changeQuery(values) { setMenu(null); setQueries((current) => ({ ...current, [tab]: { ...current[tab], ...values } })); }
  function openDetails(id, edit = false) { setEditing(edit); setDetailId(id); setMenu(null); }
  useEffect(() => {
    if (search.trim() === query.search) return undefined;
    const timer = setTimeout(() => {
      setMenu(null);
      setQueries((current) => ({ ...current, [tab]: { ...current[tab], page: 0, search: search.trim() } }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search, query.search, tab]);
  useEffect(() => {
    const controller = new AbortController();
    const fetcher = batches ? fetchBusinessImportBatches : fetchImportedBusinesses;
    fetcher(MainApi, { ...query, page: query.page + 1, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult({ key, ...data });
    }).catch((failure) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: businessError(failure) }); });
    return () => controller.abort();
  }, [batches, key, query]);
  const current = result?.key === key ? result : null;
  const rows = current?.items || [];
  const statuses = [...new Set([...businessStatuses, query.status, ...(!batches ? rows.map((row) => row.status) : [])].filter(Boolean))];
  const columns = batches ? ['Batch / Source', 'City', 'Status', 'Total', 'Imported', 'Failed', 'Created on', 'Actions'] : ['Business / Category', 'Website / Contact', 'Location', 'Rating', 'Status', 'Updated on', 'Actions'];

  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Vendor Businesses</h1></div>
    <div className="flex shrink-0 flex-wrap items-center justify-start gap-3 border-b border-slate-200 px-4 py-2.5"><Tabs value={tab} onChange={(_, value) => { setTab(value); setDetailId(''); setBatch(null); setMenu(null); }} aria-label="Vendor business sections" sx={tabSx}><Tab value="businesses" label="Businesses" /><Tab value="batches" label="Import batches" /></Tabs>{!batches && <TextField select size="small" label="Status" value={query.status} onChange={(event) => changeQuery({ status: event.target.value, page: 0 })} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }} sx={{ ...compactControlSx, minWidth: 150 }}><MenuItem value="">All statuses</MenuItem>{statuses.map((value) => <MenuItem key={value} value={value}>{businessLabel(value)}</MenuItem>)}</TextField>}<TextField type="search" size="small" placeholder={batches ? 'Search import batches' : 'Search businesses'} value={search} onChange={(event) => setSearches((current) => ({ ...current, [tab]: event.target.value }))} slotProps={{ htmlInput: { 'aria-label': batches ? 'Search import batches' : 'Search businesses' } }} sx={{ ...compactControlSx, ml: { sm: 'auto' }, width: { xs: '100%', sm: 280 } }} /></div>
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[1000px] text-left text-sm" aria-label={batches ? 'Business import batches' : 'Imported vendor businesses'}><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{columns.map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
      {!current ? <tr><td colSpan={columns.length} role="status" className="px-4 py-12 text-center text-slate-500">Loading {batches ? 'import batches' : 'businesses'}...</td></tr> : !rows.length ? <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Records could not be loaded.' : batches ? 'No import batches found.' : 'No businesses match this status.'}</td></tr> : rows.map((row, index) => {
        const id = batches ? importBatchId(row) : importedBusinessId(row);
        return <tr key={id || index} className="hover:bg-slate-50">{batches ? <>
          <td className="max-w-64 px-4 py-3"><p className="truncate font-medium" title={businessText(row.fileName || row.sourceName || row.source)}>{businessText(row.fileName || row.sourceName || row.source || row.name || id)}</p></td><td className="px-4 py-3">{businessText(row.city)}</td><td className="px-4 py-3"><Chip size="small" label={businessLabel(row.status) || 'Not provided'} variant="outlined" sx={{ fontSize: 11 }} /></td><td className="px-4 py-3">{businessText(row.totalRecords ?? row.totalRows ?? row.totalCount)}</td><td className="px-4 py-3">{businessText(row.importedCount ?? row.importedRecords ?? row.successCount)}</td><td className="px-4 py-3">{businessText(row.failedCount ?? row.failedRecords ?? row.errorCount)}</td><td className="px-4 py-3 text-xs">{businessDate(row.createdAt)}</td><td className="px-4 py-3"><RowActions label={businessText(row.fileName || row.sourceName || row.source || row.name || id)} expanded={menu?.row === row} onClick={(event) => setMenu({ anchor: event.currentTarget, row })} /></td>
        </> : <>
          <td className="max-w-64 px-4 py-3"><button type="button" disabled={!id} onClick={() => openDetails(id)} className="block max-w-full truncate text-left font-medium text-slate-900 hover:text-[#b61f4b]" title={row.businessName || row.name}>{row.businessName || row.name || 'Unnamed business'}</button><p className="mt-1 text-xs text-slate-500">{businessText(row.category)}</p>{row.salesNote && <p className="mt-1 truncate text-xs text-slate-500" title={row.salesNote}>{row.salesNote}</p>}</td><td className="max-w-48 px-4 py-3 text-xs">{businessWebsite(row.website) && <a className="block truncate text-[#b61f4b] underline" href={businessWebsite(row.website)} target="_blank" rel="noopener noreferrer" title={row.website}>Visit website</a>}{(row.phone || row.phoneNumber || row.businessPhone) && <p className="mt-1">{businessText(row.phone || row.phoneNumber || row.businessPhone)}</p>}{(row.email || row.businessEmail) && <p className="mt-1 break-all">{businessText(row.email || row.businessEmail)}</p>}{!businessWebsite(row.website) && !row.phone && !row.phoneNumber && !row.businessPhone && !row.email && !row.businessEmail && '—'}</td><td className="max-w-48 px-4 py-3 text-xs"><p>{[row.city, row.state].filter(Boolean).map(businessText).join(', ') || '—'}</p>{row.address && <p className="mt-1 truncate text-slate-500" title={businessText(row.address)}>{businessText(row.address)}</p>}</td><td className="px-4 py-3 text-xs"><p>{businessText(row.rating)}</p>{row.reviewCount != null && <p className="mt-1 text-slate-500">{businessText(row.reviewCount)} reviews</p>}</td><td className="px-4 py-3"><Chip size="small" label={businessLabel(row.status) || 'Not provided'} color={row.status === 'CONTACTED' ? 'success' : 'default'} variant="outlined" sx={{ fontSize: 11 }} /></td><td className="px-4 py-3 text-xs">{businessDate(row.updatedAt || row.createdAt)}</td><td className="px-4 py-3"><RowActions label={row.businessName || row.name || 'business'} expanded={menu?.row === row} disabled={!id} onClick={(event) => setMenu({ anchor: event.currentTarget, row })} /></td>
        </>}</tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => changeQuery({ page })} onRowsPerPageChange={(event) => changeQuery({ page: 0, limit: Number(event.target.value) })} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={{ ...agentListPaginationSx, flexShrink: 0 }} />
    <Menu anchorEl={menu?.anchor || null} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { 'aria-label': batches ? 'Import batch actions' : 'Business actions' }, paper: { sx: { minWidth: 210, borderRadius: 1.5, border: '1px solid #e2e8f0', '& .MuiMenuItem-root': { fontSize: 16, py: 1.25 }, '& .MuiListItemIcon-root': { minWidth: 34, color: '#64748b' } } } }}>
      <MenuItem onClick={() => { if (!menu) return; if (batches) { setBatch(menu.row); setMenu(null); } else openDetails(importedBusinessId(menu.row)); }}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon>View details</MenuItem>
      {!batches && <MenuItem onClick={() => { if (menu) openDetails(importedBusinessId(menu.row), true); }}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>Update status</MenuItem>}
    </Menu>
    {detailId && <BusinessDetails key={`${detailId}:${editing}`} id={detailId} edit={editing} onClose={() => setDetailId('')} onUpdated={(message) => { setFeedback(message); changeQuery({ page: 0 }); setAttempt((value) => value + 1); }} />}
    <ApiStatusModal status={feedback ? 'success' : null} title="Status updated" text={feedback} okLabel="OK" onOk={() => setFeedback('')} />
    {batch && <Dialog open onClose={() => setBatch(null)} fullWidth maxWidth="md" aria-labelledby="import-batch-title"><DialogTitle id="import-batch-title">Import batch details</DialogTitle><DialogContent dividers><BusinessFields business={batch} /></DialogContent><DialogActions><Button onClick={() => setBatch(null)}>Close</Button></DialogActions></Dialog>}
  </section>;
}
