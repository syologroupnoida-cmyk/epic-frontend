import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, FormControlLabel, Switch, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceProductError, ecommerceVariantId, ecommerceVariantUpdatePayload, updateEcommerceVariant } from '@/util/ecommerceProducts.mjs';

export default function ProductVariantEditor({ variant, disabled = false, onBusyChange, onSaved }) {
  const [sale, setSale] = useState(variant.saleAmountPaise ?? '');
  const [active, setActive] = useState(variant.isActive !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const operation = useRef(null);
  useEffect(() => () => operation.current?.abort(), []);
  async function submit(event) {
    event.preventDefault();
    if (operation.current || disabled) return;
    setError(''); setSaved(false);
    let payload;
    try {
      payload = ecommerceVariantUpdatePayload({ saleAmountPaise: sale, isActive: active });
      if (variant.mrpAmountPaise != null && payload.saleAmountPaise > Number(variant.mrpAmountPaise)) throw new Error('Sale price cannot exceed MRP.');
    } catch (err) { setError(ecommerceProductError(err)); return; }
    const controller = new AbortController(); operation.current = controller; setBusy(true); onBusyChange?.(true);
    try {
      const result = await updateEcommerceVariant(MainApi, ecommerceVariantId(variant), payload, controller.signal);
      if (!controller.signal.aborted) { onSaved?.({ ...variant, ...payload, ...(result && typeof result === 'object' ? result : {}) }); setSaved(true); }
    } catch (err) { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }
    finally { if (!controller.signal.aborted) { operation.current = null; setBusy(false); onBusyChange?.(false); } }
  }
  return <form onSubmit={submit} className="space-y-3 border-b border-stone-100 pb-4">
    <div className="grid items-center gap-4 md:grid-cols-3">
      <TextField size="small" label="SKU" value={variant.sku || ''} slotProps={{ htmlInput: { readOnly: true } }} />
      <TextField required size="small" label="Sale price (paise)" type="number" value={sale} disabled={disabled || busy} slotProps={{ htmlInput: { min: 0, step: 1, max: variant.mrpAmountPaise } }} onChange={(event) => { setSale(event.target.value); setSaved(false); }} />
      <div className="flex flex-wrap items-center justify-between gap-2"><FormControlLabel label="Active" control={<Switch checked={active} disabled={disabled || busy} onChange={(event) => { setActive(event.target.checked); setSaved(false); }} />} /><Button type="submit" variant="contained" disabled={disabled || busy || !ecommerceVariantId(variant)} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>{busy ? 'Saving...' : 'Save variant'}</Button></div>
    </div>
    {error && <Alert severity="error">{error}</Alert>}{saved && <Alert severity="success">Variant updated.</Alert>}
  </form>;
}
