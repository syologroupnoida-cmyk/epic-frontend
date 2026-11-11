import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, TablePagination, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import MeetingStatusChip, { meetingStatusSx } from '@/components/vendor/meetings/MeetingStatusChip';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import { adminMeetingScheduleDefaults, adminMeetingStatuses, fetchAdminSalesMeeting, fetchAdminSalesMeetings, salesMeetingVendor, updateAdminSalesMeeting, validateAdminMeetingUpdate } from '@/util/adminSalesMeetings.mjs';
import { filterMeetingRows, meetingDate, meetingError, meetingLabel, salesMeetingId } from '@/util/vendorMeetings.mjs';
import MeetingTableSearch from '@/components/vendor/meetings/MeetingTableSearch';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import { MoreVert, ViewOutlined } from '@/components/vendor/listings/ServiceIcons';

function DecisionIcon({ reject = false }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d={reject ? 'm8 8 8 8M16 8l-8 8' : 'm7 12 3 3 7-7'} /></svg>;
}

function MeetingSummary({ meeting }) {
  const vendor = salesMeetingVendor(meeting);
  const rows = [
    ['Vendor', vendor.name], ['Email', vendor.email], ['Phone', vendor.phone], ['Status', meetingLabel(meeting.status)],
    ['Requested start', meetingDate(meeting.requestedStartAt)], ['Requested end', meetingDate(meeting.requestedEndAt)],
    ['Vendor note', meeting.vendorNote], ['Scheduled start', meetingDate(meeting.scheduledStartAt)], ['Scheduled end', meetingDate(meeting.scheduledEndAt)],
    ['Message to vendor', meeting.vendorMessage], ['Internal admin note', meeting.adminNote], ['Requested on', meetingDate(meeting.createdAt)],
  ];
  return <dl className="overflow-hidden rounded-lg border border-slate-200 text-sm">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[125px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[155px_minmax(0,1fr)]"><dt className="font-medium text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words text-slate-900">{value || '—'}</dd></div>)}</dl>;
}

function MeetingModal({ id, mode, onClose, onUpdated }) {
  const [meeting, setMeeting] = useState(null);
  const [values, setValues] = useState({ status: mode === 'reject' ? 'REJECTED' : 'CONFIRMED', scheduledStartAt: '', scheduledEndAt: '', vendorMessage: '', adminNote: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveRequest = useRef(null);
  const editing = mode !== 'detail';
  const confirm = mode === 'confirm';
  useEffect(() => () => saveRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchAdminSalesMeeting(MainApi, id, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setMeeting(data); setError('');
      setValues({ status: mode === 'reject' ? 'REJECTED' : 'CONFIRMED', ...adminMeetingScheduleDefaults(data), vendorMessage: data.vendorMessage || '', adminNote: data.adminNote || '' });
    }).catch((failure) => { if (!controller.signal.aborted) setError(meetingError(failure)); });
    return () => controller.abort();
  }, [id, mode, attempt]);
  function change(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: '' })); setError('');
  }
  function validateDateField(event) {
    const { name } = event.target;
    const validation = validateAdminMeetingUpdate(values);
    setErrors((current) => ({ ...current, [name]: validation[name] || '' }));
  }
  function refreshExpiredSchedule() {
    const schedule = adminMeetingScheduleDefaults({ scheduledStartAt: `${values.scheduledStartAt}:00+05:30`, scheduledEndAt: `${values.scheduledEndAt}:00+05:30` });
    setValues((current) => ({ ...current, ...schedule }));
    setErrors({ scheduledStartAt: 'Start time updated to a future time. Review the dates and click Confirm meeting again.' });
    setError('');
  }
  async function save(event) {
    event.preventDefault();
    if (!editing || !meeting || saveRequest.current) return;
    if (confirm && Date.parse(`${values.scheduledStartAt}:00+05:30`) <= Date.now()) {
      refreshExpiredSchedule();
      return;
    }
    const validation = validateAdminMeetingUpdate(values); setErrors(validation);
    if (Object.keys(validation).length) return;
    const controller = new AbortController(); saveRequest.current = controller;
    setSaving(true); setError('');
    try {
      const message = await updateAdminSalesMeeting(MainApi, id, values, controller.signal);
      if (!controller.signal.aborted) onUpdated(message);
    } catch (failure) {
      if (!controller.signal.aborted) {
        const message = meetingError(failure);
        if (confirm && /scheduledStartAt.*future/i.test(message)) {
          setErrors({ scheduledStartAt: message });
        } else setError(message);
      }
    }
    finally { if (!controller.signal.aborted) { saveRequest.current = null; setSaving(false); } }
  }
  const title = !editing ? 'Sales meeting details' : confirm ? 'Confirm meeting' : 'Reject meeting';
  return <Dialog open fullWidth maxWidth="sm" onClose={(_, reason) => { if (!saving && reason !== 'backdropClick') onClose(); }} aria-labelledby="admin-sales-meeting-title">
    <form onSubmit={save} noValidate aria-busy={saving}>
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}><h2 id="admin-sales-meeting-title" className="text-base font-semibold">{title}</h2><IconButton size="small" aria-label="Close meeting dialog" disabled={saving} onClick={onClose} sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', bgcolor: '#f1f5f9', color: '#64748b', '&:hover': { bgcolor: '#fce7ef', color: '#b61f4b' } }}><span aria-hidden="true">×</span></IconButton></DialogTitle>
      <DialogContent dividers sx={editing ? { py: 2 } : undefined}>
        {error && <Alert severity="error" sx={{ mb: 2 }} action={!meeting ? <Button color="inherit" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</Button> : undefined}>{error}</Alert>}
        {!meeting ? !error && <p role="status" className="py-10 text-center text-sm text-slate-500">Loading meeting details...</p> : !editing ? <MeetingSummary meeting={meeting} /> : <div className="grid gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600"><p className="font-semibold text-slate-900">{salesMeetingVendor(meeting).name}</p><p>Requested: {meetingDate(meeting.requestedStartAt)} → {meetingDate(meeting.requestedEndAt)}</p>{meeting.vendorNote && <p className="mt-1 whitespace-pre-wrap break-words">{meeting.vendorNote}</p>}</div>
          <TextField label="Status" value={values.status} fullWidth size="small" slotProps={{ input: { readOnly: true } }} sx={{ '& .MuiInputBase-input, & .MuiInputLabel-root': { color: meetingStatusSx(values.status).color }, '& .MuiOutlinedInput-root fieldset, & .MuiOutlinedInput-root:hover fieldset, & .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: meetingStatusSx(values.status).borderColor } }} />
          {confirm && <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2" onBlur={validateDateField}>
            <TextField type="datetime-local" name="scheduledStartAt" label="Scheduled start (India time)" required fullWidth size="small" value={values.scheduledStartAt} onChange={change} disabled={saving} error={Boolean(errors.scheduledStartAt)} helperText={errors.scheduledStartAt} slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 60 } }} />
            <TextField type="datetime-local" name="scheduledEndAt" label="Scheduled end (India time)" required fullWidth size="small" value={values.scheduledEndAt} onChange={change} disabled={saving} error={Boolean(errors.scheduledEndAt)} helperText={errors.scheduledEndAt} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: values.scheduledStartAt || undefined, step: 60 } }} />
          </div>}
          <TextField name="vendorMessage" label="Vendor message" fullWidth multiline minRows={2} maxRows={4} size="small" value={values.vendorMessage} onChange={change} disabled={saving} error={Boolean(errors.vendorMessage)} helperText={errors.vendorMessage || 'Visible to the vendor.'} />
          <TextField name="adminNote" label="Admin note" fullWidth multiline minRows={2} maxRows={4} size="small" value={values.adminNote} onChange={change} disabled={saving} error={Boolean(errors.adminNote)} helperText={errors.adminNote || 'Internal note for admins only.'} />
        </div>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: editing ? 1.5 : 2 }}><Button type="button" onClick={onClose} disabled={saving}>{editing ? 'Cancel' : 'Close'}</Button>{editing && <Button type="submit" variant="contained" disabled={!meeting || saving} sx={{ bgcolor: confirm ? '#15803d' : '#b91c1c', textTransform: 'none' }}>{saving ? 'Saving...' : title}</Button>}</DialogActions>
    </form>
  </Dialog>;
}

export default function SalesMeetings() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState({ page: 0, limit: 20, status: '' });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [menu, setMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [success, setSuccess] = useState('');
  const key = JSON.stringify({ ...query, attempt });
  function changeQuery(values) { setMenu(null); setQuery((current) => ({ ...current, ...values })); }
  useEffect(() => {
    const controller = new AbortController();
    fetchAdminSalesMeetings(MainApi, { ...query, page: query.page + 1, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult({ key, ...data }); }).catch((failure) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: meetingError(failure) }); });
    return () => controller.abort();
  }, [key, query]);
  const current = result?.key === key ? result : null;
  const rows = filterMeetingRows(current?.items || [], search);
  const statuses = [...new Set([...adminMeetingStatuses, query.status, ...rows.map((row) => row.status)].filter(Boolean))];
  function openModal(mode) { if (!menu?.id) return; setModal({ id: menu.id, mode }); setMenu(null); }
  return <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="shrink-0 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Sales Meetings</h1></div>
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-2.5"><TextField select label="Status" size="small" value={query.status} onChange={(event) => changeQuery({ status: event.target.value, page: 0 })} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, MenuProps: { disableScrollLock: true } } }} sx={{ minWidth: 160, '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& .MuiInputBase-input': { py: .75 }, '& .MuiInputLabel-root': { fontSize: 12 } }}><MenuItem value="">All statuses</MenuItem>{statuses.map((status) => <MenuItem key={status} value={status}>{meetingLabel(status)}</MenuItem>)}</TextField><MeetingTableSearch value={search} onChange={(value) => { setMenu(null); setSearch(value); }} /></div>
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={() => { setMenu(null); setAttempt((value) => value + 1); }}>Retry</Button>}>{current.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[1100px] text-left text-sm" aria-label="Admin sales meetings"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['Vendor', 'Requested start', 'Requested end', 'Status', 'Scheduled time', 'Requested on', 'Actions'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">
      {!current ? <tr><td colSpan={7} role="status" className="px-4 py-12 text-center text-slate-500">Loading sales meetings...</td></tr> : !rows.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{current.error ? 'Sales meetings could not be loaded.' : search.trim() ? 'No meetings on this page match your search.' : 'No meetings match this status.'}</td></tr> : rows.map((row, index) => {
        const id = salesMeetingId(row), vendor = salesMeetingVendor(row);
        return <tr key={id || index} className="hover:bg-slate-50"><td className="max-w-56 px-4 py-3"><p className="truncate text-xs font-semibold" title={vendor.name}>{vendor.name}</p>{vendor.email && <p className="mt-1 truncate text-xs text-slate-500">{vendor.email}</p>}{row.vendorNote && <p className="mt-1 truncate text-xs text-slate-500" title={row.vendorNote}>{row.vendorNote}</p>}</td><td className="px-4 py-3 text-xs">{meetingDate(row.requestedStartAt)}</td><td className="px-4 py-3 text-xs">{meetingDate(row.requestedEndAt)}</td><td className="px-4 py-3"><MeetingStatusChip status={row.status} /></td><td className="px-4 py-3 text-xs"><p>{meetingDate(row.scheduledStartAt)}</p>{row.scheduledEndAt && <p className="mt-1 text-slate-500">to {meetingDate(row.scheduledEndAt)}</p>}</td><td className="px-4 py-3 text-xs">{meetingDate(row.createdAt)}</td><td className="px-4 py-3"><IconButton size="small" aria-label={`Actions for ${vendor.name} meeting`} aria-haspopup="menu" aria-expanded={menu?.id === id || undefined} disabled={!id} onClick={(event) => setMenu({ anchor: event.currentTarget, id })} sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}><MoreVert fontSize="small" /></IconButton></td></tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => changeQuery({ page })} onRowsPerPageChange={(event) => changeQuery({ page: 0, limit: Number(event.target.value) })} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={{ ...agentListPaginationSx, flexShrink: 0 }} />
    <Menu anchorEl={menu?.anchor || null} open={Boolean(menu)} onClose={() => setMenu(null)} disableScrollLock anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { 'aria-label': 'Sales meeting actions' }, paper: { sx: { minWidth: 215, borderRadius: 1.5, border: '1px solid #e2e8f0', '& .MuiMenuItem-root': { fontSize: 16, py: 1.25 } } } }}>
      <MenuItem onClick={() => openModal('detail')}><ListItemIcon><ViewOutlined fontSize="small" /></ListItemIcon>View detail</MenuItem>
      <MenuItem onClick={() => openModal('confirm')}><ListItemIcon sx={{ color: '#15803d' }}><DecisionIcon /></ListItemIcon>Confirm meeting</MenuItem>
      <MenuItem onClick={() => openModal('reject')}><ListItemIcon sx={{ color: '#b91c1c' }}><DecisionIcon reject /></ListItemIcon>Reject meeting</MenuItem>
    </Menu>
    {modal && <MeetingModal key={`${modal.id}:${modal.mode}`} {...modal} onClose={() => setModal(null)} onUpdated={(message) => { setModal(null); setSuccess(message); changeQuery({ page: 0 }); setAttempt((value) => value + 1); }} />}
    <ApiStatusModal status={success ? 'success' : null} title="Sales meeting updated" text={success} onOk={() => setSuccess('')} />
  </section>;
}
