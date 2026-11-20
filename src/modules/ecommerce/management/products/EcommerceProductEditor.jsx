import { useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, MenuItem, TextField } from '@mui/material';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import MainApi from '@/util/MainApi';
import { fetchAllEcommerceCategories, ecommerceCategoryId } from '@/util/ecommerceCategories.mjs';
import { fetchEcommerceSubcategories, ecommerceSubcategoryId } from '@/util/ecommerceSubcategories.mjs';
import { ecommerceProductError, fetchEcommerceProduct, removeEcommerceProductImage, updateEcommerceProduct, ecommerceProductUpdatePayload } from '@/util/ecommerceProducts.mjs';
import { isColorOption, isSizeOption, productEditorImages, productEditorValues } from '@/util/productPresentation.mjs';
import ShopTableState from '../ShopTableState';
import ProductColorPicker from './ProductColorPicker';
import ProductImageUpload from './ProductImageUpload';
import LiveProductVariantForm from './LiveProductVariantForm';
import ProductVariantEditor from './ProductVariantEditor';
import { buttonClass, productSelectSlotProps } from './ProductControls';

export default function EcommerceProductEditor({ id, onBack }) {
  const request = useRef(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [subError, setSubError] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [variantBusy, setVariantBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([fetchEcommerceProduct(MainApi, id, controller.signal), fetchAllEcommerceCategories(MainApi, { signal: controller.signal })]).then(([details, options]) => {
      if (controller.signal.aborted) return;
      if (details.status === 'rejected') setError(ecommerceProductError(details.reason));
      else {
        const row = details.value;
        setProduct(row);
        setForm(productEditorValues(row));
        setImages(productEditorImages(row));
        setSubLoading(true);
      }
      if (options.status === 'fulfilled') { setCategories(options.value); setCategoryError(''); } else setCategoryError(ecommerceProductError(options.reason));
      setLoading(false);
    });
    return () => controller.abort();
  }, [id, retry]);
  const categoryId = form?.categoryId || '';
  useEffect(() => {
    if (!categoryId) return;
    const controller = new AbortController();
    fetchEcommerceSubcategories(MainApi, { categoryId, signal: controller.signal }).then(({ items }) => { if (!controller.signal.aborted) setSubcategories(items); }).catch((err) => { if (!controller.signal.aborted) setSubError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setSubLoading(false); });
    return () => controller.abort();
  }, [categoryId, retry]);
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  const busy = mediaBusy || variantBusy || saving || needsRefresh;
  async function saveProduct(event) {
    event.preventDefault();
    if (request.current || busy) return;
    let payload;
    try { payload = ecommerceProductUpdatePayload(form); } catch (err) { setFeedback({ status: 'error', title: 'Check product information', text: ecommerceProductError(err) }); return; }
    const controller = new AbortController(); request.current = controller; setSaving(true);
    let saved = false;
    try {
      await updateEcommerceProduct(MainApi, id, payload, controller.signal); saved = true;
      const updated = await fetchEcommerceProduct(MainApi, id, controller.signal);
      if (!controller.signal.aborted) { setProduct(updated); setForm(productEditorValues(updated)); setFeedback({ status: 'success', title: 'Product updated successfully.' }); }
    } catch (err) {
      if (!controller.signal.aborted) {
        const uncertain = saved || !err.response || err.response.status >= 500;
        setNeedsRefresh(uncertain);
        setFeedback({ status: 'error', title: saved ? 'Product saved. Refresh required.' : 'Unable to update product', text: uncertain ? 'Refresh product details before making another change. ' + ecommerceProductError(err) : ecommerceProductError(err) });
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); } }
  }
  const template = subcategories.find((row) => ecommerceSubcategoryId(row) === form?.subcategoryId)?.specificationTemplate?.fields || [];
  const specKeys = [...new Set([...template.map((field) => field.key), ...Object.keys(form?.specifications || {})])];
  return <section className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded border border-rose-100 bg-white p-5 text-stone-900 shadow-sm"><header className="flex items-center justify-between gap-3"><h1 className="text-lg font-bold">Edit Product</h1><button type="button" className={buttonClass} disabled={busy} onClick={onBack}>Products List</button></header>
    {loading ? <ShopTableState title="Loading product for editing..." /> : error ? <ShopTableState title="Product could not be loaded." error={error} onRetry={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }} /> : form && <>
      <form onSubmit={saveProduct}><fieldset disabled={busy} className="space-y-5"><div className="grid gap-4 md:grid-cols-3">
        <TextField select slotProps={productSelectSlotProps} fullWidth size="small" required disabled={busy} label="Category" value={form.categoryId} error={Boolean(categoryError)} helperText={categoryError} onChange={(event) => { setSubcategories([]); setSubError(''); setSubLoading(Boolean(event.target.value)); setForm((current) => ({ ...current, categoryId: event.target.value, subcategoryId: '', specifications: {} })); }}><MenuItem value="">Choose category</MenuItem>{!categories.some((row) => ecommerceCategoryId(row) === form.categoryId) && form.categoryId && <MenuItem value={form.categoryId}>{product.category?.name || 'Current category'}</MenuItem>}{categories.map((row) => <MenuItem key={ecommerceCategoryId(row)} value={ecommerceCategoryId(row)}>{row.name}</MenuItem>)}</TextField>
        <TextField select slotProps={productSelectSlotProps} fullWidth size="small" required label="Subcategory" value={form.subcategoryId} disabled={busy || subLoading} error={Boolean(subError)} helperText={subError || (subLoading ? 'Loading subcategories...' : '')} onChange={(event) => setForm((current) => ({ ...current, subcategoryId: event.target.value, specifications: {} }))}><MenuItem value="">Choose subcategory</MenuItem>{!subcategories.some((row) => ecommerceSubcategoryId(row) === form.subcategoryId) && form.subcategoryId && <MenuItem value={form.subcategoryId}>{product.subcategory?.name || 'Current subcategory'}</MenuItem>}{subcategories.map((row) => <MenuItem key={ecommerceSubcategoryId(row)} value={ecommerceSubcategoryId(row)}>{row.name}</MenuItem>)}</TextField>
        {[['title', 'Product title'], ['brandName', 'Brand name']].map(([key, label]) => <TextField fullWidth required size="small" key={key} label={label} value={form[key]} disabled={busy} onChange={(event) => update(key, event.target.value)} />)}
        <TextField fullWidth required size="small" label="GST (%)" type="number" slotProps={{ htmlInput: { min: 0, max: 100, step: .01 } }} value={form.gstPercentage} disabled={busy} onChange={(event) => update('gstPercentage', event.target.value)} />
        <TextField fullWidth required size="small" label="Description" multiline rows={3} value={form.description} disabled={busy} onChange={(event) => update('description', event.target.value)} />
      </div>
      {specKeys.length > 0 && <div><h2 className="mb-3 font-semibold">Specifications</h2><div className="grid gap-4 md:grid-cols-3">{specKeys.map((key) => { const field = template.find((item) => item.key === key); const value = form.specifications[key]; const boolean = field?.type === 'BOOLEAN' || typeof value === 'boolean'; return field?.type === 'SELECT' || boolean ? <TextField select slotProps={productSelectSlotProps} fullWidth size="small" key={key} label={field?.label || key} value={value == null ? '' : String(value)} disabled={busy} onChange={(event) => update('specifications', { ...form.specifications, [key]: boolean ? event.target.value === 'true' : event.target.value })}>{(boolean ? ['true', 'false'] : [...new Set([...(field?.options || []), ...(value ? [String(value)] : [])])]).map((option) => <MenuItem key={option} value={option}>{boolean ? option === 'true' ? 'Yes' : 'No' : option}</MenuItem>)}</TextField> : <TextField fullWidth size="small" key={key} label={field?.label || key} value={typeof value === 'object' ? JSON.stringify(value) : value ?? ''} disabled={busy} onChange={(event) => update('specifications', { ...form.specifications, [key]: event.target.value })} />; })}</div></div>}
      {form.optionDefinitions.length > 0 && <div className="space-y-4 border-t border-rose-100 pt-4"><h2 className="font-semibold">Product options</h2><div className="grid gap-4 md:grid-cols-2">
        {[{ name: 'Colors', match: isColorOption }, { name: 'Sizes', match: isSizeOption }].map(({ name, match }) => {
          const options = form.optionDefinitions.map((option, index) => ({ option, index })).filter(({ option }) => match(option.name));
          if (!options.length) return null;
          return <section key={name} className="space-y-3 rounded border border-stone-200 p-3"><h3 className="text-sm font-semibold">{name}</h3>{options.map(({ option, index }) => <div className="grid gap-4 md:grid-cols-3" key={index}>{name === 'Colors' ? <ProductColorPicker multiple label="Available colors" values={option.values} disabled={busy} onChange={(values) => update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, values } : item))} /> : <TextField size="small" label="Available sizes (comma separated)" value={option.values.join(',')} placeholder="XS, S, M, L, XL" disabled={busy} onChange={(event) => update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, values: event.target.value.split(',') } : item))} />}</div>)}</section>;
        })}
      </div>
        {form.optionDefinitions.some((option) => !isColorOption(option.name) && !isSizeOption(option.name)) && <section className="space-y-3 rounded border border-stone-200 p-3"><h3 className="text-sm font-semibold">Other options</h3>{form.optionDefinitions.map((option, index) => ({ option, index })).filter(({ option }) => !isColorOption(option.name) && !isSizeOption(option.name)).map(({ option, index }) => <div className="grid gap-4 md:grid-cols-3" key={index}><TextField size="small" label="Option name" value={option.name} disabled={busy} onChange={(event) => update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /><TextField size="small" label="Values (comma separated)" value={option.values.join(',')} disabled={busy} onChange={(event) => update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, values: event.target.value.split(',') } : item))} /></div>)}</section>}
      </div>}
</fieldset><div className="mt-5 flex justify-end"><Button type="submit" variant="contained" disabled={busy || subLoading || Boolean(subError) || Boolean(categoryError)} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}>{saving ? 'Saving...' : 'Save product'}</Button></div></form>
      <section className="space-y-3 border-t border-rose-100 pt-5"><h2 className="font-semibold">Edit variants</h2>{(product.variants || []).map((variant) => <ProductVariantEditor key={variant.ecommerceVariantId || variant.id || variant._id} variant={variant} disabled={busy} onBusyChange={setVariantBusy} onSaved={(updated) => setProduct((current) => ({ ...current, variants: current.variants.map((row) => row === variant ? { ...row, ...updated } : row) }))} />)}</section>
      <ProductImageUpload productId={id} images={images} onImagesChange={setImages} disabled={variantBusy || saving || needsRefresh} onBusyChange={setMediaBusy} onRemoveSavedImage={(image, signal) => removeEcommerceProductImage(MainApi, id, image, signal)} />
      <LiveProductVariantForm product={product} disabled={mediaBusy || saving || needsRefresh} onBusyChange={setVariantBusy} onAdded={(variant) => setProduct((current) => ({ ...current, variants: [...(current.variants || []), variant] }))} />
    </>}
    <ApiStatusModal status={feedback?.status} title={feedback?.title} text={feedback?.text} onOk={() => { setFeedback(null); if (needsRefresh) { setNeedsRefresh(false); setLoading(true); setError(''); setRetry(value => value + 1); } }} />
  </section>;
}
