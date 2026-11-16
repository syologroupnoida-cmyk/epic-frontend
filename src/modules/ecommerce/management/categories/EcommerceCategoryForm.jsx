import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import MainApi from '@/util/MainApi';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import { createEcommerceCategory, updateEcommerceCategory, ecommerceCategoryId, ecommerceCategoryError, validateEcommerceCategory } from '@/util/ecommerceCategories.mjs';
import styles from './EcommerceCategoryForm.module.css';

const emptyForm = { name: '', description: '', sortOrder: '1' };

export default function EcommerceCategoryForm({ category, onSaved, onCancel }) {
  const initial = category ? { name: category.name || '', description: category.description || '', sortOrder: String(category.sortOrder ?? 0) } : emptyForm;
  const [form, setForm] = useState(initial);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }
  async function submit(event) {
    event.preventDefault();
    if (request.current || needsRefresh) return;
    const nextErrors = validateEcommerceCategory(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const controller = new AbortController(); request.current = controller;
    setSaving(true);
    try {
      const result = category ? await updateEcommerceCategory(MainApi, ecommerceCategoryId(category), form, controller.signal) : await createEcommerceCategory(MainApi, form, controller.signal);
      if (!controller.signal.aborted) { if (!category) setForm(emptyForm); setFeedback({ status: 'success', title: category ? 'Category updated' : 'Category created', text: result.message }); }
    } catch (error) {
      if (!controller.signal.aborted) { const uncertain = Boolean(category) && (!error.response || error.response.status >= 500); setNeedsRefresh(uncertain); setFeedback({ status: 'error', title: category ? 'Unable to update category' : 'Unable to create category', text: uncertain ? 'Update could not be confirmed. Refresh the category list before trying again.' : ecommerceCategoryError(error) }); }
    } finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); } }
  }
  return <section className="rounded border border-rose-100 bg-white text-stone-900 shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 px-4 py-4"><h1 className="font-serif text-xl font-bold text-stone-950">{category ? "Edit Category" : "Add Category"}</h1>{onCancel ? <button type="button" disabled={saving || needsRefresh} onClick={onCancel} className="text-xs text-[#b61f4b]">Category List</button> : <Link href="/categories" className="text-xs font-semibold text-[#b61f4b] hover:underline">View category list &rarr;</Link>}</header>
    <form onSubmit={submit} noValidate aria-busy={saving} className={`${styles.compact} p-4`}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="mui-field"><input name="name" value={form.name} onChange={change} placeholder=" " required disabled={saving || needsRefresh} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'shop-category-name-error' : undefined} /><span>Category name *</span>{errors.name && <small id="shop-category-name-error" role="alert">{errors.name}</small>}</label>
        <label className="mui-field"><input name="sortOrder" type="number" min="0" step="1" value={form.sortOrder} onChange={change} placeholder=" " required disabled={saving || needsRefresh} aria-invalid={Boolean(errors.sortOrder)} aria-describedby={errors.sortOrder ? 'shop-category-order-error' : undefined} /><span>Sort order *</span>{errors.sortOrder && <small id="shop-category-order-error" role="alert">{errors.sortOrder}</small>}</label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs font-medium text-stone-600">Description</span><textarea className="w-full resize-y rounded border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#b61f4b]" name="description" rows={3} value={form.description} onChange={change} placeholder=" " disabled={saving || needsRefresh} aria-invalid={Boolean(errors.description)} />{errors.description && <small role="alert">{errors.description}</small>}</label>
      </div>
      <div className="mt-4 flex justify-end gap-3 border-t border-rose-100 pt-4"><button type="button" disabled={saving || needsRefresh} onClick={() => { setForm(initial); setErrors({}); }} className="rounded border border-rose-200 px-5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-rose-50 disabled:opacity-50">Reset</button><button type="submit" disabled={saving || needsRefresh} className="rounded bg-[#b61f4b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#981a3f] disabled:opacity-50">{saving ? 'Saving...' : category ? 'Save category' : 'Create category'}</button></div>
    </form>
    <ApiStatusModal status={feedback?.status} title={feedback?.title} text={feedback?.text} onOk={() => { const refresh = category && (feedback?.status === 'success' || needsRefresh); setFeedback(null); if (refresh) onSaved?.(); }} />
  </section>;
}
