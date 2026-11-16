import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchShopOrder, shopOrderId, shopOrderTotal } from '@/util/shopAccount.mjs';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import ShopAccountPage from './components/ShopAccountPage';
import ShopOrderActions from './components/ShopOrderActions';
import { orderDate } from './ShopOrders';
import styles from './ShopCheckout.module.css';

export default function ShopOrderDetails({ orderId }) {
  return <ShopAccountPage title="Order details" path={`/shop/orders/${encodeURIComponent(orderId)}`}>{(account) => <OrderDetailsContent key={`${account.session}:${orderId}`} orderId={orderId} />}</ShopAccountPage>;
}
export function OrderDetailsContent({ orderId, backHref = '/shop/orders' }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopOrder(MainApi, orderId, controller.signal).then((data) => { if (!controller.signal.aborted) setOrder(data); }).catch((err) => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, retry]);
  function reload() { setLoading(true); setError(''); setRetry(value => value + 1); }
  return <><p className={styles.hint}><Link href={backHref}>Back to My orders</Link></p>{loading ? <section className={styles.state} role="status">Loading order details...</section> : error ? <Alert severity="error" sx={{ mt: 2 }}>{error}<Button onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }}>Try again</Button></Alert> : order && <><div className="mt-4"><ShopOrderActions order={order} onChanged={reload} /></div><ShopOrderContent order={order} /></>}</>;
}
export function ShopOrderContent({ order }) {
  const items = Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];
  const address = order.address || order.shippingAddress || order.addressSnapshot;
  return <div className={styles.layout} style={{ marginTop: 20 }}><section className={styles.card}><h2>Order {order.orderNumber || shopOrderId(order)}</h2><dl className={styles.metadata}><div><dt>Order date</dt><dd>{orderDate(order.createdAt)}</dd></div><div><dt>Status</dt><dd><span className={styles.status}>{String(order.status || 'Unavailable').replaceAll('_', ' ')}</span></dd></div>{order.paymentStatus && <div><dt>Payment status</dt><dd>{String(order.paymentStatus).replaceAll('_', ' ')}</dd></div>}{order.reservationExpiresAt && <div><dt>Reservation expires</dt><dd>{new Date(order.reservationExpiresAt).toLocaleString('en-IN')}</dd></div>}</dl><h2>Items</h2>{!items.length ? <p className={styles.hint}>Item details are unavailable.</p> : <ul className={styles.items}>{items.map((item, index) => { const variant = item.variant || {}; const product = item.product || variant.product || {}; const unit = item.unitSaleAmountPaise ?? item.unitPriceAmountPaise ?? item.saleAmountPaise ?? variant.saleAmountPaise; const amount = item.totalAmountPaise ?? (unit != null && item.quantity != null ? Number(unit) * Number(item.quantity) : null); return <li key={item.id || index}><div className={styles.itemInfo}><strong>{item.productTitle || item.title || product.title || 'Product'}</strong><p>{item.sku || item.variantSku || variant.sku}</p><p>Quantity: {item.quantity ?? 'Unavailable'}</p></div><strong>{shopMoney(amount)}</strong></li>; })}</ul>}</section><aside className={styles.card}><h2>Order total</h2><div className={styles.totals}><div><span>Total</span><strong>{shopMoney(shopOrderTotal(order))}</strong></div></div>{address && <><h2>Delivery address</h2><div className={styles.hint}><strong>{address.fullName}</strong><p>{address.line1}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</p></div></>}<p className={styles.hint}>Payment and delivery status are shown as provided by your order.</p></aside></div>;
}
