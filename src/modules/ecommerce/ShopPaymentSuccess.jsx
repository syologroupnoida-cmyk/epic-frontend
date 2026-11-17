import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchShopOrder, shopOrderTotal } from '@/util/shopAccount.mjs';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import { isShopOrderPaid } from '@/util/shopPayment.mjs';
import ShopAccountPage from './components/ShopAccountPage';
import styles from './ShopPaymentSuccess.module.css';

export default function ShopPaymentSuccess({ orderId }) {
  return <ShopAccountPage title="Payment confirmation" path={`/shop/orders/${encodeURIComponent(orderId)}/success`}>{(account) => <PaymentSuccessContent key={`${account.session}:${orderId}`} orderId={orderId} />}</ShopAccountPage>;
}

export function PaymentSuccessContent({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopOrder(MainApi, orderId, controller.signal).then((updated) => { if (!controller.signal.aborted) setOrder(updated); }).catch((err) => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, revision]);
  function retry() { setLoading(true); setError(''); setRevision(value => value + 1); }
  if (loading) return <section className={styles.card} role="status">Checking your payment confirmation...</section>;
  return <PaymentSuccessCard order={order} orderId={orderId} error={error} onRetry={retry} />;
}

export function PaymentSuccessCard({ order, orderId, error, onRetry }) {
  const paid = isShopOrderPaid(order);
  return <section className={styles.card} aria-label="Payment confirmation">
    {paid ? <>
      <div className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12 4 4 8-8" /></svg></div>
      <p className={styles.eyebrow}>Payment successful</p>
      <h2>Congratulations!</h2>
      <p className={styles.description}>Your payment has been received. Thank you for shopping with Epic.</p>
      <dl className={styles.summary}><div><dt>Order</dt><dd>{order.orderNumber || orderId}</dd></div><div><dt>Amount paid</dt><dd>{shopMoney(shopOrderTotal(order))}</dd></div></dl>
    </> : <>
      <h2>{error ? 'Confirmation could not be loaded' : 'Checking your payment'}</h2>
      {error ? <Alert severity="error" sx={{ my: 2 }}>{error}</Alert> : <p className={styles.description}>Your order has not confirmed a successful payment yet. Check its status before paying again.</p>}
      <Button onClick={onRetry} sx={{ my: 2, color: '#b61f4b', textTransform: 'none' }}>Refresh payment status</Button>
    </>}
    <Link href={`/shop/orders/${encodeURIComponent(orderId)}`} className={styles.orderButton}>My Order <span aria-hidden="true">&rarr;</span></Link>
  </section>;
}
