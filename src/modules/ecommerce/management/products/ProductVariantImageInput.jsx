import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, MenuItem, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceProductError, uploadEcommerceProductImage } from '@/util/ecommerceProducts.mjs';
import { productSelectSlotProps } from './ProductControls';

export default function ProductVariantImageInput({ value = '', images, label, disabled, onChange, onBusyChange, uploadOnly = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = useRef(null);
  useEffect(() => () => operation.current?.abort(), []);
  const choices = images.filter(image => image.url);
  async function upload(file) {
    if (!file || disabled || operation.current) return;
    const controller = new AbortController(); operation.current = controller;
    setBusy(true); setError(''); onBusyChange(true);
    try {
      const image = await uploadEcommerceProductImage(MainApi, file, controller.signal);
      if (!controller.signal.aborted) onChange(image.url);
    } catch (error) { if (!controller.signal.aborted) setError(ecommerceProductError(error)); }
    finally { if (!controller.signal.aborted) { operation.current = null; setBusy(false); onBusyChange(false); } }
  }
  if (uploadOnly) return <div className="min-w-0 space-y-2">
    <div className="relative"><input type="file" accept="image/*" aria-label={label} aria-busy={busy} disabled={disabled || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; upload(file); }} className="block w-full min-w-0 cursor-pointer rounded border border-stone-400 bg-white pr-8 text-sm text-stone-600 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-stone-300 file:bg-stone-50 file:px-3 file:py-2 file:text-sm file:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50" />{busy && <span role="status" aria-label="Uploading image" className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center bg-white"><CircularProgress size={18} sx={{ color: '#b61f4b' }} /></span>}</div>
    {value && <div className="relative inline-block"><Image src={value} alt={label} width={40} height={40} unoptimized className="h-10 w-10 rounded border border-stone-200 object-cover" /><button type="button" aria-label={`Remove ${label.toLowerCase()}`} disabled={disabled || busy} onClick={() => onChange('')} className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-stone-800 text-xs leading-none text-white hover:bg-red-700 disabled:opacity-50"><span aria-hidden="true">&times;</span></button></div>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
  return <div className="min-w-0 space-y-2">
    <TextField select slotProps={productSelectSlotProps} fullWidth size="small" label={label} value={value} disabled={disabled || busy} onChange={event => onChange(event.target.value)}>
      <MenuItem value="">Use product gallery</MenuItem>
      {value && !choices.some(image => image.url === value) && <MenuItem value={value}>Uploaded variant image</MenuItem>}
      {choices.map((image, index) => <MenuItem key={image.key || image.url} value={image.url}>{image.altText || image.filename || `Product image ${index + 1}`}</MenuItem>)}
    </TextField>
    <div className="flex items-center gap-2">
      {value && <Image src={value} alt={label} width={40} height={40} unoptimized className="h-10 w-10 rounded border border-stone-200 object-cover" />}
      <Button component="label" size="small" disabled={disabled || busy} sx={{ fontSize: 11, textTransform: 'none' }}>{busy ? 'Uploading...' : 'Upload variant image'}<input hidden type="file" accept="image/*" aria-label={`Upload ${label.toLowerCase()}`} disabled={disabled || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; upload(file); }} /></Button>
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
