import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import MainApi from '@/util/MainApi';
import { billingError, billingMoney, fetchVendorSubscription, fetchVendorWallet, subscriptionSummary } from '@/util/vendorBilling.mjs';
import styles from './VendorBilling.module.css';

const WalletContext = createContext(null);
export function WalletIcon() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6m18 6h-5v5h5" /><circle cx="16.5" cy="14.5" r=".5" /></svg>;
}
export function VendorWalletProvider({ children }) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [subscriptionResult, setSubscriptionResult] = useState(null);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    window.addEventListener('epic-vendor-wallet-change', refresh);
    return () => window.removeEventListener('epic-vendor-wallet-change', refresh);
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    fetchVendorWallet(MainApi, controller.signal).then((wallet) => { if (!controller.signal.aborted) setResult({ wallet, revision }); }).catch((error) => { if (!controller.signal.aborted) setResult({ error: billingError(error), revision }); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const controller = new AbortController();
    fetchVendorSubscription(MainApi, controller.signal).then((subscription) => { if (!controller.signal.aborted) setSubscriptionResult({ subscription, revision }); }).catch((error) => { if (!controller.signal.aborted) setSubscriptionResult({ error: billingError(error), revision }); });
    return () => controller.abort();
  }, [revision]);
  return <WalletContext.Provider value={{ wallet: result?.wallet, error: result?.error, loading: result?.revision !== revision, subscription: subscriptionResult?.subscription, subscriptionError: subscriptionResult?.error, subscriptionLoading: subscriptionResult?.revision !== revision, refresh, revision }}>{children}</WalletContext.Provider>;
}
export function useVendorWallet() { return useContext(WalletContext); }
export function VendorWalletBalance() {
  const { wallet, error, loading } = useVendorWallet();
  return <Link href="/partner/wallet-transactions" className={styles.walletBadge} title={error || 'View wallet transactions'} aria-label={`Wallet balance: ${loading ? 'loading' : error ? 'unavailable' : billingMoney(wallet?.balance, wallet?.currency)}`}><WalletIcon /><strong>{loading ? 'Loading...' : error ? 'Unavailable' : billingMoney(wallet?.balance, wallet?.currency)}</strong></Link>;
}
export function VendorPlanChip() {
  const { subscription, subscriptionError, subscriptionLoading } = useVendorWallet();
  const plan = subscriptionSummary(subscription);
  const label = subscriptionLoading ? 'Loading plan...' : subscriptionError ? 'View plans' : subscription ? plan.code || plan.name : 'Choose plan';
  return <Link href="/partner/subscription-plans" className={styles.planChip} title={subscriptionError || (subscription ? `${plan.name}${plan.status ? ` (${plan.status})` : ''}` : 'Choose a subscription plan')} aria-label={`View subscription plans: ${label}`}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 6 4 4 5-7 5 7 4-4-3 13H6L3 6Zm3 16h12" /></svg><span>{label}</span></Link>;
}
