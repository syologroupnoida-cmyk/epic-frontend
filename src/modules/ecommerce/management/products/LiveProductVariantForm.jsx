import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import ProductVariantOption from './ProductVariantOption';
import { createEcommerceVariant, ecommerceLiveVariantPayload, ecommerceProductError, ecommerceProductId } from '@/util/ecommerceProducts.mjs';
import { primaryClass } from './ProductControls';

const emptyVariant = () => ({ sku: '', optionValues: {}, mrpAmountPaise: '', saleAmountPaise: '', initialStock: '0' });
export default function LiveProductVariantForm({ product, onAdded, disabled, onBusyChange }) {
  const [values, setValues] = useState(emptyVariant);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const options = product.optionDefinitions || [];
  const existing = product.variants || [];
  function change(key, value) { setValues((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    setFeedback(null);
    let payload;
    try { payload = ecommerceLiveVariantPayload(values, options, existing); }
    catch (error) { setFeedback({ error: true, text: ecommerceProductError(error) }); return; }
    const controller = new AbortController(); request.current = controller; setSaving(true); onBusyChange(true);
    try {
      const variant = await createEcommerceVariant(MainApi, ecommerceProductId(product), payload, { optionDefinitions: options, existingVariants: existing, signal: controller.signal });
      if (!controller.signal.aborted) { onAdded({ ...payload, ...(variant && typeof variant === 'object' ? variant : {}) }); setValues(emptyVariant()); setFeedback({ text: 'Variant added to the product.' }); }
    } catch (error) { if (!controller.signal.aborted) setFeedback({ error: true, text: ecommerceProductError(error) }); }
    finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); onBusyChange(false); } }
  }
  return <section className="space-y-4 border-t border-rose-100 pt-5"><h2 className="font-semibold text-stone-900">Add product variant</h2><p className="text-xs text-stone-500">Add another SKU and option combination to this draft. Prices are in paise.</p>{existing.length > 0 && <p className="text-xs text-stone-600">Saved variants: {existing.map((variant) => variant.sku).filter(Boolean).join(', ')}</p>}<form onSubmit={submit}><fieldset disabled={disabled || saving} className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><TextField required fullWidth size="small" label="SKU" disabled={disabled || saving} value={values.sku} onChange={(event) => change('sku', event.target.value)} />{options.map((option) => <ProductVariantOption key={option.name} option={option} disabled={disabled || saving} value={values.optionValues[option.name] || ''} onChange={(value) => change('optionValues', { ...values.optionValues, [option.name]: value })} />)}{[['mrpAmountPaise', 'MRP (paise)'], ['saleAmountPaise', 'Sale price (paise)'], ['initialStock', 'Initial stock']].map(([key, label]) => <TextField required fullWidth size="small" key={key} label={label} type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} disabled={disabled || saving} value={values[key]} onChange={(event) => change(key, event.target.value)} />)}</div>{feedback && <p role={feedback.error ? 'alert' : 'status'} className={`text-sm ${feedback.error ? 'text-red-700' : 'text-emerald-700'}`}>{feedback.text}</p>}<div className="flex justify-end"><button type="submit" className={primaryClass} disabled={disabled || saving}>{saving ? 'Adding variant...' : 'Save variant'}</button></div></fieldset></form></section>;
}
