import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Radio } from '@mui/material';
import MainApi from '@/util/MainApi';
import { billingError, billingMoney, fetchVendorPlanCatalog, fetchWalletTransactions, isCurrentVendorPlan, createVendorSubscriptionPayment, subscriptionSummary, vendorSubscriptionRazorpayDetails, verifyVendorSubscriptionPayment, walletTransaction } from '@/util/vendorBilling.mjs';
import { subscriptionPlanId } from '@/util/subscriptionPlans.mjs';
import { loadRazorpayCheckout, openRazorpayCheckout } from '@/util/shopPayment.mjs';
import { leadDate } from '@/util/vendorLeads.mjs';
import SubscriptionPlanCard from '@/components/superadmin/SubscriptionPlanCard';
import { useVendorWallet } from './VendorWalletProvider';
import cardStyles from '@/components/superadmin/SubscriptionPlans.module.css';
import styles from './VendorBilling.module.css';

const buttonSx = { textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } };
export default function VendorSubscriptionPlans() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState(null);
  const [locked, setLocked] = useState(false);
  const request = useRef(null);
  const { refresh, subscription, subscriptionError, subscriptionLoading } = useVendorWallet();
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchVendorPlanCatalog(MainApi, controller.signal).then((catalog) => {
      if (!controller.signal.aborted) setResult({ attempt, ...catalog });
    }).catch((failure) => { if (!controller.signal.aborted) setResult({ attempt, plans: [], error: billingError(failure) }); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const controller = new AbortController();
    fetchWalletTransactions(MainApi, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setTransactions({ attempt, ...data });
    }).catch((failure) => {
      if (!controller.signal.aborted) setTransactions({ attempt, items: [], error: billingError(failure) });
    });
    return () => controller.abort();
  }, [attempt]);
  const current = result?.attempt === attempt && (!subscriptionLoading || result.hasCurrentPlanInfo) ? { ...result, subscription, subscriptionError } : null;
  const catalogPlan = current?.plans.find((plan) => isCurrentVendorPlan(plan, null));
  const effectiveSubscription = catalogPlan ? { ...(subscriptionSummary(subscription).planId === subscriptionPlanId(catalogPlan) ? subscription : {}), plan: catalogPlan, planId: subscriptionPlanId(catalogPlan) } : subscription;
  const cannotVerifyCurrentPlan = Boolean(current?.subscriptionError && !current?.hasCurrentPlanInfo);
  const successfulPurchases = transactions?.attempt === attempt ? transactions.items.map(walletTransaction).filter((row) => {
    const purchase = `${row.type} ${row.description}`.toUpperCase();
    return /SUBSCRIPTION|PLAN/.test(purchase) && ['COMPLETED', 'SUCCESS', 'SUCCEEDED', 'PAID', 'CAPTURED'].includes(String(row.status).toUpperCase());
  }) : [];
  async function purchase() {
    if (!current || current.error || cannotVerifyCurrentPlan || !selected || request.current || locked || isCurrentVendorPlan(selected, current.subscription)) return;
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError('');
    let callbackReceived = false;
    try {
      await loadRazorpayCheckout();
      if (controller.signal.aborted) return;
      const created = await createVendorSubscriptionPayment(MainApi, subscriptionPlanId(selected), controller.signal);
      if (controller.signal.aborted) return;
      const payment = vendorSubscriptionRazorpayDetails(created.data, process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '');
      const result = await openRazorpayCheckout({
        ...payment.options,
        name: 'Epic',
        description: `${selected.displayName || 'Subscription'} plan`,
        theme: { color: '#b61f4b' },
      }, controller.signal);
      callbackReceived = true;
      const verified = await verifyVendorSubscriptionPayment(MainApi, payment.paymentId, result, controller.signal);
      if (!controller.signal.aborted) {
        setLocked(false); setSelected(null); setSuccess(verified.message); setAttempt((value) => value + 1); refresh();
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        const uncertain = callbackReceived || (!callbackReceived && (!failure.response || failure.response.status >= 500 || failure.response.status === 408));
        if (uncertain) setLocked(true);
        setError(callbackReceived
          ? `Payment confirmation could not be completed. Check your transactions before paying again. ${billingError(failure)}`
          : billingError(failure));
      }
    }
    finally { if (!controller.signal.aborted) { request.current = null; setPending(false); } }
  }
  return <section className={styles.panel}>
    <header className={styles.header}><div><h1>Subscription Plans</h1><p>View your subscription and choose a plan for your business.</p></div></header>
    <div className={styles.body}>
      {!current ? <div className={styles.empty} role="status"><CircularProgress size={26} aria-label="Loading subscription plans" /></div> : <>
        {(current.error || current.subscriptionError) && <Alert severity={current.error || cannotVerifyCurrentPlan ? 'error' : 'warning'} sx={{ mb: 2 }} action={<Button size="small" color="inherit" onClick={() => { setAttempt((value) => value + 1); if (current.subscriptionError) refresh(); }}>Retry</Button>}>{current.error || current.subscriptionError}</Alert>}
        <div className={styles.intro}><h2>Choose the plan that grows your business</h2><p>Compare benefits, listing limits and direct lead prices.</p></div>
        {!current.error && !current.plans.length && <p className={styles.empty}>No subscription plans are available.</p>}
        <div className={cardStyles.grid}>{current.plans.map((plan, index) => {
          const purchased = isCurrentVendorPlan(plan, current.subscription);
          const unavailable = plan.isPurchasable === false || plan.isActive === false || ['UNAVAILABLE', 'DISABLED', 'NOT_PURCHASABLE'].includes(plan.cardAction);
          const disabled = purchased || unavailable || !subscriptionPlanId(plan) || cannotVerifyCurrentPlan || pending || locked;
          return <SubscriptionPlanCard key={subscriptionPlanId(plan) || index} plan={plan} statusBadge={purchased && <span className={styles.activePlan}><span className={styles.activeDot} aria-hidden="true" />Active</span>} action={<button type="button" className={`${cardStyles.cta} ${styles.action}`} disabled={disabled} onClick={() => { setError(''); setSelected(plan); }}>{purchased ? 'Current plan' : unavailable ? 'Unavailable' : plan.ctaText || (plan.cardAction === 'UPGRADE' || effectiveSubscription ? 'Upgrade plan' : 'Purchase plan')}{!purchased && !unavailable && <span aria-hidden="true">&rarr;</span>}</button>} />;
        })}</div>
        <section className={styles.transactions} aria-labelledby="subscription-transactions-title">
          <div className={styles.transactionsHeader}><div><h2 id="subscription-transactions-title">Purchase Transactions</h2><p>Track your subscription payment history.</p></div></div>
          {transactions?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button size="small" color="inherit" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{transactions.error}</Alert>}
          <div className={styles.tableScroll}><table className={styles.table} aria-label="Successful subscription purchases"><thead><tr>{['Date', 'Plan transaction', 'Amount', 'Reference', 'Status'].map((title) => <th key={title}>{title}</th>)}</tr></thead><tbody>
            {!transactions || transactions.attempt !== attempt ? <tr><td colSpan={5} className={styles.empty} role="status">Loading transactions...</td></tr>
              : successfulPurchases.length ? successfulPurchases.map((row, index) => (
                <tr key={row.id || index}><td>{leadDate(row.date, true)}</td><td><p>{row.description || String(row.type).replaceAll('_', ' ')}</p></td><td><strong>{billingMoney(row.amount == null ? null : Math.abs(Number(row.amount)), row.currency)}</strong></td><td><small>{row.reference || 'Not provided'}</small></td><td><span className={styles.status}>{String(row.status).replaceAll('_', ' ')}</span></td></tr>
              )) : <tr><td colSpan={5} className={styles.empty}>{transactions.error ? 'Transactions could not be loaded.' : 'No successful subscription purchases found.'}</td></tr>}
          </tbody></table></div>
        </section>
      </>}
    </div>
    <Dialog open={Boolean(selected)} onClose={pending ? undefined : () => setSelected(null)} disableEscapeKeyDown={pending} disableScrollLock maxWidth="xs" fullWidth aria-labelledby="purchase-plan-title">
      <DialogTitle id="purchase-plan-title" sx={{ fontSize: 18 }}>Confirm {selected?.cardAction === 'UPGRADE' || effectiveSubscription ? 'plan change' : 'plan purchase'}</DialogTitle>
      <DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<p className="text-sm text-slate-700">{selected?.displayName}</p><p className="mt-2 text-xl font-semibold text-[#b61f4b]">{billingMoney(selected?.monthlyPrice)} <span className="text-xs font-normal text-slate-500">/ month</span></p><p className="mt-3 text-xs leading-5 text-slate-500">Secure payment is handled by Razorpay.</p></DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}><Button disabled={pending} onClick={() => setSelected(null)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button><Button className={styles.razorpayButton} variant="contained" disabled={pending || locked} onClick={purchase} aria-label="Pay with Razorpay"><Radio checked color="default" disabled={pending || locked} size="small" sx={{ p: 0, mr: 0.5, '& .MuiSvgIcon-root': { width: 18, height: 18 }, '&.Mui-checked': { color: '#b61f4b' } }} /><Image src="/images/ecommerce/razorpay-payment.png" alt="" width={100} height={34} className={styles.razorpayLogo} /><span>{pending ? 'Processing...' : ''}</span></Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(success)} onClose={() => setSuccess('')} disableScrollLock maxWidth="xs" fullWidth aria-labelledby="plan-purchase-success"><DialogTitle id="plan-purchase-success" sx={{ fontSize: 18 }}>Subscription updated</DialogTitle><DialogContent><Alert severity="success">{success}</Alert></DialogContent><DialogActions sx={{ p: 2 }}><Button variant="contained" onClick={() => setSuccess('')} sx={buttonSx}>Done</Button></DialogActions></Dialog>
  </section>;
}
