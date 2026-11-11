import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchSalesMeeting, fetchSalesMeetings, filterMeetingRows, meetingDate, meetingError, meetingLabel, meetingLink, salesMeetingId } from '@/util/vendorMeetings.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import { MoreVert, ViewOutlined } from '@/components/vendor/listings/ServiceIcons';
import MeetingStatusChip from './MeetingStatusChip';
import MeetingJoinButton from './MeetingJoinButton';
import styles from './MeetingHeaderButton.module.css';
import MeetingTableSearch from './MeetingTableSearch';

function MeetingDetails({ id, onClose }) {
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchSalesMeeting(MainApi, id, controller.signal).then((data) => { if (!controller.signal.aborted) { setMeeting(data); setError(''); } }).catch((failure) => { if (!controller.signal.aborted) setError(meetingError(failure)); });
    return () => controller.abort();
  }, [id, attempt]);
  const link = meetingLink(meeting);
  const hidden = new Set(['id', '_id', 'salesMeetingId', 'vendorId', 'adminNote', 'joinUrl', 'meetingUrl', 'meetingLink', 'videoCallUrl']);
  return <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="meeting-detail-title">
    <DialogTitle id="meeting-detail-title">Meeting details</DialogTitle>
    <DialogContent dividers>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
      {!meeting ? !error && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading meeting details...</p> : <>
        <p className="mb-3 text-xs text-slate-500">All meeting times are shown in India Standard Time (UTC+05:30).</p>
        <dl className="overflow-hidden rounded-lg border border-slate-200 text-sm">{Object.entries(meeting).filter(([key]) => !hidden.has(key)).map(([key, value]) => <div key={key} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"><dt className="font-medium text-slate-500">{meetingLabel(key)}</dt><dd className="whitespace-pre-wrap break-words text-slate-900">{key.endsWith('At') ? meetingDate(value) : value == null || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>
        {link ? <Button component="a" href={link} target="_blank" rel="noopener noreferrer" variant="contained" sx={{ mt: 2, bgcolor: '#15803d', textTransform: 'none' }}>Join meeting</Button> : <p className="mt-4 text-xs text-slate-500">A meeting link is not available yet.</p>}
      </>}
      <div className="mt-4 flex justify-end"><Button onClick={onClose}>Close</Button></div>
    </DialogContent>
  </Dialog>;
}

export default function MeetingList() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ page: 0, limit: 20 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [menu, setMenu] = useState(null);
  const key = JSON.stringify({ ...query, attempt });
  useEffect(() => {
    function refresh() { setMenu(null); setQuery((current) => ({ ...current, page: 0 })); setAttempt((value) => value + 1); }
    window.addEventListener('epic-vendor-meetings-change', refresh);
    return () => window.removeEventListener('epic-vendor-meetings-change', refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetchSalesMeetings(MainApi, { ...query, page: query.page + 1, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult({ key, ...data }); }).catch((failure) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: meetingError(failure) }); });
    return () => controller.abort();
  }, [key, query]);
  const current = result?.key === key ? result : null;
  const rows = filterMeetingRows(current?.items || [], search);
  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Meeting List</h1></div>
    <div className="flex shrink-0 items-center justify-end border-b border-slate-200 px-4 py-2.5"><MeetingTableSearch value={search} onChange={setSearch} /></div>
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[950px] text-left text-sm" aria-label="Vendor sales meetings"><thead className="sticky top-0 z-10 bg-slate-100"><tr>{['Requested start', 'Requested end', 'Status', 'Meeting note', 'Requested on', 'Actions'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold text-slate-900">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
      {!current ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500" role="status">Loading meetings...</td></tr> : !rows.length ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Meetings could not be loaded.' : search.trim() ? 'No meetings on this page match your search.' : 'No meetings yet. Schedule your first meeting.'}</td></tr> : rows.map((row, index) => {
        const id = salesMeetingId(row);
        return <tr key={id || index} className="hover:bg-slate-50"><td className="px-4 py-3 text-xs">{meetingDate(row.requestedStartAt)}</td><td className="px-4 py-3 text-xs">{meetingDate(row.requestedEndAt)}</td><td className="px-4 py-3"><MeetingStatusChip status={row.status} /></td><td className="max-w-64 px-4 py-3 text-xs"><p className="truncate" title={row.vendorNote}>{row.vendorNote || '—'}</p></td><td className="px-4 py-3 text-xs">{meetingDate(row.createdAt)}</td><td className="px-4 py-3"><div className={styles.actions}><MeetingJoinButton meeting={row} /><IconButton size="small" aria-label={`Actions for meeting ${index + 1}`} aria-haspopup="menu" aria-expanded={menu?.id === id || undefined} disabled={!id} onClick={(event) => setMenu({ anchor: event.currentTarget, id })} sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}><MoreVert fontSize="small" /></IconButton></div></td></tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => { setMenu(null); setQuery((value) => ({ ...value, page })); }} onRowsPerPageChange={(event) => { setMenu(null); setQuery({ page: 0, limit: Number(event.target.value) }); }} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={{ ...agentListPaginationSx, flexShrink: 0 }} />
    <Menu anchorEl={menu?.anchor || null} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { 'aria-label': 'Meeting actions' }, paper: { sx: { minWidth: 175, borderRadius: 1.5, border: '1px solid #e2e8f0' } } }}><MenuItem onClick={() => { if (menu?.id) { setDetailId(menu.id); setMenu(null); } }} sx={{ fontSize: 16, py: 1.25 }}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon>View detail</MenuItem></Menu>
    {detailId && <MeetingDetails key={detailId} id={detailId} onClose={() => setDetailId('')} />}
  </section>;
}
