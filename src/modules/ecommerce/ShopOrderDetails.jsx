import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchShopOrder, shopOrderId, shopOrderTotal } from '@/util/shopAccount.mjs';
import { canPayShopOrder, isShopOrderPaid } from '@/util/shopPayment.mjs';
import { fetchShopProduct, ShopApi, shopError, shopMoney } from '@/util/shopCatalog.mjs';
import { shopOrderItemImages, shopOrderItemProduct } from '@/util/shopOrderImages.mjs';
import ShopAccountPage from './components/ShopAccountPage';
import ShopOrderActions from './components/ShopOrderActions';
import ShopOrderPayment from './components/ShopOrderPayment';
import ShopIcon from './components/ShopIcon';
import { orderDate } from './ShopOrders';
import styles from './ShopOrderDetails.module.css';

function OrderItemThumbnail({ item }) {
  const { products, slug } = shopOrderItemProduct(item);
  const product = products[0] || {};
  const [catalog, setCatalog] = useState(null);
  const [failedImages, setFailedImages] = useState([]);
  const image = [...shopOrderItemImages(item), ...(catalog?.slug === slug ? shopOrderItemImages({ product: catalog.product }) : [])].find(url => !failedImages.includes(url));
  useEffect(() => {
    if (image || !slug) return;
    const controller = new AbortController();
    fetchShopProduct(ShopApi, slug, { signal: controller.signal }).then(product => {
      if (!controller.signal.aborted) setCatalog({ slug, product });
    }).catch(() => {});
    return () => controller.abort();
  }, [slug, image]);
  const title = item.productTitle || item.title || product.title || 'Product';
  return image ? <Image src={image} alt={title} width={144} height={148} unoptimized className={styles.itemImage} onError={() => setFailedImages(previous => [...previous, image])} /> : <span className={styles.itemImage} role="img" aria-label={`No image available for ${title}`}><ShopIcon name="box" size={32} /></span>;
}

export default function ShopOrderDetails({ orderId }) {
  return <ShopAccountPage title="Order details" orderLayout path={`/shop/orders/${encodeURIComponent(orderId)}`}>{(account) => <OrderDetailsContent key={`${account.session}:${orderId}`} orderId={orderId} compact />}</ShopAccountPage>;
}
export function OrderDetailsContent({ orderId, backHref = '/shop/orders', compact = false }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [paymentBusy, setPaymentBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopOrder(MainApi, orderId, controller.signal).then((data) => { if (!controller.signal.aborted) setOrder(data); }).catch((err) => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, retry]);
  function reload() { setLoading(true); setError(''); setRetry(value => value + 1); }
  async function refreshPaymentOrder(signal) {
    const updated = await fetchShopOrder(MainApi, orderId, signal);
    if (!signal?.aborted) setOrder(updated);
    return updated;
  }
  return <div className={compact ? styles.compact : undefined}><Link href={backHref} className={styles.backLink}><span aria-hidden="true">←</span> Back to My orders</Link><h1 className={styles.pageTitle}>Order details</h1>{loading ? <section className={styles.state} role="status">Loading order details...</section> : error ? <Alert severity="error" sx={{ mt: 2 }}>{error}<Button onClick={reload}>Try again</Button></Alert> : order && <><ShopOrderContent order={order} onRefresh={refreshPaymentOrder} onPaymentBusy={setPaymentBusy} compact={compact} />{!paymentBusy && <details className={styles.orderActions}><summary>Order actions</summary><ShopOrderActions order={order} onChanged={reload} /></details>}</>}</div>;
}
function itemAmount(item) {
  const variant = item.variant || item.productVariant || {};
  const unit = item.unitSaleAmountPaise ?? item.unitPriceAmountPaise ?? item.saleAmountPaise ?? variant.saleAmountPaise;
  const amount = item.totalAmountPaise ?? (unit != null && item.quantity != null ? Number(unit) * Number(item.quantity) : null);
  return amount != null && Number.isSafeInteger(Number(amount)) && Number(amount) >= 0 ? Number(amount) : null;
}

export function ShopOrderContent({ order, onRefresh, onPaymentBusy, compact = false }) {
  const items = Array.isArray(order.items) ? order.items : Array.isArray(order.orderItems) ? order.orderItems : [];
  const address = order.address || order.shippingAddress || order.addressSnapshot;
  const total = shopOrderTotal(order);
  const amounts = items.map(itemAmount);
  const subtotal = order.subtotalAmountPaise ?? order.itemsSubtotalAmountPaise ?? (items.length && amounts.every(value => value != null) ? amounts.reduce((sum, value) => sum + value, 0) : null);
  const difference = total != null && subtotal != null ? Number(total) - Number(subtotal) : null;
  const awaiting = canPayShopOrder(order);
  const paid = isShopOrderPaid(order);
  const status = awaiting ? 'Awaiting payment' : String(order.status || 'Unavailable').toLowerCase().replaceAll('_', ' ');
  return <div className={compact ? styles.compact : undefined}>
    <div className={styles.orderMeta}><span>Order <strong>{order.orderNumber || shopOrderId(order)}</strong></span><span className={styles.separator} aria-hidden="true">|</span><span>{orderDate(order.createdAt)}</span><span className={styles.separator} aria-hidden="true">|</span><span className={`${styles.status} ${paid ? styles.paid : ''}`}>{status}</span></div>
    <div className={styles.layout}>
      <div className={styles.leftColumn}>
        <section className={styles.card}><h2 className={styles.sectionTitle}>Order items</h2>
          {!items.length ? <p className={styles.hint}>Item details are unavailable.</p> : <ul className={styles.items}>{items.map((item, index) => {
            const variant = item.variant || item.productVariant || {};
            const product = item.product || variant.product || item.productSnapshot || {};
            const options = item.optionValues || variant.optionValues || {};
            return <li key={item.id || index}><OrderItemThumbnail item={item} /><div className={styles.itemInfo}><h3>{item.productTitle || item.title || product.title || 'Product'}</h3>{Object.entries(options).map(([name, value]) => <p key={name}>{name}: {String(value)}</p>)}{(item.sku || item.variantSku || variant.sku) && <p>SKU: {item.sku || item.variantSku || variant.sku}</p>}<p>Quantity: {item.quantity ?? 'Unavailable'}</p></div><strong className={styles.itemPrice}>{shopMoney(itemAmount(item))}</strong></li>;
          })}</ul>}
        </section>
        <section className={styles.card}><h2 className={styles.sectionTitle}>Delivery address</h2>{address ? <div className={styles.address}><strong>{address.fullName}</strong><p>{address.line1}</p><p>{address.city}, {address.state} {address.pincode}</p>{address.phone && <p>{address.phone}</p>}</div> : <p className={styles.hint}>Delivery address details are unavailable.</p>}</section>
      </div>
      <aside className={`${styles.card} ${styles.paymentCard}`} aria-label="Payment summary"><h2>Payment</h2><div className={styles.amountDue}><span>{paid ? 'Amount paid' : 'Amount due'}</span><strong>{shopMoney(total)}</strong></div><dl className={styles.breakdown}><div><dt>Items</dt><dd>{shopMoney(subtotal)}</dd></div>{difference != null && difference !== 0 && <div><dt>{difference < 0 ? 'Discounts' : 'Other charges'}</dt><dd>{difference < 0 ? '−' : ''}{shopMoney(Math.abs(difference))}</dd></div>}</dl>{onRefresh && <ShopOrderPayment key={shopOrderId(order)} order={order} onRefresh={onRefresh} onBusyChange={onPaymentBusy} />}</aside>
    </div>
  </div>;
}
