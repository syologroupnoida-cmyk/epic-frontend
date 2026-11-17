import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, IconButton, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { attachEcommerceProductImage, ecommerceProductError, ecommerceProductImageId, ecommerceProductImagePayload, uploadEcommerceProductImage } from '@/util/ecommerceProducts.mjs';
import { imageDescriptionFromFilename } from '@/util/productPresentation.mjs';

export default function ProductImageUpload({ productId = '', images, onImagesChange, disabled = false, onBusyChange, onRemoveSavedImage }) {
  const [busy, setBusy] = useState(false);
  const operation = useRef(null);
  const previews = useRef([]);
  useEffect(() => () => { operation.current?.abort(); previews.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  function update(key, changes) { onImagesChange((current) => current.map((row) => row.key === key ? { ...row, ...changes } : row)); }
  function select(file) {
    if (!file || operation.current) return;
    const preview = URL.createObjectURL(file); previews.current.push(preview);
    onImagesChange((current) => [...current, { key: crypto.randomUUID(), file, filename: file.name, preview, altText: imageDescriptionFromFilename(file.name), sortOrder: current.reduce((max, row) => Math.max(max, Number(row.sortOrder) || 0), 0) + 1, attached: false, status: 'queued' }]);
  }
  const pending = images.filter((row) => !row.attached && (!row.url || productId));
  async function removeImage(row) {
    if (disabled || operation.current || row.removalUncertain || (row.attached && !onRemoveSavedImage)) return;
    if (!row.attached) {
      onImagesChange((current) => current.filter((image) => image.key !== row.key));
      if (row.preview) { URL.revokeObjectURL(row.preview); previews.current = previews.current.filter(url => url !== row.preview); }
      return;
    }
    const controller = new AbortController(); operation.current = controller; setBusy(true); onBusyChange?.(true);
    try {
      await onRemoveSavedImage(row, controller.signal);
      if (!controller.signal.aborted) onImagesChange((current) => current.filter((image) => image.key !== row.key));
    } catch (error) {
      if (!controller.signal.aborted) {
        const uncertain = !error.response || error.response.status >= 500 || error.response.status === 408;
        update(row.key, { removalUncertain: uncertain, error: `${uncertain ? 'Removal could not be confirmed. Refresh the product before trying again. ' : ''}${ecommerceProductError(error)}` });
      }
    }
    finally { if (!controller.signal.aborted) { operation.current = null; setBusy(false); onBusyChange?.(false); } }
  }
  async function upload() {
    if (operation.current || !pending.length) return;
    const controller = new AbortController(); operation.current = controller; setBusy(true); onBusyChange?.(true);
    try {
      for (const row of pending) {
        let uploaded = row.url ? { url: row.url, publicId: row.publicId } : null;
        try {
          // Validate order before uploading, so an invalid form cannot orphan a new asset.
          ecommerceProductImagePayload({ ...row, url: row.url || 'https://upload.invalid/pending', publicId: row.publicId || 'pending' });
          update(row.key, { status: uploaded ? 'attaching' : 'uploading', error: '' });
          if (!uploaded) uploaded = await uploadEcommerceProductImage(MainApi, row.file, controller.signal);
          if (controller.signal.aborted) return;
          update(row.key, { ...uploaded, status: productId ? 'attaching' : 'uploaded' });
          if (productId) {
            const attached = await attachEcommerceProductImage(MainApi, productId, { ...row, ...uploaded }, controller.signal);
            if (controller.signal.aborted) return;
            const saved = attached?.image || attached?.ecommerceProductImage || attached;
            const savedId = saved?.url === uploaded.url || saved?.publicId === uploaded.publicId ? ecommerceProductImageId(saved) : '';
            update(row.key, { ...(savedId ? { imageId: savedId } : {}), attached: true, status: 'attached', error: '' });
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          update(row.key, { ...(uploaded || {}), status: uploaded ? 'uploaded' : 'failed', error: ecommerceProductError(error) });
        }
      }
    } finally {
      if (!controller.signal.aborted) { operation.current = null; setBusy(false); onBusyChange?.(false); }
    }
  }
  const buttonStyle = { fontSize: 12, textTransform: 'none', height: 36 };
  return <section className="space-y-4 border-t border-rose-100 pt-5">
    <div><h2 className="font-semibold text-stone-900">Product images</h2><p className="mt-1 text-xs text-stone-500">{productId ? 'Choose an image, then upload it to this product.' : 'Choose and upload images before creating the draft.'}</p></div>
    <div className="flex flex-wrap items-center gap-4">
      {images.map((row) => <div key={row.key} className="flex max-w-full flex-wrap items-center gap-2" title={row.filename || row.altText}>
        <div className="relative shrink-0 overflow-visible">
          {(row.url || row.preview) ? <Image src={row.previewFallback && row.preview ? row.preview : row.url || row.preview} alt={row.altText || row.filename || 'Product image'} width={72} height={72} unoptimized className="h-[72px] w-[72px] rounded border border-stone-200 object-cover" onError={() => { if (row.preview && !row.previewFallback) update(row.key, { previewFallback: true }); }} /> : <span className="grid h-[72px] w-[72px] place-items-center rounded border border-dashed border-stone-300 text-[10px] text-stone-400">Image</span>}
          <IconButton type="button" aria-label={`Remove image ${row.filename || row.altText || 'product image'}`} title={row.attached && !onRemoveSavedImage ? 'Removing saved images is not available yet' : 'Remove image'} disabled={disabled || busy || row.removalUncertain || (row.attached && !onRemoveSavedImage)} onClick={() => removeImage(row)} sx={{ position: 'absolute', zIndex: 2, top: -5, right: -5, width: row.url || row.attached ? 20 : 16, height: row.url || row.attached ? 20 : 16, p: 0, borderRadius: '50%', color: '#fff', bgcolor: row.url || row.attached ? '#dc2626' : '#292524', cursor: 'pointer', boxShadow: '0 1px 4px #0002', border: '1px solid #fff', '&.Mui-disabled': { bgcolor: row.url || row.attached ? '#dc2626' : '#292524', color: '#fff', opacity: .65 }, '&:hover': { bgcolor: row.url || row.attached ? '#b91c1c' : '#0c0a09' } }}>{row.url || row.attached ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg> : <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m2 2 8 8M10 2l-8 8" /></svg>}</IconButton>
        </div>
        <TextField required size="small" label="Order" type="number" value={row.sortOrder} sx={{ width: 76, '& .MuiInputBase-root': { height: 36, fontSize: 12 } }} slotProps={{ htmlInput: { min: 0, step: 1, 'aria-label': `Image order for ${row.filename || row.altText}` } }} disabled={disabled || busy || row.attached} onChange={(event) => update(row.key, { sortOrder: event.target.value })} />
        <span role="status" className="text-[10px] font-medium text-stone-500">{row.attached ? 'Saved' : row.status === 'uploading' ? 'Uploading...' : row.status === 'attaching' ? 'Saving...' : row.url ? 'Uploaded' : 'Ready to upload'}</span>
        {row.error && <p role="alert" className="w-full max-w-xs text-xs text-red-700">{row.error}</p>}
      </div>)}
      <Button component="label" variant="outlined" disabled={disabled || busy} sx={{ ...buttonStyle, color: '#b61f4b', borderColor: '#e5b7c6' }}>Choose image<input hidden type="file" accept="image/*" disabled={disabled || busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; select(file); }} /></Button>
      <Button type="button" variant="contained" disabled={disabled || busy || !pending.length} aria-busy={busy} onClick={upload} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined} sx={{ ...buttonStyle, bgcolor: '#b61f4b' }}>{busy ? 'Uploading...' : 'Upload image'}</Button>
    </div>
  </section>;
}
