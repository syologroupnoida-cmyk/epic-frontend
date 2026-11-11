import Image from 'next/image';
import { useState } from 'react';
import { TablePagination } from '@mui/material';
import { products, categories, formatPrice } from '../data/catalog.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import ShopTableHeader from './ShopTableHeader';
import ShopTableSearch from './ShopTableSearch';
import ShopTableState from './ShopTableState';

export default function ShopProductList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const filtered = products.filter((product) => `${product.name} ${categories.find((category) => category.id === product.category)?.name || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const rows = filtered.slice(page * limit, (page + 1) * limit);
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title="Products"><span className="mr-auto text-xs text-slate-500">Sample catalog</span><ShopTableSearch value={search} onChange={(value) => { setSearch(value); setPage(0); }} label="Search shop products" placeholder="Search products..." /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[700px] text-left text-sm" aria-label="Shop products"><thead className="sticky top-0 z-10 bg-slate-100 text-slate-900"><tr>{['No.', 'Product', 'Category', 'Price', 'Availability'].map((label) => <th className="px-4 py-3 text-xs font-semibold" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{rows.length ? rows.map((product, index) => <tr key={product.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-xs text-slate-500">{page * limit + index + 1}</td><td className="px-4 py-3"><div className="flex items-center gap-3"><Image src={product.image} alt="" width={44} height={40} className="rounded object-cover" /><span className="font-medium">{product.name}</span></div></td><td className="px-4 py-3">{categories.find((category) => category.id === product.category)?.name}</td><td className="px-4 py-3">{formatPrice(product.price)}</td><td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-1 text-xs ${product.stock === 'in-stock' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{product.stock === 'in-stock' ? 'In Stock' : 'Pre-Order'}</span></td></tr>) : <tr><td colSpan={5} className="px-4 py-12 text-center"><ShopTableState title="No products match your search." /></td></tr>}</tbody></table></div>
    <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} slotProps={agentListPaginationSlotProps} sx={agentListPaginationSx} />
  </section>;
}
