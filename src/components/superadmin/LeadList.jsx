import { useEffect, useState } from 'react';
import { Alert, Button, ListItemIcon, ListItemText, Menu, MenuItem, Tab, Tabs, TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { adminLeadActions, adminLeadId, adminLeadSummary, adminLeadTabs, fetchAdminLeads, isDirectAdminLead, leadLabel } from '@/util/adminLeads.mjs';
import { leadDate, leadError } from '@/util/vendorLeads.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import LeadDetails from './LeadDetails';

const statusColors = { PENDING_REVIEW: '#a16207', ACTIVE: '#047857', REJECTED: '#b91c1c', CLOSED: '#64748b' };

const tabColors = { all: '#b61f4b', pending: '#92400e', shared: '#047857' };

function LeadActionIcon({ action }) {
  const paths = {
    view: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    activate: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    reject: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    close: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m9 9 6 6m0-6-6 6" /></>,
  };
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[action]}</svg>;
}

export function LeadMenuItems({ lead, onSelect }) {
  const allowed = adminLeadActions(lead);
  const items = isDirectAdminLead(lead) ? ['view', 'close'] : ['view', 'activate', 'reject', 'close'];
  return items.map((action) => <MenuItem key={action} disabled={!lead || (action !== 'view' && !allowed.includes(action))} onClick={() => onSelect(action)} sx={{ px: 2, py: 1.25, fontSize: 12, color: action === 'reject' ? '#b91c1c' : '#334155', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><ListItemIcon sx={{ minWidth: '26px !important', color: 'inherit' }}><LeadActionIcon action={action} /></ListItemIcon><ListItemText primary={action === 'view' ? 'View detail' : leadLabel(action)} slotProps={{ primary: { sx: { fontSize: 12, fontWeight: 500 } } }} /></MenuItem>);
}

export default function LeadList() {
  const [query, setQuery] = useState({ page: 0, limit: 20, status: '', leadType: '', search: '' });
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [menu, setMenu] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [detailAction, setDetailAction] = useState('');
  const [feedback, setFeedback] = useState('');
  const key = JSON.stringify({ ...query, attempt });
  useEffect(() => {
    const timer = setTimeout(() => setQuery((previous) => previous.search === search.trim() ? previous : { ...previous, search: search.trim(), page: 0 }), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    fetchAdminLeads(MainApi, { ...query, page: query.page + 1, signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setResult({ key, ...data });
    }).catch((error) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: leadError(error) }); });
    return () => controller.abort();
  }, [query, key]);
  const current = result?.key === key ? result : null;
  const rows = current?.items || [];
  const menuId = menu?.id || '';
  const menuLead = menu?.row || null;
  function openDetails(id, action = '') {
    setDetailId(id); setDetailAction(action); setMenu(null);
  }
  const activeTab = query.status === 'PENDING_REVIEW' ? 'pending' : query.leadType === 'SHARED' ? 'shared' : 'all';
  function changeTab(value) {
    const tab = adminLeadTabs.find((item) => item.value === value);
    if (!tab) return;
    setMenu(null);
    setQuery((previous) => ({ ...previous, status: tab.status, leadType: tab.leadType, page: 0 }));
  }
  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Lead List</h1></div>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
      <Tabs value={activeTab} onChange={(_, value) => changeTab(value)} variant="scrollable" scrollButtons="auto" aria-label="Lead filters" sx={{ maxWidth: '100%', minHeight: 28, '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTabs-list': { gap: .75 }, '& .MuiTabs-scrollButtons': { width: 24, height: 28 }, '& .MuiTab-root': { minHeight: 28, minWidth: 0, px: 1.25, py: .5, fontSize: 11, lineHeight: 1.2, fontWeight: 600, textTransform: 'uppercase', height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderRadius: '100px', opacity: 1 }, '& .MuiTab-root.Mui-focusVisible': { outline: '2px solid currentColor', outlineOffset: '-4px' } }}>
        {adminLeadTabs.map((tab) => <Tab key={tab.value} id={`lead-tab-${tab.value}`} aria-controls="lead-list-panel" value={tab.value} label={tab.label} sx={{ color: tabColors[tab.value], borderColor: tabColors[tab.value], bgcolor: `${tabColors[tab.value]}0d`, '&:hover': { boxShadow: `inset 0 0 0 1px ${tabColors[tab.value]}` }, '&.Mui-selected': { color: '#fff', bgcolor: tabColors[tab.value] } }} />)}
      </Tabs>
      <label className="relative block w-full md:w-[360px]">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" className="h-full w-full fill-current" aria-hidden="true"><path d="m20.49 19.07-4.35-4.35a7.1 7.1 0 1 0-1.42 1.42l4.35 4.35 1.42-1.42ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" /></svg></span>
        <input type="search" aria-label="Search leads" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search leads" className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b61f4b]" />
      </label>
    </div>
    {feedback && <Alert severity="success" sx={{ m: 2 }} onClose={() => setFeedback('')}>{feedback}</Alert>}
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
    <div id="lead-list-panel" role="tabpanel" aria-labelledby={`lead-tab-${activeTab}`} className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[980px] table-fixed text-left text-sm" aria-label="Admin leads"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Customer', 'Contact', 'Event date', 'Guests', 'Type', 'Status', 'Received on', 'Actions'].map((label) => <th key={label} className={`px-4 py-2.5 text-[13px] font-semibold ${label === 'Actions' ? 'w-20 text-right' : ''}`}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
      {!current ? <tr><td colSpan={8} role="status" className="px-4 py-12 text-center text-slate-500">Loading leads...</td></tr> : !rows.length ? <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Leads could not be loaded.' : 'No leads found.'}</td></tr> : rows.map((row, index) => {
        const lead = adminLeadSummary(row), id = adminLeadId(row);
        return <tr key={id || index} className="hover:bg-slate-50"><td className="px-4 py-3"><button type="button" disabled={!id} onClick={() => openDetails(id)} className="max-w-full truncate text-left font-semibold text-slate-800 hover:text-[#b61f4b]" title={lead.customerName}>{lead.customerName}</button></td><td className="break-words px-4 py-3"><p>{lead.customerPhone}</p>{lead.customerEmail && <p className="mt-1 text-[11px] text-slate-500">{lead.customerEmail}</p>}</td><td className="px-4 py-3">{lead.eventDate ? leadDate(lead.eventDate) : ''}</td><td className="px-4 py-3">{lead.guestCount}</td><td className="px-4 py-3">{lead.leadType ? leadLabel(lead.leadType) : ''}</td><td className="px-4 py-3"><span className="inline-block rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: statusColors[lead.status] || '#475569', background: `${statusColors[lead.status] || '#475569'}10` }}>{lead.status ? leadLabel(lead.status) : ''}</span></td><td className="px-4 py-3">{lead.createdAt ? leadDate(lead.createdAt) : ''}</td><td className="px-4 py-3 text-right"><button type="button" disabled={!id} aria-label={`Actions for ${lead.customerName}`} aria-haspopup="menu" aria-expanded={menuId === id && Boolean(menu)} onClick={(event) => setMenu({ anchor: event.currentTarget, id, row })} className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"><span className="flex gap-[2px]" aria-hidden="true">{[0, 1, 2].map((dot) => <span key={dot} className="h-1 w-1 rounded-full bg-current" />)}</span></button></td></tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => setQuery((previous) => ({ ...previous, page }))} onRowsPerPageChange={(event) => setQuery((previous) => ({ ...previous, limit: Number(event.target.value), page: 0 }))} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={agentListPaginationSx} />
    <Menu open={Boolean(menu)} anchorEl={menu?.anchor || null} onClose={() => setMenu(null)} disableScrollLock slotProps={{ paper: { sx: { minWidth: 176, borderRadius: 1, border: '1px solid #e2e8f0' } } }}><LeadMenuItems lead={menuLead} onSelect={(action) => openDetails(menuId, action === 'view' ? '' : action)} /></Menu>
    {detailId && <LeadDetails key={`${detailId}:${detailAction}`} id={detailId} initialAction={detailAction} onClose={() => setDetailId('')} onUpdated={(message) => { setFeedback(message); setAttempt((value) => value + 1); }} />}
  </section>;
}
