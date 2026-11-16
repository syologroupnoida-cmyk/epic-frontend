import { useEffect, useState } from 'react';
import MainApi from '@/util/MainApi';
import { ecommerceProductError } from '@/util/ecommerceProducts.mjs';
import { fetchEcommerceInventoryMovements, inventoryDate, inventoryNumber, inventorySku, inventoryVariantId } from '@/util/ecommerceInventory.mjs';
import ShopTableHeader from '../ShopTableHeader';
import ShopTableSearch from '../ShopTableSearch';
import ShopTableState from '../ShopTableState';
import { buttonClass } from '../products/ProductControls';
import InventoryPagination from './InventoryPagination';
import styles from '../products/ProductPresentation.module.css';

export default function EcommerceInventoryMovements({ variant, onBack }) {
  const variantId = inventoryVariantId(variant);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceInventoryMovements(MainApi, { variantId, page: page + 1, limit, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult(data); }).catch((err) => { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [variantId, page, limit, revision]);
  function change(nextPage, nextLimit = limit) { setLoading(true); setError(''); setPage(nextPage); setLimit(nextLimit); }
  const rows = result.items.filter((row) => `${row.type || row.movementType || ''} ${row.note || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title={`Movement History — ${inventorySku(variant)}`}><button type="button" className={buttonClass} onClick={onBack}>Back to inventory</button><ShopTableSearch value={search} onChange={setSearch} label="Search movements on this page" placeholder="Search type or note..." /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto"><table className={`${styles.table} ${styles.list}`} aria-label="Inventory movement history"><colgroup><col style={{ width: 175 }} /><col style={{ width: 170 }} /><col style={{ width: 90 }} /><col style={{ width: 115 }} /><col style={{ width: 115 }} /><col /><col style={{ width: 150 }} /></colgroup><thead className="sticky top-0 z-10"><tr>{['Date', 'Type', 'Quantity', 'Stock before', 'Stock after', 'Note', 'Recorded by'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {loading || error ? <tr><td colSpan={7}><ShopTableState title={loading ? 'Loading movement history...' : 'Movement history could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : () => { setLoading(true); setError(''); setRevision((value) => value + 1); }} /></td></tr> : !rows.length ? <tr><td colSpan={7}><ShopTableState title={search ? 'No movements match your search on this page.' : 'No inventory movements found for this variant.'} /></td></tr> : rows.map((row, index) => <tr key={row.id || row.ecommerceInventoryMovementId || index}><td>{inventoryDate(row.createdAt)}</td><td><span className={styles.badge}>{String(row.type || row.movementType || 'Unavailable').replaceAll('_', ' ')}</span></td><td className="font-medium">{typeof row.quantity === 'number' && Number.isSafeInteger(row.quantity) ? row.quantity.toLocaleString('en-IN') : '—'}</td><td>{inventoryNumber(row.stockBefore ?? row.quantityBefore ?? row.previousStock)}</td><td>{inventoryNumber(row.stockAfter ?? row.quantityAfter ?? row.newStock)}</td><td className="text-stone-500">{row.note || '—'}</td><td>{row.createdBy?.name || row.actor?.name || row.user?.name || '—'}</td></tr>)}
    </tbody></table></div>
    <InventoryPagination result={result} page={page} limit={limit} loading={loading} error={error} onPage={(next) => change(next)} onLimit={(next) => change(0, next)} />
  </section>;
}
