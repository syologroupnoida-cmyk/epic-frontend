import { shopAccountData } from './shopAccount.mjs';

export const isShopOrderPaid = (order) => ['PAID', 'CAPTURED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(String(order?.paymentStatus || '').trim().toUpperCase());

export function shopOrderPaymentUnavailableReason(order) {
  const status = String(order?.status || '').trim().toUpperCase();
  const payment = String(order?.paymentStatus || '').trim().toUpperCase();
  const expires = order?.reservationExpiresAt ? new Date(order.reservationExpiresAt).getTime() : NaN;
  if (isShopOrderPaid(order) || status === 'PAID') return 'This order has already been paid.';
  if (payment === 'AUTHORIZED') return 'Your payment is awaiting confirmation. Refresh the payment status to check for an update.';
  if (['CANCELLED', 'CANCELED', 'EXPIRED', 'REFUNDED', 'RETURNED', 'RETURN_REQUESTED'].includes(status) || ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(payment)) return 'Payment is unavailable because this order is cancelled, expired, returned or refunded.';
  if (expires <= Date.now()) return 'The reservation for this order has expired. Return to the shop to place a new order.';
  if (order?.canPay === false) return 'Payment is not available for this order. Refresh the payment status to check for an update.';
  if (['DELIVERED', 'COMPLETED', 'FULFILLED'].includes(status)) return 'This order is complete. Refresh the payment status to check for an update.';
  // Order lifecycle labels differ from payment status. Let the creation API
  // validate an explicitly unpaid order instead of limiting it to two labels.
  if (['UNPAID', 'PENDING', 'FAILED', 'CREATED', 'NOT_STARTED', 'NOT_INITIATED', 'AWAITING_PAYMENT'].includes(payment)) return '';
  if (order?.canPay === true) return '';
  if (!payment && ['PENDING', 'PENDING_PAYMENT', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'CREATED', 'PLACED', 'RESERVED'].includes(status)) return '';
  return 'Payment status could not be determined. Refresh the payment status to check for an update.';
}
export const canPayShopOrder = (order) => !shopOrderPaymentUnavailableReason(order);

export async function createShopOrderPayment(api, orderId, signal) {
  if (typeof orderId !== 'string' || !orderId.trim()) throw new Error('Order reference is missing.');
  // No creation body was supplied by the backend contract; totals belong to the server.
  return shopAccountData(await api.post(`/shop/orders/${encodeURIComponent(orderId)}/payment`, {}, { signal }));
}

export function shopRazorpayDetails(data, fallbackKey = '') {
  const payment = data?.payment || data || {};
  const checkout = data?.checkoutOptions || data?.razorpay || {};
  const providerOrder = data?.razorpayOrder || {};
  const paymentId = data?.ecommercePaymentId || data?.paymentId || payment.ecommercePaymentId || payment.id;
  const orderId = checkout.order_id || checkout.orderId || data?.razorpayOrderId || payment.razorpayOrderId || payment.providerOrderId || providerOrder.id;
  const key = checkout.key || checkout.keyId || data?.razorpayKeyId || data?.keyId || data?.key || fallbackKey;
  const amount = checkout.amount ?? providerOrder.amount ?? data?.amountPaise ?? payment.amountPaise ?? data?.amount;
  const currency = checkout.currency || providerOrder.currency || payment.currency || data?.currency;
  if (![paymentId, orderId, key, currency].every(value => typeof value === 'string' && value.trim()) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Payment details are incomplete. Refresh your order or contact support before paying.');
  }
  return { paymentId, options: { key, order_id: orderId, amount: Number(amount), currency } };
}

export function shopPaymentVerificationPayload(values) {
  const payload = {};
  for (const field of ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']) {
    if (typeof values?.[field] !== 'string' || !values[field].trim()) throw new Error('Payment confirmation is incomplete. Check your order status before paying again.');
    payload[field] = values[field];
  }
  return payload;
}

export async function verifyShopPayment(api, paymentId, values, signal) {
  if (typeof paymentId !== 'string' || !paymentId.trim()) throw new Error('Payment reference is missing. Check your order status before paying again.');
  return shopAccountData(await api.post(`/shop/payments/${encodeURIComponent(paymentId)}/verify`, shopPaymentVerificationPayload(values), { signal }));
}

let checkoutScript;
export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Open checkout in your browser to pay.'));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timer = window.setTimeout(() => fail(), 20000);
    function fail() {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error('Razorpay could not be loaded. Check your connection and try again.'));
    }
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.Razorpay) resolve(window.Razorpay);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch((error) => { checkoutScript = undefined; throw error; });
  return checkoutScript;
}

export async function openRazorpayCheckout(options, signal) {
  const Razorpay = await loadRazorpayCheckout();
  if (signal?.aborted) throw new Error('Payment cancelled.');
  return new Promise((resolve, reject) => {
    let settled = false;
    let checkout;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(result);
    };
    const abort = () => { finish(new Error('Payment cancelled.')); checkout?.close(); };
    try {
      checkout = new Razorpay({
        ...options,
        retry: { enabled: false },
        handler: (result) => {
          if (result?.razorpay_order_id !== options.order_id) {
            finish(Object.assign(new Error('Payment reference does not match this order. Check your order status before paying again.'), { paymentUncertain: true }));
            return;
          }
          try { finish(null, shopPaymentVerificationPayload(result)); }
          catch (error) { error.paymentUncertain = true; finish(error); }
        },
        modal: { ondismiss: () => finish(new Error('Payment was cancelled. Your order is still available in My orders.')) },
      });
      checkout.on('payment.failed', (result) => {
        finish(new Error(result?.error?.description || 'Payment failed. Check your order status before paying again.'));
        checkout.close();
      });
      signal?.addEventListener('abort', abort, { once: true });
      checkout.open();
    } catch (error) { finish(error); }
  });
}
