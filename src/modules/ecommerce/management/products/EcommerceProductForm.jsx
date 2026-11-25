import { useEffect, useRef, useState } from 'react';
import { FormControlLabel, MenuItem, Radio, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchAllEcommerceCategories, ecommerceCategoryId } from '@/util/ecommerceCategories.mjs';
import { fetchEcommerceSubcategories, ecommerceSubcategoryId } from '@/util/ecommerceSubcategories.mjs';
import { createEcommerceProduct, ecommerceProductError, ecommerceProductId, ecommerceProductPayload } from '@/util/ecommerceProducts.mjs';
import { buttonClass, primaryClass, productSelectSlotProps } from './ProductControls';
import ProductColorPicker from './ProductColorPicker';
import ProductVariantImageInput from './ProductVariantImageInput';

const blankVariant = () => ({ sku: '', optionValues: {}, imageUrl: '', mrpAmountPaise: '', saleAmountPaise: '', initialStock: '0', isDefault: false });
export default function EcommerceProductForm({ onCreated }) {
  const [form, setForm] = useState({ categoryId: '', subcategoryId: '', title: '', description: '', brandName: '', gstPercentage: '5', specifications: {}, optionDefinitions: [], images: [], variants: [{ ...blankVariant(), isDefault: true }] });
  const [imageBusy, setImageBusy] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [subError, setSubError] = useState('');
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchAllEcommerceCategories(MainApi, { signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setCategories(items); }).catch((err) => { if (!controller.signal.aborted) setLoadError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    if (!form.categoryId) return;
    const controller = new AbortController();
    fetchEcommerceSubcategories(MainApi, { categoryId: form.categoryId, signal: controller.signal }).then(({ items }) => {
      if (!controller.signal.aborted) setSubcategories(items.filter((row) => !row.categoryId || row.categoryId === form.categoryId));
    }).catch((err) => { if (!controller.signal.aborted) setSubError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setSubLoading(false); });
    return () => controller.abort();
  }, [form.categoryId, retry]);
  const fields = subcategories.find((row) => ecommerceSubcategoryId(row) === form.subcategoryId)?.specificationTemplate?.fields || [];
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function variantChange(index, key, value) { setForm((current) => ({ ...current, variants: current.variants.map((variant, i) => i === index ? { ...variant, [key]: value } : variant) })); }
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    setError('');
    if (createdProduct || imageBusy) return;
    let payload;
    try {
      for (const field of fields) if (field.required && (form.specifications[field.key] === undefined || form.specifications[field.key] === '')) throw new Error(`Choose ${field.label}.`);
      const names = ['Color', 'Size'].filter((name) => form.variants.some((variant) => variant.optionValues[name]?.trim()));
      const variants = form.variants.map((variant) => ({ ...variant, optionValues: Object.fromEntries(names.map((name) => [name, variant.optionValues[name]?.trim() || ''])) }));
      const optionDefinitions = names.map((name) => ({ name, values: [...new Set(variants.map((variant) => variant.optionValues[name]).filter(Boolean))] }));
      payload = ecommerceProductPayload({ ...form, optionDefinitions, variants, images: [] });
    } catch (err) { setError(ecommerceProductError(err)); return; }
    const controller = new AbortController(); request.current = controller; setSaving(true);
    let productSaved = false;
    try {
      const product = await createEcommerceProduct(MainApi, payload, controller.signal);
      if (controller.signal.aborted) return;
      productSaved = true;
      const saved = { ...payload, ...(product && typeof product === 'object' ? product : {}) };
      setCreatedProduct(saved);
      const id = ecommerceProductId(saved);
      if (!id) throw new Error('The server did not return a product ID. Open Products List to find the created draft.');
    } catch (err) { if (!controller.signal.aborted) setError(`${productSaved ? 'Product created. ' : ''}${ecommerceProductError(err)}`); }
    finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); } }
  }
  if (createdProduct) return <section className="space-y-5 rounded border border-rose-100 bg-white p-5 text-stone-900 shadow-sm">
    <header><h1 className="font-serif text-xl font-bold">Add Product</h1><p className="mt-1 text-sm text-emerald-700" role="status">Draft created: {createdProduct.title}</p></header>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-end border-t border-rose-100 pt-4"><button type="button" className={primaryClass} disabled={saving || imageBusy} onClick={() => onCreated(createdProduct)}>Products List</button></div>
  </section>;
  return <section className="rounded border border-rose-100 bg-white p-5 text-stone-900 shadow-sm">
    <header className="mb-5"><h1 className="font-serif text-xl font-bold">Add Product</h1></header>
    {loadError && <p role="alert" className="mb-4 text-sm text-red-700">{loadError} <button className={buttonClass} onClick={() => { setLoading(true); setLoadError(''); setRetry((value) => value + 1); }}>Retry categories</button></p>}
    {subError && <p role="alert" className="mb-4 text-sm text-red-700">{subError} <button className={buttonClass} onClick={() => { setSubLoading(true); setSubError(''); setRetry((value) => value + 1); }}>Retry subcategories</button></p>}
    <form onSubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving || imageBusy} className="min-w-0 space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField select slotProps={productSelectSlotProps} required fullWidth size="small" name="categoryId" label="Category" value={form.categoryId} disabled={saving || imageBusy || loading || Boolean(loadError)} helperText={loading ? 'Loading categories...' : undefined} onChange={(event) => { setSubcategories([]); setSubError(''); setSubLoading(Boolean(event.target.value)); setForm((current) => ({ ...current, categoryId: event.target.value, subcategoryId: '', specifications: {} })); }}><MenuItem value="">Choose category</MenuItem>{categories.map((row) => <MenuItem key={ecommerceCategoryId(row)} value={ecommerceCategoryId(row)}>{row.name}</MenuItem>)}</TextField>
          <TextField select slotProps={productSelectSlotProps} required fullWidth size="small" name="subcategoryId" label="Subcategory" disabled={saving || imageBusy || !form.categoryId || subLoading || Boolean(subError)} value={form.subcategoryId} helperText={subLoading ? 'Loading subcategories...' : form.categoryId && !subError && !subcategories.length ? 'Create a subcategory for this category first.' : undefined} onChange={(event) => setForm((current) => ({ ...current, subcategoryId: event.target.value, specifications: {} }))}><MenuItem value="">Choose subcategory</MenuItem>{subcategories.map((row) => <MenuItem key={ecommerceSubcategoryId(row)} value={ecommerceSubcategoryId(row)}>{row.name}</MenuItem>)}</TextField>
          <TextField required fullWidth size="small" disabled={saving || imageBusy} name="title" label="Product title" value={form.title} onChange={(event) => update('title', event.target.value)} />
          <TextField required fullWidth size="small" disabled={saving || imageBusy} name="brandName" label="Brand name" value={form.brandName} onChange={(event) => update('brandName', event.target.value)} />
          <TextField required fullWidth size="small" disabled={saving || imageBusy} name="gstPercentage" label="GST (%)" type="number" slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }} value={form.gstPercentage} onChange={(event) => update('gstPercentage', event.target.value)} />
          <TextField required fullWidth size="small" disabled={saving || imageBusy} name="description" label="Description" multiline rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} />
        </div>
        {fields.length > 0 && <div><h2 className="mb-3 font-semibold">Specifications</h2><div className="grid gap-4 md:grid-cols-3">{fields.map((field) => field.type === 'TEXT' ? <TextField fullWidth size="small" disabled={saving || imageBusy} key={field.key} name={`specifications.${field.key}`} label={field.label} required={field.required} value={form.specifications[field.key] ?? ''} onChange={(event) => update('specifications', { ...form.specifications, [field.key]: event.target.value })} /> : <TextField select slotProps={productSelectSlotProps} fullWidth size="small" disabled={saving || imageBusy} key={field.key} name={`specifications.${field.key}`} label={field.label} required={field.required} value={form.specifications[field.key] === undefined ? '' : String(form.specifications[field.key])} onChange={(event) => update('specifications', { ...form.specifications, [field.key]: event.target.value === '' ? '' : field.type === 'BOOLEAN' ? event.target.value === 'true' : event.target.value })}><MenuItem value="">Choose {field.label}</MenuItem>{(field.type === 'BOOLEAN' ? ['true', 'false'] : field.options || []).map((option) => <MenuItem key={option} value={option}>{field.type === 'BOOLEAN' ? option === 'true' ? 'Yes' : 'No' : option}</MenuItem>)}</TextField>)}</div></div>}
        <div className="space-y-4 border-t border-rose-100 pt-4"><h2 className="font-semibold">Add Option</h2><p className="text-xs text-stone-500">Add product image, size and color.</p>
          {form.variants.map((variant, index) => <fieldset key={index} className="relative min-w-0 rounded border border-stone-200 px-4 pb-4 pt-10"><legend className="px-1 text-sm font-semibold">Option {index + 1}</legend><button type="button" aria-label={`Remove option ${index + 1}`} title={`Remove option ${index + 1}`} className="absolute right-0 -top-3 grid h-8 w-8 place-items-center text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-30" disabled={saving || imageBusy || form.variants.length === 1} onClick={() => { const remaining = form.variants.filter((_, i) => i !== index); if (variant.isDefault) remaining[0] = { ...remaining[0], isDefault: true }; update('variants', remaining); }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6" /></svg></button><div className="grid gap-3 md:grid-cols-3">
            <ProductColorPicker label="Color" value={variant.optionValues.Color || ''} hexValues disabled={saving || imageBusy} onChange={(value) => variantChange(index, 'optionValues', { ...variant.optionValues, Color: value })} />
            <TextField fullWidth size="small" disabled={saving || imageBusy} label="Size" placeholder="e.g. S, M, L, XL" value={variant.optionValues.Size || ''} onChange={(event) => variantChange(index, 'optionValues', { ...variant.optionValues, Size: event.target.value })} />
            <ProductVariantImageInput value={variant.imageUrl} images={[]} label={`Option ${index + 1} image`} uploadOnly disabled={saving || imageBusy} onChange={url => variantChange(index, 'imageUrl', url)} onBusyChange={setImageBusy} />
          </div></fieldset>)}
          <button type="button" className={buttonClass} disabled={saving || imageBusy} onClick={() => update('variants', [...form.variants, blankVariant()])}>Add Option</button>
        </div>
        <div className="space-y-4 border-t border-rose-100 pt-4"><h2 className="font-semibold">Add Product Variant</h2><p className="text-xs text-stone-500">Enter SKU, prices and stock for each option. Prices are in paise: ₹1 = 100 paise.</p>
          {form.variants.map((variant, index) => <fieldset key={index} className="min-w-0 rounded border border-stone-200 p-4"><legend className="px-1 text-sm font-semibold">Variant {index + 1} (Option {index + 1})</legend><div className="grid gap-3 md:grid-cols-3">
            <TextField required fullWidth size="small" disabled={saving || imageBusy} label="SKU" value={variant.sku} onChange={(event) => variantChange(index, 'sku', event.target.value)} />
            {[['mrpAmountPaise', 'MRP (paise)'], ['saleAmountPaise', 'Sale price (paise)'], ['initialStock', 'Initial stock']].map(([key, label]) => <TextField required fullWidth size="small" disabled={saving || imageBusy} key={key} label={label} type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={variant[key]} onChange={(event) => variantChange(index, key, event.target.value)} />)}
          </div><div className="mt-3"><FormControlLabel sx={{ m: 0, '& .MuiTypography-root': { fontSize: 12 } }} control={<Radio size="small" name="defaultVariant" disabled={saving || imageBusy} checked={variant.isDefault} onChange={() => update('variants', form.variants.map((item, i) => ({ ...item, isDefault: i === index })))} />} label="Default variant" /></div></fieldset>)}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end border-t border-rose-100 pt-4"><button className={primaryClass} type="submit" disabled={imageBusy || loading || subLoading || Boolean(loadError) || Boolean(subError)}>{saving ? 'Creating...' : 'Create draft product'}</button></div>
      </fieldset>
    </form>
  </section>;
}
