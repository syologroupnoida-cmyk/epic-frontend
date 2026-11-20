import Link from 'next/link';
import { useRouter } from 'next/router';
import { productTableSummary } from '@/util/productPresentation.mjs';
import { useEffect, useState } from 'react';
import { MenuItem, Select, TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceProductError, ecommerceProductId, fetchEcommerceProducts, archiveEcommerceProduct } from '@/util/ecommerceProducts.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import ShopTableHeader from './ShopTableHeader';
import ShopTableSearch from './ShopTableSearch';
import ShopTableState from './ShopTableState';
import EcommerceProductDetail from './products/EcommerceProductDetail';
import styles from './products/ProductPresentation.module.css';
import CatalogMutationDialog from './CatalogMutationDialog';
import ProductActions from './products/ProductActions';
import { primaryClass } from './products/ProductControls';

export default function ShopProductList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [archiving, setArchiving] = useState(null);
  const [view, setView] = useState({ name: 'list' });
  useEffect(() => {
    if (view.name !== 'list') return;
    const controller = new AbortController();
    fetchEcommerceProducts(MainApi, { page: page + 1, limit, status, signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult(data);
    }).catch((err) => { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, status, revision, view.name]);
  function reload() { setError(''); setLoading(true); setRevision((value) => value + 1); }
  function back() { setLoading(true); setError(''); setView({ name: 'list' }); }
  if (view.name === 'detail') return <EcommerceProductDetail key={view.id} id={view.id} onBack={back} />;
  const rows = result.items.filter((product) => `${product.title || ''} ${product.brandName || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title="Product List"><Link className={primaryClass} href="/add-product">Add Product</Link><Select size="small" displayEmpty value={status} inputProps={{ 'aria-label': 'Product status' }} MenuProps={{ disableScrollLock: true }} sx={{ minWidth: 140, height: 32, fontSize: 12 }} onChange={(event) => { setStatus(event.target.value); setPage(0); setLoading(true); setError(''); }}><MenuItem value="DRAFT">Draft</MenuItem><MenuItem value="PUBLISHED">Published</MenuItem><MenuItem value="ARCHIVED">Archived</MenuItem><MenuItem value="">All statuses</MenuItem></Select><ShopTableSearch value={search} onChange={setSearch} label="Search products on this page" placeholder="Search this page..." /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto"><table className={`${styles.table} ${styles.list}`} aria-label="Shop products"><colgroup><col /><col style={{ width: '16%' }} /><col style={{ width: 120 }} /><col style={{ width: 80 }} /><col style={{ width: 90 }} /><col style={{ width: 110 }} /><col style={{ width: 130 }} /><col style={{ width: 75 }} /></colgroup><thead className="sticky top-0 z-10"><tr>{['Product', 'Brand', 'Price', 'Variants', 'Stock', 'Status', 'Created date', 'Actions'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{loading || error ? <tr><td colSpan={8}><ShopTableState title={loading ? 'Loading products...' : 'Products could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : reload} /></td></tr> : rows.length ? rows.map((product) => { const summary = productTableSummary(product); return <tr key={ecommerceProductId(product)}><td className={styles.productTitle}>{product.title}</td><td className="text-stone-500">{product.brandName || '?'}</td><td className="whitespace-nowrap font-medium">{summary.price}</td><td>{summary.variantCount}</td><td>{summary.stock}</td><td><span className={`${styles.badge} ${product.status === 'PUBLISHED' ? styles.published : ''}`}>{product.status || '?'}</span></td><td className="whitespace-nowrap text-stone-500">{summary.created}</td><td><ProductActions title={product.title} onView={() => setView({ name: 'detail', id: ecommerceProductId(product) })} onEdit={() => router.push(`/edit-product/${encodeURIComponent(ecommerceProductId(product))}`)} onArchive={product.status === "ARCHIVED" ? undefined : () => setArchiving(product)} /></td></tr>; }) : <tr><td colSpan={8} className="text-center"><ShopTableState title={search ? 'No products match your search on this page.' : 'No products found.'} /></td></tr>}</tbody></table></div>
    {archiving && <CatalogMutationDialog title="Archive product" text={`Archive ${archiving.title}?`} successText="Product archived successfully." execute={signal => archiveEcommerceProduct(MainApi, ecommerceProductId(archiving), signal)} onClose={() => setArchiving(null)} onDone={() => { setArchiving(null); setPage(0); reload(); }} />}
    <TablePagination component="div" count={result.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => { setLoading(true); setError(''); setPage(next); }} onRowsPerPageChange={(event) => { setLimit(Number(event.target.value)); setPage(0); setLoading(true); setError(''); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || Boolean(error) || !result.hasNext }, previousButton: { disabled: loading || page === 0 } } }} sx={agentListPaginationSx} />
  </section>;
}
