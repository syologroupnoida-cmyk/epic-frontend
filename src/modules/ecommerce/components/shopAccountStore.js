import MainApi from '@/util/MainApi';
import { getAccessToken, getAuthUser } from '@/util/authSession';
import { fetchShopCart, fetchShopWishlist } from '@/util/shopAccount.mjs';
import { shopError } from '@/util/shopCatalog.mjs';

export const emptyAccount = { session: '', cart: [], wishlist: [], cartError: '', wishlistError: '', cartLoaded: false, wishlistLoaded: false, cartLoading: false, wishlistLoading: false, cartNeedsRefresh: false, wishlistNeedsRefresh: false, loading: false, loaded: false, busy: false };
let snapshot = emptyAccount;
const reads = new Map();
const listeners = new Set();
export const subscribeShopAccount = (callback) => { listeners.add(callback); return () => listeners.delete(callback); };
export const shopAccountSnapshot = () => snapshot;
export const serverShopAccountSnapshot = () => emptyAccount;
export function currentShopSession() {
  const token = getAccessToken();
  if (!token) return '';
  const user = getAuthUser();
  return String(user?.id || user?.userId || user?.email || token);
}
function emit(changes) {
  snapshot = { ...snapshot, ...changes };
  snapshot.loading = snapshot.cartLoading || snapshot.wishlistLoading;
  snapshot.loaded = snapshot.cartLoaded && snapshot.wishlistLoaded;
  listeners.forEach((callback) => callback());
}
export function resetShopAccount() {
  reads.forEach((request) => request.controller.abort()); reads.clear();
  snapshot = emptyAccount; listeners.forEach((callback) => callback());
}
function acceptSession(session) {
  if (!session || session !== currentShopSession()) return false;
  if (snapshot.session !== session) { resetShopAccount(); emit({ session }); }
  return true;
}
const fetchCollection = (kind, signal) => kind === 'cart' ? fetchShopCart(MainApi, signal) : fetchShopWishlist(MainApi, signal);
function cancelRead(kind) { reads.get(kind)?.controller.abort(); reads.delete(kind); }
function loadCollection(session, kind, force) {
  if (reads.has(kind) && !force) return reads.get(kind).promise;
  if (snapshot[`${kind}Loaded`] && !force) return Promise.resolve();
  cancelRead(kind);
  const controller = new AbortController(); const request = { controller };
  reads.set(kind, request);
  emit({ [`${kind}Loading`]: true });
  request.promise = fetchCollection(kind, controller.signal).then((items) => {
    if (!controller.signal.aborted && snapshot.session === session) emit({ [kind]: items, [`${kind}Error`]: '', [`${kind}NeedsRefresh`]: false });
  }).catch((error) => {
    if (!controller.signal.aborted && snapshot.session === session) emit({ [`${kind}Error`]: shopError(error) });
  }).finally(() => {
    if (reads.get(kind) === request) {
      reads.delete(kind);
      if (snapshot.session === session) emit({ [`${kind}Loading`]: false, [`${kind}Loaded`]: true });
    }
  });
  return request.promise;
}
export async function refreshShopAccount(session, force = false) {
  if (!session) { if (snapshot.session && !currentShopSession()) resetShopAccount(); return; }
  if (!acceptSession(session)) return;
  return Promise.allSettled(['cart', 'wishlist'].map((kind) => loadCollection(session, kind, force)));
}
export async function mutateShopAccount(session, operation, kind, { readBeforeWrite = false } = {}) {
  if (!acceptSession(session)) throw new Error('Sign in to continue.');
  if (snapshot.busy) throw new Error('Please wait for the current update to finish.');
  if (snapshot[`${kind}NeedsRefresh`]) throw new Error('Refresh your saved items before making another change.');
  // A slow wishlist read must not block cart writes, or overwrite a newer mutation.
  cancelRead(kind);
  emit({ busy: true, [`${kind}Loading`]: false });
  let saved = false; let writing = false;
  try {
    if (readBeforeWrite) {
      const items = await fetchCollection(kind);
      if (session !== currentShopSession() || snapshot.session !== session) throw new Error('Your account changed. Please try again.');
      emit({ [kind]: items, [`${kind}Error`]: '', [`${kind}Loaded`]: true });
    }
    writing = true;
    const result = await operation(snapshot[kind]); saved = true;
    if (snapshot.session !== session || session !== currentShopSession()) return { saved: true, result };
    const data = await fetchCollection(kind);
    if (snapshot.session === session) emit({ [kind]: data, [`${kind}Error`]: '', [`${kind}NeedsRefresh`]: false, [`${kind}Loaded`]: true });
    return { saved: true, result };
  } catch (error) {
    if (saved) {
      if (snapshot.session === session) emit({ [`${kind}Error`]: `Your change was saved, but the list could not be refreshed. ${shopError(error)}`, [`${kind}NeedsRefresh`]: true, [`${kind}Loaded`]: true });
      return { saved: true, refreshError: shopError(error) };
    }
    if (writing && (!error.response || error.response.status >= 500 || error.response.status === 408)) {
      if (snapshot.session === session) emit({ [`${kind}Error`]: 'The update could not be confirmed. Refresh this list before trying again.', [`${kind}NeedsRefresh`]: true, [`${kind}Loaded`]: true });
    } else if (!writing && snapshot.session === session) emit({ [`${kind}Error`]: shopError(error), [`${kind}Loaded`]: true });
    throw error;
  } finally { if (snapshot.session === session) emit({ busy: false }); }
}
