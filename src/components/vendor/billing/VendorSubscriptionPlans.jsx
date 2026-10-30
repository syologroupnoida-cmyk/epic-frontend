import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import MainApi from '@/util/MainApi';
import { billingError, billingMoney, fetchVendorPlanCatalog, isCurrentVendorPlan, purchaseVendorPlan, subscriptionSummary } from '@/util/vendorBilling.mjs';
import { subscriptionPlanId } from '@/util/subscriptionPlans.mjs';
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
  const current = result?.attempt === attempt && (!subscriptionLoading || result.hasCurrentPlanInfo) ? { ...result, subscription, subscriptionError } : null;
  const catalogPlan = current?.plans.find((plan) => isCurrentVendorPlan(plan, null));
  const effectiveSubscription = catalogPlan ? { ...(subscriptionSummary(subscription).planId === subscriptionPlanId(catalogPlan) ? subscription : {}), plan: catalogPlan, planId: subscriptionPlanId(catalogPlan) } : subscription;
  const cannotVerifyCurrentPlan = Boolean(current?.subscriptionError && !current?.hasCurrentPlanInfo);
  async function purchase() {
    if (!current || current.error || cannotVerifyCurrentPlan || !selected || request.current || isCurrentVendorPlan(selected, current.subscription)) return;
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError('');
    try {
      const response = await purchaseVendorPlan(MainApi, subscriptionPlanId(selected), controller.signal);
      if (!controller.signal.aborted) {
        setSelected(null); setSuccess(response.message); setAttempt((value) => value + 1); refresh();
      }
    } catch (failure) { if (!controller.signal.aborted) setError(billingError(failure)); }
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
          const disabled = purchased || unavailable || !subscriptionPlanId(plan) || cannotVerifyCurrentPlan || pending;
          return <SubscriptionPlanCard key={subscriptionPlanId(plan) || index} plan={plan} statusBadge={purchased && <span className={styles.activePlan}><span className={styles.activeDot} aria-hidden="true" />Active</span>} action={<button type="button" className={`${cardStyles.cta} ${styles.action}`} disabled={disabled} onClick={() => { setError(''); setSelected(plan); }}>{purchased ? 'Current plan' : unavailable ? 'Unavailable' : plan.ctaText || (plan.cardAction === 'UPGRADE' || effectiveSubscription ? 'Upgrade plan' : 'Purchase plan')}{!purchased && !unavailable && <span aria-hidden="true">&rarr;</span>}</button>} />;
        })}</div>
      </>}
    </div>
    <Dialog open={Boolean(selected)} onClose={pending ? undefined : () => setSelected(null)} disableEscapeKeyDown={pending} disableScrollLock maxWidth="xs" fullWidth aria-labelledby="purchase-plan-title">
      <DialogTitle id="purchase-plan-title" sx={{ fontSize: 18 }}>Confirm {selected?.cardAction === 'UPGRADE' || effectiveSubscription ? 'plan change' : 'plan purchase'}</DialogTitle>
      <DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<p className="text-sm text-slate-700">{selected?.displayName}</p><p className="mt-2 text-xl font-semibold text-[#b61f4b]">{billingMoney(selected?.monthlyPrice)} <span className="text-xs font-normal text-slate-500">/ month</span></p><p className="mt-3 text-xs leading-5 text-slate-500">This uses the test purchase flow.</p></DialogContent>
      <DialogActions sx={{ p: 2 }}><Button disabled={pending} onClick={() => setSelected(null)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button><Button variant="contained" disabled={pending} onClick={purchase} sx={buttonSx}>{pending ? 'Processing...' : 'Confirm purchase'}</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(success)} onClose={() => setSuccess('')} disableScrollLock maxWidth="xs" fullWidth aria-labelledby="plan-purchase-success"><DialogTitle id="plan-purchase-success" sx={{ fontSize: 18 }}>Subscription updated</DialogTitle><DialogContent><Alert severity="success">{success}</Alert></DialogContent><DialogActions sx={{ p: 2 }}><Button variant="contained" onClick={() => setSuccess('')} sx={buttonSx}>Done</Button></DialogActions></Dialog>
  </section>;
}
