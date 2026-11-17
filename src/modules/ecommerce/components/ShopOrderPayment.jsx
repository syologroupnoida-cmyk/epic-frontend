import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Alert, Button, CircularProgress } from '@mui/material';
import MainApi from '@/util/MainApi';
import useAuthUser from '@/util/useAuthUser';
import { shopOrderId } from '@/util/shopAccount.mjs';
import { shopError } from '@/util/shopCatalog.mjs';
import { canPayShopOrder, createShopOrderPayment, isShopOrderPaid, loadRazorpayCheckout, openRazorpayCheckout, shopOrderPaymentUnavailableReason, shopRazorpayDetails, verifyShopPayment } from '@/util/shopPayment.mjs';
import ShopPaymentOptions from './ShopPaymentOptions';

export default function ShopOrderPayment({ order, onRefresh, onBusyChange }) {
  const router = useRouter();
  const user = useAuthUser();
  const [method, setMethod] = useState('');
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const request = useRef(null);
  const verifiedPayment = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  const address = order.address || order.shippingAddress || order.addressSnapshot;

  async function refreshStatus() {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setBusy('refresh'); onBusyChange?.(true);
    try {
      const updated = await onRefresh(controller.signal);
      if (!controller.signal.aborted && verifiedPayment.current && isShopOrderPaid(updated)) await router.push(`/shop/orders/${encodeURIComponent(shopOrderId(order))}/success`);
    }
    catch (error) { if (!controller.signal.aborted) setFeedback({ error: true, text: shopError(error) }); }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(''); onBusyChange?.(false); } }
  }

  async function pay() {
    if (request.current || locked || method !== 'RAZORPAY' || !canPayShopOrder(order)) return;
    const controller = new AbortController(); request.current = controller;
    setBusy('loading'); setFeedback(null); onBusyChange?.(true);
    let creating = false;
    let callbackReceived = false;
    try {
      await loadRazorpayCheckout();
      if (controller.signal.aborted) return;
      // Recheck status and reservation before creating a payment attempt.
      const current = await onRefresh(controller.signal);
      if (!canPayShopOrder(current)) throw new Error('This order is no longer awaiting payment. Review its latest status.');
      creating = true;
      const data = await createShopOrderPayment(MainApi, shopOrderId(current), controller.signal);
      creating = false;
      if (controller.signal.aborted) return;
      const payment = shopRazorpayDetails(data, process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '');
      setBusy('payment');
      const result = await openRazorpayCheckout({ ...payment.options, name: 'Epic', description: `Order ${current.orderNumber || shopOrderId(current)}`, prefill: { name: address?.fullName || '', email: user?.email || '', contact: address?.phone || '' }, theme: { color: '#b61f4b' } }, controller.signal);
      callbackReceived = true;
      setLocked(true); setBusy('verify');
      await verifyShopPayment(MainApi, payment.paymentId, result, controller.signal);
      if (controller.signal.aborted) return;
      verifiedPayment.current = true;
      setFeedback({ error: false, text: 'Payment verification submitted. Your latest payment status is shown in this order.' });
      const updated = await onRefresh(controller.signal);
      if (!controller.signal.aborted && isShopOrderPaid(updated)) await router.push(`/shop/orders/${encodeURIComponent(shopOrderId(current))}/success`);
    } catch (error) {
      if (!controller.signal.aborted) {
        // A callback or ambiguous creation must never automatically start another charge.
        setLocked(callbackReceived || Boolean(error.paymentUncertain) || (creating && (!error.response || error.response.status >= 500 || error.response.status === 408)));
        setFeedback({ error: true, text: callbackReceived ? `Payment confirmation could not be completed. Check your order status before paying again. ${shopError(error)}` : shopError(error) });
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(''); onBusyChange?.(false); } }
  }

  const payable = canPayShopOrder(order);
  const unavailableReason = shopOrderPaymentUnavailableReason(order);
  return <section aria-label="Order payment" className="mt-6 border-t border-rose-100 pt-4">
    <h2>Payment</h2>
    {feedback && <Alert severity={feedback.error ? 'error' : 'info'} sx={{ mb: 2 }}>{feedback.text}</Alert>}
    <ShopPaymentOptions value={method} onChange={setMethod} disabled={!payable || Boolean(busy) || locked} />
    {!payable && <Alert severity="info" sx={{ mb: 2 }}>{unavailableReason}</Alert>}
    {payable && <>
      <Button fullWidth variant="contained" disabled={Boolean(busy) || locked || method !== 'RAZORPAY'} onClick={pay} startIcon={busy && busy !== 'refresh' ? <CircularProgress size={15} color="inherit" /> : undefined} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>
        {busy === 'verify' ? 'Verifying payment...' : busy === 'payment' ? 'Complete payment in Razorpay...' : busy === 'loading' ? 'Preparing payment...' : 'Proceed to payment'}
      </Button>
      {locked && <p className="mt-2 text-xs text-stone-600">Check the latest payment status before starting another payment.</p>}
    </>}
    <Button disabled={Boolean(busy)} onClick={refreshStatus} sx={{ mt: 1, textTransform: 'none', color: '#b61f4b' }}>{busy === 'refresh' ? 'Refreshing...' : 'Refresh payment status'}</Button>
  </section>;
}
