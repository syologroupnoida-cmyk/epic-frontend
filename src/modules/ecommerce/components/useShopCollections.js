import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/router';
import MainApi from '@/util/MainApi';
import { prepareShopBuyNow, addShopCartProduct, addShopWishlistProduct, removeShopWishlistProduct, removeShopCartItem, updateShopCartItem, shopVariantId } from '@/util/shopAccount.mjs';
import { shopProductId } from '@/util/shopCatalog.mjs';
import { currentShopSession, dismissShopCollectionNotice, emptyAccount, mutateShopAccount, refreshShopAccount, serverShopAccountSnapshot, shopAccountSnapshot, showShopCollectionNotice, subscribeShopAccount } from './shopAccountStore';

function subscribeAuth(callback) {
  window.addEventListener('epic-auth-change', callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener('epic-auth-change', callback); window.removeEventListener('storage', callback); };
}
const serverSession = () => '';
export default function useShopCollections() {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeAuth, currentShopSession, serverSession);
  const account = useSyncExternalStore(subscribeShopAccount, shopAccountSnapshot, serverShopAccountSnapshot);
  useEffect(() => { refreshShopAccount(session); }, [session]);
  const data = session && account.session === session ? account : emptyAccount;
  function requireSession() {
    if (session) return;
    router.push(`/user/login?next=${encodeURIComponent(router.asPath || '/shop')}`);
    throw new Error('Please sign in to continue.');
  }
  return {
    ...data,
    loggedIn: Boolean(session),
    loading: Boolean(session) && (!data.cartLoaded || data.cartLoading),
    wishlistLoading: Boolean(session) && (!data.wishlistLoaded || data.wishlistLoading),
    refresh: () => refreshShopAccount(session, true),
    dismissNotice: dismissShopCollectionNotice,
    toggleWishlist: async (product) => {
      requireSession();
      const productId = shopProductId(product);
      let adding = false;
      const result = await mutateShopAccount(session, (items) => {
        adding = !items.some((row) => row.id === productId);
        return adding ? addShopWishlistProduct(MainApi, productId) : removeShopWishlistProduct(MainApi, productId);
      }, 'wishlist', { readBeforeWrite: true });
      if (adding && result.saved) showShopCollectionNotice(session, 'wishlist', result.refreshError);
      return result;
    },
    removeWishlist: async (productId) => { requireSession(); return mutateShopAccount(session, () => removeShopWishlistProduct(MainApi, productId), 'wishlist'); },
    removeCart: async (cartItemId) => { requireSession(); return mutateShopAccount(session, () => removeShopCartItem(MainApi, cartItemId), 'cart'); },
    changeQuantity: async (cartItemId, quantity) => { requireSession(); return mutateShopAccount(session, () => updateShopCartItem(MainApi, cartItemId, { quantity }), 'cart'); },
    buyNow: async (_product, variant, quantity) => {
      requireSession();
      return mutateShopAccount(session, (items) => prepareShopBuyNow(MainApi, items, { variantId: shopVariantId(variant), quantity }), 'cart', { readBeforeWrite: true });
    },
    addToCart: async (_product, variant, quantity) => {
      requireSession();
      const result = await mutateShopAccount(session, () => addShopCartProduct(MainApi, { variantId: shopVariantId(variant), quantity }), 'cart');
      if (result.saved) showShopCollectionNotice(session, 'cart', result.refreshError);
      return result;
    },
  };
}
