import { useEffect, useRef, useState } from 'react';
import { Alert, Button, ListItemIcon, ListItemText, Menu, MenuItem, TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchVendorLeads, leadDate, leadError, leadSummary, sharedLeadId, sharedLeadPrice, isLeadPurchased, purchaseSharedLead } from '@/util/vendorLeads.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from './listings/tableStyles';
import { ViewOutlined } from './listings/ServiceIcons';
import LeadDetails from './LeadDetails';

export default function LeadList({ shared = false }) {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [apiSearch, setApiSearch] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [menu, setMenu] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [detailSharedId, setDetailSharedId] = useState('');
  const [detailSnapshot, setDetailSnapshot] = useState(null);
  const [buyingId, setBuyingId] = useState('');
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const purchaseLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (search.trim() === apiSearch) return undefined;
    const timer = setTimeout(() => { setApiSearch(search.trim()); setPage(0); setMenu(null); }, 350);
    return () => clearTimeout(timer);
  }, [search, apiSearch]);
  useEffect(() => {
    const controller = new AbortController();
    fetchVendorLeads(MainApi, { page: page + 1, limit, shared, search: apiSearch, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult({ page, limit, attempt, shared, search: apiSearch, ...data });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ page, limit, attempt, shared, search: apiSearch, items: [], total: -1, hasNext: false, error: leadError(error) });
    });
    return () => controller.abort();
  }, [page, limit, attempt, shared, apiSearch]);
  const current = result?.shared === shared && result?.search === apiSearch && result?.page === page && result?.limit === limit && result?.attempt === attempt ? result : null;
  const loading = !current;
  const rows = current?.items || [];
  const selectedLeadId = menu?.id || '';
  const selectedSharedId = menu?.sharedId || '';
  const selectedRow = menu?.row || null;
  const selectedPurchased = isLeadPurchased(selectedRow) || purchasedIds.includes(selectedSharedId);

  function openDetails(row) {
    setDetailId(leadSummary(row).id);
    setDetailSharedId(shared ? sharedLeadId(row) : '');
    setDetailSnapshot(shared ? row : null);
    setMenu(null);
  }
  async function purchase(id) {
    const target = rows.find((row) => sharedLeadId(row) === id);
    if (!shared || !id || !target || purchaseLock.current || purchasedIds.includes(id) || isLeadPurchased(target) || target.canPurchase === false) return false;
    purchaseLock.current = true; setBuyingId(id); setFeedback(null);
    try {
      const result = await purchaseSharedLead(MainApi, id);
      if (mounted.current) {
        setPurchasedIds((current) => [...new Set([...current, id])]);
        setFeedback({ id, success: true, message: result.message });
        setAttempt((value) => value + 1);
      }
      return true;
    } catch (error) {
      if (mounted.current) setFeedback({ id, success: false, message: leadError(error, 'Unable to purchase this lead.') });
      return false;
    } finally {
      purchaseLock.current = false;
      if (mounted.current) setBuyingId('');
    }
  }
  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">{shared ? 'Shared Lead List' : 'Lead List'}</h1></div>
    <div className="flex shrink-0 justify-end border-b border-slate-200 px-4 py-2.5">
      <label className="relative block w-full md:w-[360px]">
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></span>
        <input type="search" aria-label={shared ? 'Search shared leads' : 'Search leads'} placeholder={shared ? 'Search shared leads' : 'Search leads'} value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#b61f4b]" />
      </label>
    </div>
    {feedback && <Alert severity={feedback.success ? 'success' : 'error'} onClose={() => setFeedback(null)} sx={{ m: 2 }}>{feedback.message}</Alert>}
    {current?.error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>} sx={{ m: 2 }}>{current.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[1020px] table-fixed text-left text-sm" aria-label={shared ? "Shared vendor leads" : "Vendor leads"}><colgroup><col className="w-[16%]" /><col className="w-[20%]" /><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[7%]" /><col className="w-[10%]" />{shared && <col className="w-[10%]" />}<col className="w-[11%]" /><col className="w-[6%]" /></colgroup><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Customer', 'Contact', 'Enquiry for', 'Event date', 'Guests', 'Status', ...(shared ? ['Price'] : []), 'Received on', 'Actions'].map((label) => <th key={label} className={`px-4 py-2.5 text-[13px] font-semibold ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
      {loading ? <tr><td colSpan={shared ? 9 : 8} className="px-4 py-12 text-center text-slate-500" role="status">Loading leads…</td></tr> : !rows.length ? <tr><td colSpan={shared ? 9 : 8} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Leads could not be loaded.' : 'No leads found.'}</td></tr> : rows.map((row, index) => {
        const lead = leadSummary(row);
        const status = shared && (isLeadPurchased(row) || purchasedIds.includes(sharedLeadId(row))) ? 'PURCHASED' : String(lead.status).toUpperCase();
        const color = ['CONVERTED', 'WON', 'COMPLETED', 'PURCHASED'].includes(status) ? 'bg-emerald-50 text-emerald-700' : ['NEW', 'PENDING'].includes(status) ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
        return <tr key={lead.id || index} className="bg-white hover:bg-slate-50"><td className="px-4 py-3"><button type="button" disabled={!lead.id} onClick={() => openDetails(row)} className="block max-w-full truncate text-left text-xs font-semibold text-slate-800 hover:text-[#b61f4b] disabled:cursor-default" title={lead.customerName}>{lead.customerName}</button></td><td className="break-words px-4 py-3 text-xs text-slate-700"><p>{lead.customerPhone || '—'}</p>{lead.customerEmail && <p className="mt-1 break-all text-slate-500">{lead.customerEmail}</p>}</td><td className="px-4 py-3 text-xs text-slate-700"><span className="block truncate" title={lead.subject}>{lead.subject}</span></td><td className="px-4 py-3 text-xs text-slate-700">{leadDate(lead.eventDate)}</td><td className="px-4 py-3 text-xs text-slate-700">{lead.guestCount ?? '—'}</td><td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-1 text-[10px] capitalize ${color}`}>{status ? status.toLowerCase().replaceAll('_', ' ') : 'Not provided'}</span></td>{shared && <td className="px-4 py-3 text-xs text-slate-700">{sharedLeadPrice(row) || '-'}</td>}<td className="px-4 py-3 text-xs text-slate-700">{leadDate(lead.createdAt)}</td><td className="px-4 py-3"><button type="button" aria-label={`Actions for ${lead.customerName}`} aria-haspopup="menu" aria-expanded={menu?.id === lead.id ? true : undefined} disabled={!lead.id} onClick={(event) => setMenu({ anchor: event.currentTarget, id: lead.id, sharedId: shared ? sharedLeadId(row) : '', row })} className="ml-auto flex h-5 w-5 items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50">{[0, 1, 2].map((dot) => <span key={dot} aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-current" />)}</button></td></tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, value) => { setMenu(null); setPage(value); }} onRowsPerPageChange={(event) => { setMenu(null); setPage(0); setLimit(Number(event.target.value)); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || !current?.hasNext }, previousButton: { disabled: loading || page === 0 } } }} sx={{ ...agentListPaginationSx, flexShrink: 0 }} />
    <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { dense: true }, paper: { sx: { minWidth: 145, borderRadius: 1.5, border: '1px solid #e2e8f0' } } }}><MenuItem disabled={!selectedLeadId} onClick={() => { if (selectedRow) openDetails(selectedRow); }}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon><ListItemText>View details</ListItemText></MenuItem>{shared && <MenuItem disabled={!selectedSharedId || Boolean(buyingId) || selectedPurchased || selectedRow?.canPurchase === false} onClick={() => { setMenu(null); void purchase(selectedSharedId); }} sx={{ color: '#b61f4b' }}><ListItemText primary={selectedPurchased ? 'Purchased' : buyingId === selectedSharedId ? 'Purchasing...' : 'Purchase lead'} secondary={sharedLeadPrice(selectedRow) || undefined} /></MenuItem>}</Menu>
    {detailId && <LeadDetails key={detailId} id={detailId} sharedId={detailSharedId} fallbackLead={detailSnapshot} onPurchase={shared ? purchase : undefined} purchasing={Boolean(buyingId)} purchased={purchasedIds.includes(detailSharedId)} purchaseFeedback={feedback?.id === detailSharedId ? feedback : null} onClose={() => setDetailId('')} />}
  </section>;
}
