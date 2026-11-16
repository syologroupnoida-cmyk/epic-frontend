import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, SvgIcon, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { cancelEcommerceOrder, ecommerceFulfilmentPayload, ecommerceOrderActions, markEcommerceOrderPaidForTest, updateEcommerceOrderFulfilment } from '@/util/ecommerceOrders.mjs';
import { shopOrderId, shopOrderReasonPayload } from '@/util/shopAccount.mjs';
import { shopError } from '@/util/shopCatalog.mjs';
import { agentListActionButtonSx } from '@/components/vendor/listings/tableStyles';
import ApiStatusModal from '@/components/common/ApiStatusModal';
export default function EcommerceOrderActions({ order, onView, onChanged }) {
  const [anchor, setAnchor] = useState(null);
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [success, setSuccess] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const actions = ecommerceOrderActions(order);
  function open(next) { setAnchor(null); setAction(next); setForm({ reason: '', courierName: '', trackingNumber: '', trackingUrl: '' }); setError(''); setNeedsRefresh(false); }
  function close() { if (!busy) { setAction(null); if (needsRefresh) onChanged(); } }
  async function submit(event) {
    event.preventDefault();
    if (request.current || needsRefresh) return;
    let payload;
    try { payload = action.key === 'cancel' ? shopOrderReasonPayload(form) : action.key === 'mark-paid' ? {} : ecommerceFulfilmentPayload({ ...form, status: action.key }); }
    catch (err) { setError(shopError(err)); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      const id = shopOrderId(order);
      if (action.key === 'mark-paid') await markEcommerceOrderPaidForTest(MainApi, id, controller.signal);
      else if (action.key === 'cancel') await cancelEcommerceOrder(MainApi, id, payload, controller.signal);
      else await updateEcommerceOrderFulfilment(MainApi, id, payload, controller.signal);
      if (!controller.signal.aborted) { setAction(null); setSuccess(action.key === 'mark-paid' ? 'Order marked paid for testing.' : action.key === 'cancel' ? 'Order cancelled successfully.' : 'Order fulfilment updated successfully.'); }
    } catch (err) {
      if (!controller.signal.aborted) {
        const uncertain = !err.response || err.response.status >= 500 || err.response.status === 408;
        setNeedsRefresh(uncertain || err.response?.status === 409);
        setError(uncertain ? 'The update could not be confirmed. Refresh this order before trying again.' : shopError(err));
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  const icon = <ListItemIcon><SvgIcon fontSize="small"><path d="m9 16-4-4 1.4-1.4L9 13.2l8.6-8.6L19 6Z" /></SvgIcon></ListItemIcon>;
  return <>
    {onView ? <><IconButton aria-label={`Actions for order ${order.orderNumber || shopOrderId(order)}`} aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={event => setAnchor(event.currentTarget)} sx={agentListActionButtonSx}><SvgIcon fontSize="small"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></SvgIcon></IconButton><Menu disableScrollLock anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 2 } } }}><MenuItem sx={{ fontSize: 12 }} onClick={() => { setAnchor(null); onView(); }}>{icon}View details</MenuItem>{actions.map(next => <MenuItem key={next.key} sx={{ fontSize: 12 }} onClick={() => open(next)}>{icon}{next.label}</MenuItem>)}</Menu></> : <div className="flex flex-wrap gap-2">{actions.map(next => <Button key={next.key} size="small" variant="outlined" color={next.key === 'cancel' ? 'error' : 'primary'} onClick={() => open(next)}>{next.label}</Button>)}</div>}
    <Dialog open={Boolean(action)} onClose={close} fullWidth maxWidth="sm" disableScrollLock><form onSubmit={submit}><DialogTitle>{action?.label}</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{action?.key === 'cancel' ? <TextField autoFocus label="Cancellation reason" required fullWidth multiline minRows={3} margin="dense" value={form.reason || ''} disabled={busy || needsRefresh} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} placeholder="Customer requested cancellation" /> : action?.key === 'SHIPPED' ? <div className="grid gap-3 pt-2">{[['courierName', 'Courier name'], ['trackingNumber', 'Tracking number'], ['trackingUrl', 'Tracking URL']].map(([key, label]) => <TextField key={key} required fullWidth size="small" type={key === 'trackingUrl' ? 'url' : 'text'} label={label} value={form[key] || ''} disabled={busy || needsRefresh} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} />)}</div> : <p className="text-sm text-stone-600">{action?.key === 'mark-paid' ? 'Mark this order as paid for testing?' : `Confirm ${action?.label.toLowerCase()} for this order?`}</p>}</DialogContent><DialogActions><Button disabled={busy} onClick={close}>{needsRefresh ? 'Refresh order' : 'Close'}</Button><Button type="submit" variant="contained" disabled={busy || needsRefresh} startIcon={busy ? <CircularProgress color="inherit" size={15} /> : undefined}>{busy ? 'Saving...' : 'Confirm'}</Button></DialogActions></form></Dialog>
    <ApiStatusModal status={success ? 'success' : undefined} title={success} onOk={() => { setSuccess(''); onChanged(); }} />
  </>;
}
