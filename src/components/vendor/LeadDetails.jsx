import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchVendorLead, leadDate, leadError, leadSummary, sharedLeadPrice, isLeadPurchased } from '@/util/vendorLeads.mjs';

const fieldLabel = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (value) => value.toUpperCase());

function Value({ value, field = '' }) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">Not provided</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? <ul className="space-y-2">{value.map((item, index) => <li key={index} className="rounded border border-slate-100 bg-white p-2"><Value value={item} /></li>)}</ul> : 'None';
  if (typeof value === 'object') return <dl className="space-y-2">{Object.entries(value).map(([key, item]) => <div key={key}><dt className="text-[11px] font-normal text-slate-500">{fieldLabel(key)}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words"><Value value={item} field={key} /></dd></div>)}</dl>;
  if (typeof value === 'string' && /(?:At|Date)$/.test(field) && /^\d{4}-\d{2}-\d{2}/.test(value)) return leadDate(value, field.endsWith('At'));
  if (/budget|price/i.test(field) && Number.isFinite(Number(value))) return Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  return String(value);
}

export function LeadDetailFields({ lead }) {
  return <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(lead).map(([key, value]) => <div key={key} className={`min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 ${['message', 'notes', 'description'].includes(key) ? 'sm:col-span-2' : ''}`}><dt className="text-[11px] font-medium text-slate-500">{fieldLabel(key)}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800"><Value value={value} field={key} /></dd></div>)}</dl>;
}

export default function LeadDetails({ id, onClose, sharedId, fallbackLead, onPurchase, purchasing = false, purchased = false, purchaseFeedback }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchVendorLead(MainApi, id, controller.signal).then((lead) => {
      if (!controller.signal.aborted) setResult({ id, attempt, lead });
    }).catch((error) => { if (!controller.signal.aborted) setResult({ id, attempt, error: leadError(error, 'Unable to load lead details.') }); });
    return () => controller.abort();
  }, [id, attempt]);
  const current = result?.id === id && result?.attempt === attempt ? result : null;
  const lead = current?.lead || fallbackLead;
  const alreadyPurchased = purchased || isLeadPurchased(fallbackLead) || isLeadPurchased(lead);
  return <Dialog open onClose={onClose} maxWidth="md" fullWidth disableScrollLock aria-labelledby="vendor-lead-details-title" slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '88dvh' } } }}>
    <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}><div><h2 id="vendor-lead-details-title" className="text-lg font-semibold text-slate-900">Lead details</h2><p className="mt-1 break-all text-xs font-normal text-slate-500">{id}</p></div><IconButton aria-label="Close lead details" onClick={onClose} size="small"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></IconButton></DialogTitle>
    <DialogContent sx={{ pt: '20px !important' }}>{purchaseFeedback && <Alert severity={purchaseFeedback.success ? 'success' : 'error'} sx={{ mb: 2 }}>{purchaseFeedback.message}</Alert>}{current?.error && fallbackLead && <Alert severity="info" sx={{ mb: 2 }}>Showing the information available in the shared lead list. {current.error}</Alert>}{!current && !lead ? <div role="status" className="grid place-items-center py-12"><CircularProgress size={28} aria-label="Loading lead details" /></div> : current?.error && !lead ? <Alert severity="error">{current.error}</Alert> : lead && <><div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-5 py-4"><h3 className="text-base font-semibold text-[#7d203c]">{leadSummary(lead).customerName}</h3><p className="mt-1 text-xs text-slate-600">{leadSummary(lead).subject}</p></div><LeadDetailFields lead={lead} /></>}</DialogContent>
    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>{onPurchase && sharedId && <Button variant="contained" disabled={purchasing || alreadyPurchased || fallbackLead?.canPurchase === false} onClick={async () => { if (await onPurchase(sharedId)) setAttempt((value) => value + 1); }} sx={{ mr: 'auto', textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>{alreadyPurchased ? 'Purchased' : purchasing ? 'Purchasing...' : `Purchase lead${sharedLeadPrice(fallbackLead) ? ` - ${sharedLeadPrice(fallbackLead)}` : ''}`}</Button>}{current?.error && <Button onClick={() => setAttempt((value) => value + 1)} sx={{ textTransform: 'none', color: '#b61f4b' }}>Retry</Button>}<Button onClick={onClose} sx={{ textTransform: 'none', color: '#b61f4b' }}>Close</Button></DialogActions>
  </Dialog>;
}
