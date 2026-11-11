import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, IconButton, MenuItem, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import { ecommerceCategoryId } from '@/util/ecommerceCategories.mjs';
import { createEcommerceSubcategory, ecommerceSubcategoryError, validateEcommerceSubcategory } from '@/util/ecommerceSubcategories.mjs';
import useEcommerceCategoryOptions from '../categories/useEcommerceCategoryOptions';
import styles from './EcommerceSubcategoryForm.module.css';

const emptyField = (id) => ({ id, key: '', label: '', type: 'SELECT', required: true, options: ['', ''] });

export default function EcommerceSubcategoryForm() {
  const categories = useEcommerceCategoryOptions();
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [fields, setFields] = useState([emptyField(1)]);
  const nextId = useRef(2);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  function updateField(id, key, value) { setFields((current) => current.map((field) => field.id === id ? { ...field, [key]: value } : field)); setErrors((current) => ({ ...current, specificationTemplate: '' })); }
  function reset() { setName(''); setFields([emptyField(nextId.current++)]); setErrors({}); }
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    const values = { categoryId, name, specificationTemplate: { fields: fields.map((field) => ({ key: field.key, label: field.label, type: field.type, required: field.required, ...(field.type === 'SELECT' ? { options: field.options.map((option) => option.trim()).filter(Boolean) } : {}) })) } };
    const validation = validateEcommerceSubcategory(values); setErrors(validation);
    if (Object.keys(validation).length) return;
    const controller = new AbortController(); request.current = controller; setSaving(true);
    try {
      const result = await createEcommerceSubcategory(MainApi, values, controller.signal);
      if (!controller.signal.aborted) { reset(); setFeedback({ status: 'success', title: 'Subcategory created', text: result.message }); }
    } catch (error) { if (!controller.signal.aborted) setFeedback({ status: 'error', title: 'Unable to create subcategory', text: ecommerceSubcategoryError(error) }); }
    finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); } }
  }
  return <section className={`${styles.compact} rounded border border-rose-100 bg-white text-stone-900 shadow-sm`}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 px-4 py-4"><h1 className="font-serif text-xl font-bold text-stone-950">Add Subcategory</h1><Link href="/subcategories" className="text-xs font-semibold text-[#b61f4b] hover:underline">View subcategory list &rarr;</Link></header>
    <form onSubmit={submit} noValidate aria-busy={saving} className="space-y-5 p-4">
      {categories.error && <Alert severity="error" action={<Button color="inherit" onClick={categories.retry}>Retry</Button>}>{categories.error}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField select size="small" fullWidth required name="categoryId" label="Parent category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setErrors((current) => ({ ...current, categoryId: '' })); }} disabled={saving || categories.loading || Boolean(categories.error)} error={Boolean(errors.categoryId)} helperText={errors.categoryId || (categories.loading ? 'Loading categories...' : !categories.items.length && !categories.error ? 'Create a category before adding subcategories.' : '')}><MenuItem value="">Select a category</MenuItem>{categories.items.map((category) => <MenuItem key={ecommerceCategoryId(category)} value={ecommerceCategoryId(category)}>{category.name}</MenuItem>)}</TextField>
        <TextField size="small" required fullWidth name="name" label="Subcategory name" value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: '' })); }} disabled={saving} error={Boolean(errors.name)} helperText={errors.name} placeholder="e.g. Bridal Lehenga" />
      </div>
      <fieldset disabled={saving} className="min-w-0 space-y-4 rounded border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-stone-800">Specification template</legend>
        <p className="text-xs leading-5 text-stone-500">Define the fields used for products in this subcategory. Select fields have dropdown options; Boolean fields are yes/no choices.</p>
        {errors.specificationTemplate && <Alert severity="error">{errors.specificationTemplate}</Alert>}
        {fields.map((field, index) => <div key={field.id} className="space-y-3 rounded border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-xs font-semibold text-stone-600">Field {index + 1}</p>
          <div className={styles.fieldGrid}>
            <TextField size="small" disabled={saving} required name={`specificationTemplate.fields[${index}].key`} label="Field key" value={field.key} onChange={(event) => updateField(field.id, 'key', event.target.value)} placeholder="e.g. fabric or blouseIncluded" slotProps={{ htmlInput: { 'aria-label': `Field ${index + 1} key` } }} />
            <TextField size="small" disabled={saving} required name={`specificationTemplate.fields[${index}].label`} label="Display label" value={field.label} onChange={(event) => updateField(field.id, 'label', event.target.value)} placeholder="e.g. Fabric or Blouse Included" slotProps={{ htmlInput: { 'aria-label': `Field ${index + 1} label` } }} />
            <TextField select size="small" disabled={saving} required name={`specificationTemplate.fields[${index}].type`} label="Field type" value={field.type} onChange={(event) => updateField(field.id, 'type', event.target.value)}><MenuItem value="SELECT">SELECT (dropdown)</MenuItem><MenuItem value="BOOLEAN">BOOLEAN (yes/no)</MenuItem></TextField>
            <FormControlLabel sx={{ m: 0, '& .MuiTypography-root': { fontSize: 12 } }} control={<Checkbox size="small" name={`specificationTemplate.fields[${index}].required`} disabled={saving} checked={field.required} onChange={(event) => updateField(field.id, 'required', event.target.checked)} slotProps={{ input: { 'aria-label': `Field ${index + 1} required` } }} />} label="Required" />
            <IconButton size="small" disabled={saving} aria-label={`Remove field ${index + 1}`} onClick={() => { setFields((current) => current.filter((item) => item.id !== field.id)); setErrors((current) => ({ ...current, specificationTemplate: '' })); }} sx={{ height: 36, color: '#b61f4b' }}>&times;</IconButton>
          </div>
          {field.type === 'SELECT' ? <fieldset className="min-w-0 space-y-3 rounded border border-slate-200 bg-white p-3">
            <legend className="px-1 text-xs font-semibold text-stone-600">Dropdown options</legend>
            <p className="text-xs text-stone-500">Add each choice separately, for example Silk and Velvet.</p>
            {field.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2">
              <TextField size="small" fullWidth disabled={saving} name={`specificationTemplate.fields[${index}].options[${optionIndex}]`} label={`Option ${optionIndex + 1}`} value={option} onChange={(event) => updateField(field.id, 'options', field.options.map((value, position) => position === optionIndex ? event.target.value : value))} slotProps={{ htmlInput: { 'aria-label': `Field ${index + 1} option ${optionIndex + 1}` } }} />
              <IconButton size="small" disabled={saving || field.options.length === 1} aria-label={`Remove option ${optionIndex + 1} from field ${index + 1}`} onClick={() => updateField(field.id, 'options', field.options.filter((_, position) => position !== optionIndex))} sx={{ color: '#b61f4b' }}>&times;</IconButton>
            </div>)}
            <Button type="button" size="small" disabled={saving} onClick={() => updateField(field.id, 'options', [...field.options, ''])} sx={{ textTransform: 'none', color: '#b61f4b' }}>+ Add option</Button>
          </fieldset> : <p className="text-xs leading-5 text-stone-500">This field offers Yes or No when adding a product. It does not need dropdown options. Required means the product must provide an answer; No is a valid answer.</p>}
        </div>)}
        <Button type="button" variant="outlined" size="small" disabled={saving} onClick={() => { setFields((current) => [...current, emptyField(nextId.current++)]); setErrors((current) => ({ ...current, specificationTemplate: '' })); }} sx={{ textTransform: 'none', borderColor: '#e9bccb', color: '#b61f4b' }}>+ Add specification field</Button>
      </fieldset>
      <div className="flex justify-end gap-3 border-t border-rose-100 pt-4"><button type="button" disabled={saving} onClick={() => { setCategoryId(''); reset(); }} className="rounded border border-rose-200 px-5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-rose-50 disabled:opacity-50">Reset</button><button type="submit" disabled={saving || categories.loading || Boolean(categories.error) || !categories.items.length} className="rounded bg-[#b61f4b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#981a3f] disabled:opacity-50">{saving ? 'Creating...' : 'Create subcategory'}</button></div>
    </form>
    <ApiStatusModal status={feedback?.status} title={feedback?.title} text={feedback?.text} onOk={() => setFeedback(null)} />
  </section>;
}
