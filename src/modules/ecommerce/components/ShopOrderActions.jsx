import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, ListItemIcon, Menu, MenuItem, SvgIcon, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { canCancelShopOrder, canReturnShopOrder, cancelShopOrder, requestShopOrderReturn, shopOrderId, shopOrderReasonPayload } from '@/util/shopAccount.mjs';
import { shopError } from '@/util/shopCatalog.mjs';
import { agentListActionButtonSx } from '@/components/vendor/listings/tableStyles';
import ApiStatusModal from '@/components/common/ApiStatusModal';

export default function ShopOrderActions({ order, onView, onChanged }) {
  const [anchor, setAnchor] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const cancel = canCancelShopOrder(order);
  const returns = canReturnShopOrder(order);
  function open(value) { setAnchor(null); setAction(value); setReason(''); setError(''); setUncertain(false); }
  async function submit(event) {
    event.preventDefault();
    if (request.current || uncertain) return;
    let payload;
    try { payload = shopOrderReasonPayload({ reason }); } catch (err) { setError(shopError(err)); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      await (action === 'cancel' ? cancelShopOrder : requestShopOrderReturn)(MainApi, shopOrderId(order), payload, controller.signal);
      if (!controller.signal.aborted) { setAction(''); setSuccess(action === 'cancel' ? 'Order cancelled successfully.' : 'Return request submitted successfully.'); }
    } catch (err) {
      if (!controller.signal.aborted) {
        const unknown = !err.response || err.response.status >= 500 || err.response.status === 408;
        setUncertain(unknown);
        setError(unknown ? 'The request could not be confirmed. Refresh the order to check its status before trying again.' : shopError(err));
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  const actionIcon = (name) => <ListItemIcon><SvgIcon fontSize="small"><path d={name === 'view' ? 'M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z' : name === 'cancel' ? 'M6 4 4 6l6 6-6 6 2 2 6-6 6 6 2-2-6-6 6-6-2-2-6 6Z' : 'M7 3 1 9l6 6v-4h8a4 4 0 0 1 0 8h-3v2h3a6 6 0 0 0 0-12H7V3Z'} /></SvgIcon></ListItemIcon>;
  return <>
    {onView ? <><IconButton size="small" aria-label={`Actions for order ${order.orderNumber || shopOrderId(order)}`} aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={(event) => setAnchor(event.currentTarget)} sx={agentListActionButtonSx}><SvgIcon fontSize="small"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></SvgIcon></IconButton><Menu disableScrollLock anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2 } } }}><MenuItem sx={{ fontSize: 12 }} onClick={() => { setAnchor(null); onView(); }}>{actionIcon('view')}View details</MenuItem>{cancel && <MenuItem sx={{ fontSize: 12 }} onClick={() => open('cancel')}>{actionIcon('cancel')}Cancel order</MenuItem>}{returns && <MenuItem sx={{ fontSize: 12 }} onClick={() => open('return')}>{actionIcon('return')}Request return</MenuItem>}</Menu></> : <div className="flex flex-wrap gap-2">{cancel && <Button size="small" color="error" variant="outlined" onClick={() => open('cancel')}>Cancel order</Button>}{returns && <Button size="small" variant="outlined" onClick={() => open('return')}>Request return</Button>}</div>}
    <Dialog open={Boolean(action)} onClose={() => { if (!busy) { setAction(''); if (uncertain) onChanged(); } }} fullWidth maxWidth="sm" disableScrollLock>
      <form onSubmit={submit}><DialogTitle>{action === 'cancel' ? 'Cancel pending order' : 'Request a return'}</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<TextField autoFocus fullWidth required multiline minRows={3} margin="dense" label={action === 'cancel' ? 'Cancellation reason' : 'Return reason'} placeholder={action === 'cancel' ? 'Changed my mind' : 'Product arrived damaged'} value={reason} onChange={(event) => setReason(event.target.value)} disabled={busy || uncertain} /></DialogContent><DialogActions><Button disabled={busy} onClick={() => { setAction(''); if (uncertain) onChanged(); }}>{uncertain ? 'Refresh order' : 'Close'}</Button><Button type="submit" color={action === 'cancel' ? 'error' : 'primary'} variant="contained" disabled={busy || uncertain || !reason.trim()} startIcon={busy ? <CircularProgress color="inherit" size={15} /> : undefined}>{busy ? 'Submitting...' : action === 'cancel' ? 'Confirm cancellation' : 'Submit return request'}</Button></DialogActions></form>
    </Dialog>
    <ApiStatusModal status={success ? 'success' : undefined} title={success} onOk={() => { setSuccess(''); onChanged(); }} />
  </>;
}
