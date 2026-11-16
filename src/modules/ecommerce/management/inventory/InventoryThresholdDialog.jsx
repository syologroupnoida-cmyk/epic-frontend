import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceProductError } from '@/util/ecommerceProducts.mjs';
import { inventorySettingsPayload, inventorySku, inventoryThreshold, inventoryVariantId, updateEcommerceInventorySettings } from '@/util/ecommerceInventory.mjs';

export default function InventoryThresholdDialog({ variant, onClose, onSaved }) {
  const [threshold, setThreshold] = useState(() => inventoryThreshold(variant) ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    setError('');
    let payload;
    try { payload = inventorySettingsPayload({ lowStockThreshold: threshold }); }
    catch (err) { setError(ecommerceProductError(err)); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true);
    try {
      await updateEcommerceInventorySettings(MainApi, inventoryVariantId(variant), payload, controller.signal);
      if (!controller.signal.aborted) onSaved(payload);
    } catch (err) { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  return <Dialog open fullWidth maxWidth="xs" disableScrollLock onClose={() => { if (!busy) onClose(); }} aria-labelledby="inventory-threshold-title">
    <form onSubmit={submit} aria-busy={busy}>
      <DialogTitle id="inventory-threshold-title" sx={{ fontSize: 17, fontWeight: 600 }}>Set low-stock threshold</DialogTitle>
      <DialogContent><p className="mb-5 text-xs text-stone-500">Variant: <strong>{inventorySku(variant)}</strong></p>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<TextField autoFocus fullWidth required size="small" label="Low-stock threshold" type="number" value={threshold} disabled={busy} slotProps={{ htmlInput: { min: 0, step: 1 } }} helperText="Enter a non-negative whole number." onChange={(event) => setThreshold(event.target.value)} /></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button type="button" disabled={busy} onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button><Button type="submit" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>{busy ? 'Saving...' : 'Save threshold'}</Button></DialogActions>
    </form>
  </Dialog>;
}
