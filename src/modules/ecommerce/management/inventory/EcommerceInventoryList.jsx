import { useEffect, useState } from 'react';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import MainApi from '@/util/MainApi';
import { ecommerceProductError } from '@/util/ecommerceProducts.mjs';
import { fetchEcommerceInventory, inventoryAvailable, inventoryDate, inventoryNumber, inventoryOptions, inventoryProductTitle, inventoryReserved, inventorySku, inventoryThreshold, inventoryVariantId } from '@/util/ecommerceInventory.mjs';
import ShopTableHeader from '../ShopTableHeader';
import ShopTableSearch from '../ShopTableSearch';
import ShopTableState from '../ShopTableState';
import InventoryActions from './InventoryActions';
import InventoryThresholdDialog from './InventoryThresholdDialog';
import InventoryPagination from './InventoryPagination';
import EcommerceInventoryMovements from './EcommerceInventoryMovements';
import styles from '../products/ProductPresentation.module.css';

export default function EcommerceInventoryList({ lowStockOnly = false }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [history, setHistory] = useState(null);
  const [thresholdVariant, setThresholdVariant] = useState(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceInventory(MainApi, { page: page + 1, limit, lowStockOnly, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult(data); }).catch((err) => { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, lowStockOnly, revision]);
  function change(nextPage, nextLimit = limit) { setLoading(true); setError(''); setPage(nextPage); setLimit(nextLimit); }
  if (history) return <EcommerceInventoryMovements key={inventoryVariantId(history)} variant={history} onBack={() => setHistory(null)} />;
  const rows = result.items.filter((row) => `${inventoryProductTitle(row)} ${inventorySku(row)} ${inventoryOptions(row)}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <ShopTableHeader title={lowStockOnly ? 'Low-stock Variants' : 'Inventory List'}><ShopTableSearch value={search} onChange={setSearch} label="Search inventory on this page" placeholder="Search product or SKU..." /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto"><table className={`${styles.table} ${styles.list}`} aria-label={lowStockOnly ? 'Low-stock inventory' : 'Shop inventory'}><colgroup><col /><col style={{ width: '17%' }} /><col style={{ width: '17%' }} /><col style={{ width: 110 }} /><col style={{ width: 110 }} /><col style={{ width: 110 }} /><col style={{ width: 165 }} /><col style={{ width: 75 }} /></colgroup><thead className="sticky top-0 z-10"><tr>{['Product', 'SKU', 'Options', 'Available stock', 'Reserved stock', 'Low-stock threshold', 'Last updated', 'Actions'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {loading || error ? <tr><td colSpan={8}><ShopTableState title={loading ? 'Loading inventory...' : 'Inventory could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : () => { setLoading(true); setError(''); setRevision((value) => value + 1); }} /></td></tr> : !rows.length ? <tr><td colSpan={8}><ShopTableState title={search ? 'No inventory matches your search on this page.' : lowStockOnly ? 'No low-stock variants found.' : 'No inventory found.'} /></td></tr> : rows.map((row, index) => <tr key={inventoryVariantId(row) || row.id || index}><td className={styles.productTitle}>{inventoryProductTitle(row)}</td><td className={styles.sku}>{inventorySku(row)}</td><td className="text-stone-500">{inventoryOptions(row)}</td><td className="font-medium">{inventoryNumber(inventoryAvailable(row))}</td><td>{inventoryNumber(inventoryReserved(row))}</td><td>{inventoryNumber(inventoryThreshold(row))}</td><td className="text-stone-500">{inventoryDate(row.updatedAt || row.inventory?.updatedAt)}</td><td><InventoryActions sku={inventorySku(row)} disabled={!inventoryVariantId(row)} onHistory={() => setHistory(row)} onThreshold={() => { setNotice(''); setThresholdVariant(row); }} /></td></tr>)}
    </tbody></table></div>
    <InventoryPagination result={result} page={page} limit={limit} loading={loading} error={error} onPage={(next) => change(next)} onLimit={(next) => change(0, next)} />
    {thresholdVariant && <InventoryThresholdDialog key={inventoryVariantId(thresholdVariant)} variant={thresholdVariant} onClose={() => setThresholdVariant(null)} onSaved={() => { setThresholdVariant(null); setNotice('Low-stock threshold saved.'); setLoading(true); setError(''); if (lowStockOnly) setPage(0); setRevision((value) => value + 1); }} />}
    <ApiStatusModal status={notice ? 'success' : null} title="Threshold saved" text={notice} onOk={() => setNotice('')} />
  </section>;
}
