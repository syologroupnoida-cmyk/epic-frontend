import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import MainApi from '@/util/MainApi';
import { adminLeadActions, fetchAdminLead, leadLabel, moderateAdminLead, validateLeadAction } from '@/util/adminLeads.mjs';
import { leadError } from '@/util/vendorLeads.mjs';
import LeadDetailContent from './LeadDetailContent';

export default function LeadDetails({ id, onClose, onUpdated, initialAction = '' }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState(initialAction);
  const [values, setValues] = useState({ basePrice: '', maxBuyerCount: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const request = useRef(null);
  const lock = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchAdminLead(MainApi, id, controller.signal).then((lead) => {
      if (!controller.signal.aborted) {
        setResult({ id, attempt, lead });
        if (initialAction && attempt === 0) setValues({ basePrice: lead.pricing?.basePrice ?? lead.basePrice ?? '', maxBuyerCount: lead.pricing?.maxBuyerCount ?? lead.maxBuyerCount ?? '', reason: '' });
      }
    }).catch((error) => { if (!controller.signal.aborted) setResult({ id, attempt, error: leadError(error) }); });
    return () => controller.abort();
  }, [id, attempt, initialAction]);
  const current = result?.id === id && result?.attempt === attempt ? result : null;
  const actions = adminLeadActions(current?.lead);
  const activeAction = actions.includes(action) ? action : '';
  const actionOnly = ['activate', 'reject'].includes(action);
  function chooseAction(next) {
    setAction(next); setErrors({}); setFeedback(null);
    setValues({ basePrice: current?.lead?.pricing?.basePrice ?? current?.lead?.basePrice ?? '', maxBuyerCount: current?.lead?.pricing?.maxBuyerCount ?? current?.lead?.maxBuyerCount ?? '', reason: '' });
  }
  function update(name, value) { setValues((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: '' })); }
  async function submit(event) {
    event.preventDefault();
    if (lock.current || !current?.lead || !actions.includes(action)) return;
    const validation = validateLeadAction(action, values); setErrors(validation);
    if (Object.keys(validation).length) return;
    lock.current = true; setPending(true); setFeedback(null);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await moderateAdminLead(MainApi, id, action, values, controller.signal);
      if (controller.signal.aborted) return;
      onUpdated(response.message);
      if (actionOnly) { onClose(); return; }
      setFeedback({ success: true, message: response.message }); setAction('');
      setAttempt((value) => value + 1);
    } catch (error) {
      if (!controller.signal.aborted) setFeedback({ success: false, message: leadError(error) });
    } finally { lock.current = false; if (!controller.signal.aborted) setPending(false); }
  }
  const buttonSx = { textTransform: 'none', color: '#b61f4b', borderColor: '#ecc3ce' };
  return <Dialog open onClose={pending ? undefined : onClose} disableEscapeKeyDown={pending} disableScrollLock maxWidth={actionOnly ? 'sm' : 'md'} fullWidth aria-labelledby="admin-lead-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
    <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e2e8f0' }}><Typography component="h2" id="admin-lead-title" sx={{ fontSize: 18, fontWeight: 600 }}>{actionOnly ? `${leadLabel(action)} lead` : 'Lead details'}</Typography><IconButton disabled={pending} aria-label="Close lead details" onClick={onClose} sx={{ width: 32, height: 32, borderRadius: '50%', '&:hover': { bgcolor: '#fff1f2', color: '#b61f4b' } }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></IconButton></DialogTitle>
    <DialogContent sx={{ pt: '20px !important' }}>
      {feedback && <Alert sx={{ mb: 2 }} severity={feedback.success ? 'success' : 'error'}>{feedback.message}</Alert>}
      {!current ? <div className="grid place-items-center py-12"><CircularProgress size={28} aria-label="Loading lead details" /></div> : current.error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert> : <>
          {action && !activeAction && <Alert severity="info" sx={{ mt: 2 }}>This action is no longer available for this lead.</Alert>}
          {activeAction && <form id="admin-lead-action" onSubmit={submit} noValidate className={actionOnly ? 'space-y-4' : 'mb-5 space-y-4 border-b border-slate-200 pb-5'} aria-busy={pending}>
            {!actionOnly && <h3 className="text-sm font-semibold text-slate-900">{leadLabel(action)} lead</h3>}
            {action === 'activate' ? <div className="grid gap-4 sm:grid-cols-2"><TextField autoFocus label="Base price (INR)" name="basePrice" size="small" type="number" required fullWidth disabled={pending} value={values.basePrice} onChange={(event) => update('basePrice', event.target.value)} error={Boolean(errors.basePrice)} helperText={errors.basePrice} slotProps={{ htmlInput: { min: 0, step: '0.01' } }} /><TextField label="Maximum buyer count" name="maxBuyerCount" size="small" type="number" required fullWidth disabled={pending} value={values.maxBuyerCount} onChange={(event) => update('maxBuyerCount', event.target.value)} error={Boolean(errors.maxBuyerCount)} helperText={errors.maxBuyerCount} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></div> : <TextField autoFocus label={action === 'reject' ? 'Rejection reason' : 'Closure reason'} name="reason" size="small" multiline rows={3} required fullWidth disabled={pending} value={values.reason} onChange={(event) => update('reason', event.target.value)} error={Boolean(errors.reason)} helperText={errors.reason} />}
          </form>}
        {!actionOnly && <LeadDetailContent lead={current.lead} />}
      </>}
    </DialogContent>
    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
      {!actionOnly && <Button disabled={pending} onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Close</Button>}
      {current?.lead && activeAction && <>
        <Button disabled={pending} sx={buttonSx} onClick={() => ['activate', 'reject'].includes(initialAction) ? onClose() : setAction('')}>Cancel</Button>
        <Button
          type="submit"
          form="admin-lead-action"
          disabled={pending}
          variant="contained"
          sx={{ textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}
        >
          {pending ? 'Saving...' : `Confirm ${action === 'activate' ? 'activation' : action === 'reject' ? 'rejection' : 'closure'}`}
        </Button>
      </>}
      {current?.lead && !activeAction && actions.map((item) => (
        <Button
          key={item}
          disabled={pending}
          variant={item === 'activate' ? 'contained' : 'outlined'}
          onClick={() => chooseAction(item)}
          sx={{
            ...buttonSx,
            borderColor: '#b61f4b',
            color: item === 'activate' ? '#fff' : '#b61f4b',
            bgcolor: item === 'activate' ? '#b61f4b' : undefined,
            '&:hover': { bgcolor: item === 'activate' ? '#981a3f' : '#fff1f2' },
          }}
        >
          {leadLabel(item)} lead
        </Button>
      ))}
    </DialogActions>
  </Dialog>;
}
