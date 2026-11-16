import { useEffect, useState } from 'react';
import { TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceOrderCustomer, ecommerceOrderStage, fetchEcommerceOrders } from '@/util/ecommerceOrders.mjs';
import { shopOrderId, shopOrderTotal } from '@/util/shopAccount.mjs';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import { orderDate } from '../../ShopOrders';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import ShopTableHeader from '../ShopTableHeader';
import ShopTableSearch from '../ShopTableSearch';
import ShopTableState from '../ShopTableState';
import EcommerceOrderActions from './EcommerceOrderActions';
import EcommerceOrderDetail from './EcommerceOrderDetail';
import styles from '../products/ProductPresentation.module.css';
export default function EcommerceOrderList() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (selected) return;
    const controller = new AbortController();
    fetchEcommerceOrders(MainApi, { page: page + 1, limit, signal: controller.signal }).then(data => { if (!controller.signal.aborted) setResult(data); }).catch(err => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, revision, selected]);
  function reload() { setLoading(true); setError(''); setRevision(value => value + 1); }
  if (selected) return <EcommerceOrderDetail key={selected} id={selected} onBack={() => { setSelected(''); reload(); }} />;
  const rows = result.items.filter(order => `${order.orderNumber || ''} ${shopOrderId(order)} ${ecommerceOrderCustomer(order)} ${order.status || ''} ${ecommerceOrderStage(order)}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm"><ShopTableHeader title="All orders"><ShopTableSearch value={search} onChange={setSearch} label="Search orders on this page" placeholder="Search this page..." /></ShopTableHeader><div className="min-h-0 flex-1 overflow-auto"><table className={`${styles.table} ${styles.list}`} aria-label="Admin shop orders"><colgroup><col style={{ width: '23%' }} /><col /><col style={{ width: 130 }} /><col style={{ width: 155 }} /><col style={{ width: 130 }} /><col style={{ width: 120 }} /><col style={{ width: 75 }} /></colgroup><thead className="sticky top-0 z-10"><tr>{['Order', 'Customer', 'Created date', 'Fulfilment', 'Payment status', 'Total', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{loading || error ? <tr><td colSpan={7}><ShopTableState title={loading ? 'Loading orders...' : 'Orders could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : reload} /></td></tr> : rows.length ? rows.map(order => <tr key={shopOrderId(order)}><td className={styles.productTitle}>{order.orderNumber || order.reference || shopOrderId(order)}</td><td>{ecommerceOrderCustomer(order)}</td><td>{orderDate(order.createdAt)}</td><td><span className={`${styles.badge} ${ecommerceOrderStage(order) === 'DELIVERED' ? styles.published : ''}`}>{(ecommerceOrderStage(order) || 'Unavailable').replaceAll('_', ' ')}</span></td><td>{String(order.paymentStatus || 'Unavailable').replaceAll('_', ' ')}</td><td className="whitespace-nowrap font-medium">{shopMoney(shopOrderTotal(order))}</td><td><EcommerceOrderActions order={order} onView={() => setSelected(shopOrderId(order))} onChanged={reload} /></td></tr>) : <tr><td colSpan={7}><ShopTableState title={search ? 'No orders match your search on this page.' : 'No orders found.'} /></td></tr>}</tbody></table></div><TablePagination component="div" count={result.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => { setLoading(true); setError(''); setPage(next); }} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(0); setLoading(true); setError(''); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || Boolean(error) || !result.hasNext }, previousButton: { disabled: loading || page === 0 } } }} sx={agentListPaginationSx} /></section>;
}
