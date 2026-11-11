import { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, TablePagination, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceCategoryId } from '@/util/ecommerceCategories.mjs';
import { ecommerceSubcategoryError, ecommerceSubcategoryId, fetchEcommerceSubcategories, filterEcommerceSubcategories } from '@/util/ecommerceSubcategories.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import useEcommerceCategoryOptions from '../categories/useEcommerceCategoryOptions';
import ShopTableSearch from '../ShopTableSearch';
import ShopTableHeader from '../ShopTableHeader';
import ShopTableState from '../ShopTableState';

function SpecificationFields({ template }) {
  const fields = Array.isArray(template?.fields) ? template.fields.filter((field) => field && typeof field === 'object') : [];
  if (!fields.length) return <span className="text-xs text-slate-400">No specification fields</span>;
  return <details className="text-xs"><summary className="cursor-pointer font-medium text-[#b61f4b]">{fields.length} {fields.length === 1 ? 'field' : 'fields'}</summary><ul className="mt-2 space-y-2">{fields.map((field, index) => <li key={field.key || index}><p className="font-medium text-slate-700">{field.label || field.key || 'Unnamed field'} <span className="font-normal text-slate-500">{field.type === 'BOOLEAN' ? 'Yes / No' : field.type === 'SELECT' ? 'Select' : field.type}{field.required ? ' · Required' : ''}</span></p>{field.type === 'SELECT' && Array.isArray(field.options) && <p className="mt-1 text-slate-500">{field.options.filter((option) => typeof option === 'string').join(', ')}</p>}</li>)}</ul></details>;
}

export default function EcommerceSubcategoryList() {
  const categories = useEcommerceCategoryOptions();
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = JSON.stringify({ categoryId, attempt });
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceSubcategories(MainApi, { categoryId, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult({ key, ...data }); }).catch((failure) => { if (!controller.signal.aborted) setResult({ key, items: [], error: ecommerceSubcategoryError(failure) }); });
    return () => controller.abort();
  }, [categoryId, key]);
  const current = result?.key === key ? result : null;
  const filtered = filterEcommerceSubcategories(current?.items || [], search, categories.items);
  const visiblePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / limit) - 1));
  const rows = filtered.slice(visiblePage * limit, (visiblePage + 1) * limit);
  function parentName(row) { const id = row.categoryId || row.category?.ecommerceCategoryId || row.category?.id; return row.category?.name || categories.items.find((category) => ecommerceCategoryId(category) === id)?.name || 'Category not provided'; }
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title="Subcategory List"><TextField select size="small" label="Category" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(0); }} disabled={categories.loading || Boolean(categories.error)} sx={{ width: { xs: '100%', sm: 210 }, '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& .MuiInputLabel-root': { fontSize: 12 } }}><MenuItem value="">All categories</MenuItem>{categories.items.map((category) => <MenuItem key={ecommerceCategoryId(category)} value={ecommerceCategoryId(category)}>{category.name}</MenuItem>)}</TextField><ShopTableSearch value={search} onChange={(value) => { setSearch(value); setPage(0); }} label="Search subcategories" placeholder="Search subcategories" /></ShopTableHeader>
    {categories.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" onClick={categories.retry}>Retry</Button>}>{categories.error}</Alert>}
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[700px] text-left text-sm" aria-label="Shop subcategories"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['No.', 'Subcategory name', 'Parent category', 'Specifications'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{!current ? <tr><td colSpan={4} role="status" className="px-4 py-12 text-center text-slate-500">Loading subcategories...</td></tr> : !rows.length ? <tr><td colSpan={4} className="px-4 py-12 text-center"><ShopTableState title={current.error ? 'Subcategories could not be loaded.' : search.trim() ? 'No subcategories match your search.' : categoryId ? 'No subcategories found in this category.' : 'No subcategories found.'} error={current.error} onRetry={current.error ? () => setAttempt((value) => value + 1) : undefined} /></td></tr> : rows.map((row, index) => <tr key={ecommerceSubcategoryId(row) || index} className="hover:bg-slate-50"><td className="px-4 py-3 text-xs text-slate-500">{visiblePage * limit + index + 1}</td><td className="px-4 py-3 font-medium">{row.name || 'Unnamed subcategory'}</td><td className="px-4 py-3">{parentName(row)}</td><td className="max-w-sm px-4 py-3"><SpecificationFields template={row.specificationTemplate} /></td></tr>)}</tbody></table></div>
    <TablePagination component="div" count={filtered.length} page={visiblePage} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || visiblePage === 0 }, nextButton: { disabled: !current || (visiblePage + 1) * limit >= filtered.length } } }} sx={agentListPaginationSx} />
  </section>;
}
