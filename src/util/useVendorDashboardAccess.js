import { useSyncExternalStore } from 'react';
import { getAuthUser } from '@/util/authSession';

function getAccess() {
  const user = getAuthUser();
  const status = String(user?.vendorProfile?.kycStatus || '').trim().toUpperCase();
  if (user?.role !== 'VENDOR' || status === 'APPROVED' || status === 'APPROVEL') return 'approved';
  return status === 'AWAITING' ? 'awaiting' : 'pending';
}

function subscribe(callback) {
  window.addEventListener('epic-auth-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('epic-auth-change', callback);
    window.removeEventListener('storage', callback);
  };
}

export default function useVendorDashboardAccess() {
  return useSyncExternalStore(subscribe, getAccess, () => 'loading');
}
