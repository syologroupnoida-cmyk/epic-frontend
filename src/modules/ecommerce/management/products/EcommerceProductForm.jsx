import { useEffect, useRef, useState } from 'react';
import { FormControlLabel, MenuItem, Radio, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchAllEcommerceCategories, ecommerceCategoryId } from '@/util/ecommerceCategories.mjs';
import { fetchEcommerceSubcategories, ecommerceSubcategoryId } from '@/util/ecommerceSubcategories.mjs';
import { createEcommerceProduct, ecommerceProductError, ecommerceProductId, ecommerceProductImagePayload, ecommerceProductPayload, removeEcommerceProductImage } from '@/util/ecommerceProducts.mjs';
import { buttonClass, primaryClass, productSelectSlotProps } from './ProductControls';
import ProductImageUpload from './ProductImageUpload';
import LiveProductVariantForm from './LiveProductVariantForm';
import ProductColorPicker from './ProductColorPicker';
import ProductVariantOption from './ProductVariantOption';
import ProductRemoveButton from './ProductRemoveButton';
import ProductVariantImageInput from './ProductVariantImageInput';
import { isColorOption, isSizeOption, productEditorImages } from '@/util/productPresentation.mjs';

const blankVariant = () => ({ sku: '', optionValues: {}, imageUrl: '', mrpAmountPaise: '', saleAmountPaise: '', initialStock: '0', isDefault: false });
export default function EcommerceProductForm({ onCreated }) {
  const [form, setForm] = useState({ categoryId: '', subcategoryId: '', title: '', description: '', brandName: '', gstPercentage: '5', specifications: {}, optionDefinitions: [], images: [], variants: [{ ...blankVariant(), isDefault: true }] });
  const [images, setImages] = useState([]);
  const [imageBusy, setImageBusy] = useState(false);
  const [variantBusy, setVariantBusy] = useState(false);
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
  function addOption(name) {
    if (form.optionDefinitions.some((option) => name === 'Color' ? isColorOption(option.name) : isSizeOption(option.name))) return;
    update('optionDefinitions', [...form.optionDefinitions, { name, values: [''] }]);
  }
  function updateOptionValues(index, values) {
    update('optionDefinitions', form.optionDefinitions.map((option, i) => i === index ? { ...option, values } : option));
  }
  function removeOption(index) {
    update('optionDefinitions', form.optionDefinitions.filter((_, i) => i !== index));
    update('variants', form.variants.map((variant) => ({ ...variant, optionValues: {} })));
  }
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    setError('');
    if (createdProduct || imageBusy) return;
    let payload;
    try {
      for (const field of fields) if (field.required && (form.specifications[field.key] === undefined || form.specifications[field.key] === '')) throw new Error(`Choose ${field.label}.`);
      for (const image of images) {
        if (!image.url || !image.publicId) throw new Error('Upload or remove failed images before creating the product.');
      }
      payload = ecommerceProductPayload({ ...form, images: images.map(ecommerceProductImagePayload) });
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
      const savedImages = productEditorImages(saved);
      setImages(current => current.map(image => ({ ...image, ...savedImages.find(row => row.publicId === image.publicId || row.url === image.url), key: image.key, attached: true, status: 'attached', error: '' })));
    } catch (err) { if (!controller.signal.aborted) setError(`${productSaved ? 'Product created. ' : ''}${ecommerceProductError(err)}`); }
    finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); } }
  }
  if (createdProduct) return <section className="space-y-5 rounded border border-rose-100 bg-white p-5 text-stone-900 shadow-sm">
    <header><h1 className="font-serif text-xl font-bold">Add Product</h1><p className="mt-1 text-sm text-emerald-700" role="status">Draft created: {createdProduct.title}</p><p className="mt-1 text-xs text-stone-500">Add images and more variants to this product, then return to the list.</p></header>
    {error && (!ecommerceProductId(createdProduct) || images.some((image) => !image.attached)) && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {ecommerceProductId(createdProduct) && <><ProductImageUpload productId={ecommerceProductId(createdProduct)} images={images} onImagesChange={setImages} disabled={saving || variantBusy} onBusyChange={setImageBusy} onRemoveSavedImage={(image, signal) => removeEcommerceProductImage(MainApi, ecommerceProductId(createdProduct), image, signal)} /><LiveProductVariantForm product={createdProduct} onAdded={(variant) => setCreatedProduct((current) => ({ ...current, variants: [...(current.variants || []), variant] }))} disabled={saving || imageBusy} onBusyChange={setVariantBusy} /></>}
    <div className="flex justify-end border-t border-rose-100 pt-4"><button type="button" className={primaryClass} disabled={saving || imageBusy || variantBusy} onClick={() => onCreated(createdProduct)}>Products List</button></div>
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
        <ProductImageUpload images={images} onImagesChange={setImages} disabled={saving} onBusyChange={setImageBusy} />
        {fields.length > 0 && <div><h2 className="mb-3 font-semibold">Specifications</h2><div className="grid gap-4 md:grid-cols-3">{fields.map((field) => field.type === 'TEXT' ? <TextField fullWidth size="small" disabled={saving || imageBusy} key={field.key} name={`specifications.${field.key}`} label={field.label} required={field.required} value={form.specifications[field.key] ?? ''} onChange={(event) => update('specifications', { ...form.specifications, [field.key]: event.target.value })} /> : <TextField select slotProps={productSelectSlotProps} fullWidth size="small" disabled={saving || imageBusy} key={field.key} name={`specifications.${field.key}`} label={field.label} required={field.required} value={form.specifications[field.key] === undefined ? '' : String(form.specifications[field.key])} onChange={(event) => update('specifications', { ...form.specifications, [field.key]: event.target.value === '' ? '' : field.type === 'BOOLEAN' ? event.target.value === 'true' : event.target.value })}><MenuItem value="">Choose {field.label}</MenuItem>{(field.type === 'BOOLEAN' ? ['true', 'false'] : field.options || []).map((option) => <MenuItem key={option} value={option}>{field.type === 'BOOLEAN' ? option === 'true' ? 'Yes' : 'No' : option}</MenuItem>)}</TextField>)}</div></div>}
        <div className="space-y-4 border-t border-rose-100 pt-4"><h2 className="font-semibold">Product options</h2><p className="text-xs text-stone-500">Set up multiple colors and sizes, then choose a value for each variant.</p>
          <div className="grid gap-4 md:grid-cols-2">{[
            { name: 'Colors', optionIndex: form.optionDefinitions.findIndex((option) => isColorOption(option.name)) },
            { name: 'Sizes', optionIndex: form.optionDefinitions.findIndex((option) => isSizeOption(option.name)) },
          ].map(({ name, optionIndex }) => <section key={name} className="space-y-3 rounded border border-stone-200 p-3"><h3 className="text-sm font-semibold">{name}</h3>{optionIndex < 0 ? <button type="button" className={buttonClass} disabled={saving || imageBusy} onClick={() => addOption(name === 'Colors' ? 'Color' : 'Size')}>Add {name.toLowerCase()}</button> : <div className="flex items-start gap-2">{name === 'Colors' ? <div className="min-w-0 flex-1"><ProductColorPicker multiple hexValues label="Available colors" values={form.optionDefinitions[optionIndex].values} disabled={saving || imageBusy} onChange={(values) => updateOptionValues(optionIndex, values)} /></div> : <TextField fullWidth size="small" disabled={saving || imageBusy} label="Available sizes (comma separated)" value={form.optionDefinitions[optionIndex].values.join(',')} onChange={(event) => updateOptionValues(optionIndex, event.target.value.split(','))} placeholder="XS, S, M, L, XL" />}<ProductRemoveButton label={`Remove ${name.toLowerCase()}`} disabled={saving || imageBusy} onClick={() => removeOption(optionIndex)} /></div>}</section>)}</div>
          {form.optionDefinitions.some((option) => !isColorOption(option.name) && !isSizeOption(option.name)) && <div className="space-y-3"><h3 className="text-sm font-semibold">Other options</h3>{form.optionDefinitions.map((option, index) => ({ option, index })).filter(({ option }) => !isColorOption(option.name) && !isSizeOption(option.name)).map(({ option, index }) => <div key={index} className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px]"><TextField fullWidth size="small" disabled={saving || imageBusy} label="Option name" value={option.name} onChange={(event) => { update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, name: event.target.value } : item)); update('variants', form.variants.map((variant) => ({ ...variant, optionValues: {} }))); }} />{!option.name.trim() ? <ProductColorPicker multiple hexValues label="Values (comma separated)" values={option.values} disabled={saving || imageBusy} onChange={(values) => update('optionDefinitions', form.optionDefinitions.map((item, i) => i === index ? { ...item, name: 'Color', values } : item))} /> : <TextField fullWidth size="small" disabled={saving || imageBusy} label="Values (comma separated)" value={option.values.join(',')} onChange={(event) => updateOptionValues(index, event.target.value.split(','))} placeholder="Red, Maroon" />}<ProductRemoveButton label={`Remove option ${index + 1}`} disabled={saving || imageBusy} onClick={() => removeOption(index)} /></div>)}</div>}
          <button type="button" className={buttonClass} disabled={saving || imageBusy} onClick={() => update('optionDefinitions', [...form.optionDefinitions, { name: '', values: [''] }])}>Add option</button>
        </div>
        <div className="space-y-4 border-t border-rose-100 pt-4"><h2 className="font-semibold">Variants</h2><p className="text-xs text-stone-500">Enter prices in paise: ₹1 = 100 paise.</p>
          {form.variants.map((variant, index) => <fieldset key={index} className="min-w-0 rounded border border-stone-200 p-4"><legend className="px-1 text-sm font-semibold">Variant {index + 1}</legend><div className="grid gap-3 md:grid-cols-3">
            <TextField required fullWidth size="small" disabled={saving || imageBusy} label="SKU" value={variant.sku} onChange={(event) => variantChange(index, 'sku', event.target.value)} />
            <ProductVariantImageInput value={variant.imageUrl} images={images} label={`Variant ${index + 1} image`} disabled={saving || imageBusy} onChange={url => variantChange(index, 'imageUrl', url)} onBusyChange={setImageBusy} />
            {form.optionDefinitions.filter((option) => option.name.trim()).map((option, optionIndex) => <ProductVariantOption key={optionIndex} option={option} disabled={saving || imageBusy} value={variant.optionValues[option.name.trim()] || ''} onChange={(value) => variantChange(index, 'optionValues', { ...variant.optionValues, [option.name.trim()]: value })} />)}
            {[['mrpAmountPaise', 'MRP (paise)'], ['saleAmountPaise', 'Sale price (paise)'], ['initialStock', 'Initial stock']].map(([key, label]) => <TextField required fullWidth size="small" disabled={saving || imageBusy} key={key} label={label} type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} value={variant[key]} onChange={(event) => variantChange(index, key, event.target.value)} />)}
          </div><div className="mt-3 flex items-center justify-between"><FormControlLabel sx={{ m: 0, '& .MuiTypography-root': { fontSize: 12 } }} control={<Radio size="small" name="defaultVariant" disabled={saving || imageBusy} checked={variant.isDefault} onChange={() => update('variants', form.variants.map((item, i) => ({ ...item, isDefault: i === index })))} />} label="Default variant" /><button type="button" className={buttonClass} disabled={form.variants.length === 1} onClick={() => { const remaining = form.variants.filter((_, i) => i !== index); if (variant.isDefault) remaining[0] = { ...remaining[0], isDefault: true }; update('variants', remaining); }}>Remove variant</button></div></fieldset>)}
          <button type="button" className={buttonClass} onClick={() => update('variants', [...form.variants, blankVariant()])}>Add variant</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end border-t border-rose-100 pt-4"><button className={primaryClass} type="submit" disabled={imageBusy || loading || subLoading || Boolean(loadError) || Boolean(subError)}>{saving ? 'Creating...' : 'Create draft product'}</button></div>
      </fieldset>
    </form>
  </section>;
}
