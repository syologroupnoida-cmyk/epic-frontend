import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Tab, Tabs, TablePagination, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { contactError, contactLabel, contactMessageId, contactStatuses, fetchContactMessage, fetchContactMessages, updateContactMessage } from '@/util/contactMessages.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';

function date(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('en-IN');
}

function ContactMessageDetails({ id, onClose, onUpdated }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState('NEW');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const saveRequest = useRef(null);
  useEffect(() => () => saveRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchContactMessage(MainApi, id, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setMessage(data); setStatus(data.status || 'NEW'); setNote(data.adminNote || ''); setError('');
    }).catch((failure) => { if (!controller.signal.aborted) setError(contactError(failure)); });
    return () => controller.abort();
  }, [id, attempt]);

  async function save(event) {
    event.preventDefault();
    if (!message || saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller; setSaving(true); setError('');
    try {
      const feedback = await updateContactMessage(MainApi, id, { status, adminNote: note }, controller.signal);
      if (!controller.signal.aborted) { onUpdated(feedback); onClose(); }
    } catch (failure) { if (!controller.signal.aborted) setError(contactError(failure)); }
    finally { if (!controller.signal.aborted) { saveRequest.current = null; setSaving(false); } }
  }

  const rows = message ? [
    ['Name', message.name], ['Email', message.email], ['Phone', message.phone],
    ['User type', contactLabel(message.userType)], ['Subject', message.subject], ['Message', message.message],
    ['Status', contactLabel(message.status)], ['Received on', date(message.createdAt)], ['Updated on', date(message.updatedAt)],
    ...(message.website ? [['Website', message.website]] : []),
  ] : [];
  return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="contact-detail-title">
    <form onSubmit={save} aria-busy={saving}>
      <DialogTitle id="contact-detail-title">Contact enquiry details</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} action={!message ? <Button color="inherit" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</Button> : undefined}>{error}</Alert>}
        {!message ? !error && <p role="status" className="py-8 text-center text-sm text-slate-500">Loading message...</p> : <>
          <dl className="overflow-hidden rounded-lg border border-slate-200 text-sm">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)]"><dt className="font-medium text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words text-slate-900">{value || '—'}</dd></div>)}</dl>
          <div className="mt-6 grid gap-5">
            <TextField label="Status" select size="small" fullWidth required value={status} disabled={saving} onChange={(event) => setStatus(event.target.value)}>{[...new Set([...contactStatuses, message.status].filter(Boolean))].map((value) => <MenuItem key={value} value={value}>{contactLabel(value)}</MenuItem>)}</TextField>
            <TextField label="Admin note" value={note} onChange={(event) => setNote(event.target.value)} fullWidth multiline minRows={4} disabled={saving} placeholder="Add a custom note for this message" />
          </div>
        </>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button disabled={saving} onClick={onClose}>Close</Button><Button type="submit" variant="contained" disabled={!message || saving} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>{saving ? 'Saving...' : 'Save changes'}</Button></DialogActions>
    </form>
  </Dialog>;
}

export default function ContactMessages() {
  const [query, setQuery] = useState({ page: 0, limit: 20, status: '' });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [feedback, setFeedback] = useState('');
  const key = JSON.stringify({ ...query, attempt });
  useEffect(() => {
    const controller = new AbortController();
    fetchContactMessages(MainApi, { ...query, page: query.page + 1, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult({ key, ...data });
    }).catch((error) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: contactError(error) }); });
    return () => controller.abort();
  }, [query, key]);
  const current = result?.key === key ? result : null;
  const rows = current?.items || [];
  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <h1 className="text-lg font-semibold text-slate-950">Contact Enquiries</h1>
      <Tabs value={query.status} onChange={(_, status) => setQuery((previous) => ({ ...previous, status, page: 0 }))} aria-label="Contact message filters" sx={{ minHeight: 34, '& .MuiTab-root': { minHeight: 34, py: .5, fontSize: 12, textTransform: 'none' }, '& .Mui-selected': { color: '#b61f4b' } }}><Tab value="" label="All messages" id="contact-tab-all" aria-controls="contact-message-panel" /><Tab value="NEW" label="New" id="contact-tab-new" aria-controls="contact-message-panel" /></Tabs>
    </div>
    {feedback && <Alert severity="success" sx={{ m: 2 }} onClose={() => setFeedback('')}>{feedback}</Alert>}
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto" role="tabpanel" id="contact-message-panel" aria-labelledby={query.status ? 'contact-tab-new' : 'contact-tab-all'}>
      <table className="w-full min-w-[900px] text-left text-sm" aria-label="Contact enquiries"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Name', 'Contact', 'User type', 'Subject', 'Status', 'Received on', 'Actions'].map((label) => <th className="px-4 py-3 text-xs font-semibold" key={label}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">{!current ? <tr><td colSpan={7} role="status" className="px-4 py-12 text-center text-slate-500">Loading messages...</td></tr> : !rows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Messages could not be loaded.' : query.status ? 'No new messages.' : 'No contact messages found.'}</td></tr> : rows.map((row, index) => {
          const id = contactMessageId(row);
          return <tr key={id || index} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium">{row.name || '—'}</td><td className="px-4 py-3"><p>{row.phone || '—'}</p><p className="mt-1 text-xs text-slate-500">{row.email}</p></td><td className="px-4 py-3">{contactLabel(row.userType) || '—'}</td><td className="max-w-64 px-4 py-3"><p className="truncate" title={row.subject}>{row.subject || '—'}</p></td><td className="px-4 py-3"><Chip label={contactLabel(row.status) || 'Unknown'} size="small" color={row.status === 'NEW' ? 'success' : 'default'} variant="outlined" sx={{ fontSize: 11 }} /></td><td className="px-4 py-3 text-xs">{date(row.createdAt)}</td><td className="px-4 py-3"><Button size="small" disabled={!id} onClick={() => setDetailId(id)} sx={{ fontSize: 11, textTransform: 'none', whiteSpace: 'nowrap' }}>Details / Note</Button></td></tr>;
        })}</tbody>
      </table>
    </div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => setQuery((previous) => ({ ...previous, page }))} onRowsPerPageChange={(event) => setQuery((previous) => ({ ...previous, page: 0, limit: Number(event.target.value) }))} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={agentListPaginationSx} />
    {detailId && <ContactMessageDetails key={detailId} id={detailId} onClose={() => setDetailId('')} onUpdated={(message) => { setFeedback(message); setQuery((previous) => ({ ...previous, page: 0 })); setAttempt((value) => value + 1); }} />}
  </section>;
}
