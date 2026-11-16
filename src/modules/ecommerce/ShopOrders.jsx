import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchShopOrders, shopOrderId, shopOrderTotal } from '@/util/shopAccount.mjs';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';
import ShopAccountPage from './components/ShopAccountPage';
import ShopOrderActions from './components/ShopOrderActions';
import ShopTableHeader from './management/ShopTableHeader';
import ShopTableSearch from './management/ShopTableSearch';
import ShopTableState from './management/ShopTableState';
import styles from './management/products/ProductPresentation.module.css';

export const orderDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unavailable';
export default function ShopOrders() {
  return <ShopAccountPage title="My orders" path="/shop/orders">{(account) => <OrderList key={account.session} />}</ShopAccountPage>;
}
export function OrderList({ detailsBase = '/shop/orders', dashboard = false }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopOrders(MainApi, { page: page + 1, limit, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult(data); }).catch((err) => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, retry]);
  function reload() { setLoading(true); setError(''); setRetry(value => value + 1); }
  const rows = result.items.filter(order => `${order.orderNumber || ''} ${order.reference || ''} ${shopOrderId(order)} ${order.status || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section className={`${dashboard ? 'h-full' : 'h-[min(680px,80dvh)]'} flex min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm`}>
    <ShopTableHeader title="My Orders"><Link href="/shop" className="mr-auto text-xs font-medium text-[#b61f4b]">Continue shopping</Link><ShopTableSearch value={search} onChange={setSearch} label="Search orders on this page" placeholder="Search this page..." /></ShopTableHeader>
    <div className="min-h-0 flex-1 overflow-auto"><table className={styles.table} style={{ minWidth: 850 }} aria-label="My shop orders"><colgroup><col style={{ width: '26%' }} /><col style={{ width: 130 }} /><col style={{ width: 155 }} /><col style={{ width: 135 }} /><col style={{ width: 70 }} /><col style={{ width: 120 }} /><col style={{ width: 80 }} /></colgroup><thead className="sticky top-0 z-10"><tr>{['Order', 'Created date', 'Status', 'Payment status', 'Items', 'Total', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{loading || error ? <tr><td colSpan={7}><ShopTableState title={loading ? 'Loading your orders...' : 'Orders could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : reload} /></td></tr> : rows.length ? rows.map(order => <tr key={shopOrderId(order)}><td className={styles.productTitle}>{order.orderNumber || order.reference || shopOrderId(order)}</td><td>{orderDate(order.createdAt)}</td><td><span className={`${styles.badge} ${order.status === 'DELIVERED' ? styles.published : ''}`}>{String(order.status || 'Unavailable').replaceAll('_', ' ')}</span></td><td>{String(order.paymentStatus || 'Unavailable').replaceAll('_', ' ')}</td><td>{order.itemCount ?? order._count?.items ?? (Array.isArray(order.items) ? order.items.length : Array.isArray(order.orderItems) ? order.orderItems.length : 'Unavailable')}</td><td className="whitespace-nowrap font-medium">{shopMoney(shopOrderTotal(order))}</td><td><ShopOrderActions order={order} onView={() => router.push(`${detailsBase}/${encodeURIComponent(shopOrderId(order))}`)} onChanged={reload} /></td></tr>) : <tr><td colSpan={7}><ShopTableState title={search ? 'No orders match your search on this page.' : 'No orders yet. Your orders will appear here after checkout.'} /></td></tr>}</tbody></table></div>
    <TablePagination component="div" count={result.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => { setLoading(true); setError(''); setPage(next); }} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(0); setLoading(true); setError(''); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || Boolean(error) || !result.hasNext }, previousButton: { disabled: loading || page === 0 } } }} sx={agentListPaginationSx} />
  </section>;
}
