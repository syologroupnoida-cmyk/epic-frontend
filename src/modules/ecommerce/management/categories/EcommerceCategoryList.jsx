import { useEffect, useState } from 'react';
import { TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceCategoryError, ecommerceCategoryId, fetchEcommerceCategories } from '@/util/ecommerceCategories.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import EcommerceCategoryDetails from './EcommerceCategoryDetails';
import EcommerceCategoryActions from './EcommerceCategoryActions';
import ShopTableSearch from '../ShopTableSearch';
import ShopTableHeader from '../ShopTableHeader';
import ShopTableState from '../ShopTableState';

export default function EcommerceCategoryList() {
  const [query, setQuery] = useState({ page: 0, limit: 20 });
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [detailId, setDetailId] = useState('');
  const [search, setSearch] = useState('');
  const key = JSON.stringify({ ...query, attempt });
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceCategories(MainApi, { page: query.page + 1, limit: query.limit, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult({ key, ...data }); }).catch((failure) => { if (!controller.signal.aborted) setResult({ key, items: [], total: -1, hasNext: false, error: ecommerceCategoryError(failure) }); });
    return () => controller.abort();
  }, [key, query]);
  const current = result?.key === key ? result : null;
  const rows = (current?.items || []).filter((row) => `${row.name || ''} ${row.description || ''} ${row.sortOrder ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title="Category List"><ShopTableSearch value={search} onChange={setSearch} /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[700px] text-left text-sm" aria-label="Shop categories"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['No.', 'Category name', 'Description', 'Sort order', 'Actions'].map((label) => <th key={label} className="px-4 py-3 text-xs font-semibold">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200">{!current ? <tr><td colSpan={5} role="status" className="px-4 py-12 text-center text-slate-500">Loading categories...</td></tr> : !rows.length ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500"><ShopTableState title={current.error ? 'Categories could not be loaded.' : search.trim() ? 'No categories match your search.' : 'No categories found. Add your first category to get started.'} error={current.error} onRetry={current.error ? () => setAttempt((value) => value + 1) : undefined} /></td></tr> : rows.map((row, index) => { const id = ecommerceCategoryId(row); return <tr key={id || index} className="hover:bg-slate-50"><td className="px-4 py-3 text-xs text-slate-500">{query.page * query.limit + index + 1}</td><td className="px-4 py-3 font-medium">{row.name || 'Unnamed category'}</td><td className="max-w-80 px-4 py-3"><p className="line-clamp-2 whitespace-pre-wrap" title={row.description}>{row.description || 'No description provided.'}</p></td><td className="px-4 py-3">{row.sortOrder ?? 'Not provided'}</td><td className="px-4 py-3"><EcommerceCategoryActions name={row.name} disabled={!id} onView={() => setDetailId(id)} /></td></tr>; })}</tbody>
      </table>
    </div>
    <TablePagination component="div" count={current?.total ?? -1} page={query.page} rowsPerPage={query.limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, page) => setQuery((previous) => ({ ...previous, page }))} onRowsPerPageChange={(event) => setQuery({ page: 0, limit: Number(event.target.value) })} slotProps={{ ...agentListPaginationSlotProps, actions: { previousButton: { disabled: !current || query.page === 0 }, nextButton: { disabled: !current || !current.hasNext } } }} sx={agentListPaginationSx} />
    {detailId && <EcommerceCategoryDetails key={detailId} id={detailId} onClose={() => setDetailId('')} />}
  </section>;
}
