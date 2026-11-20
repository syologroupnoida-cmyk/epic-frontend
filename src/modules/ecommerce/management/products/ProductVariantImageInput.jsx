import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button, MenuItem, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceProductError, uploadEcommerceProductImage } from '@/util/ecommerceProducts.mjs';
import { productSelectSlotProps } from './ProductControls';

export default function ProductVariantImageInput({ value = '', images, label, disabled, onChange, onBusyChange }) {
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
