import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, Button, CircularProgress, Drawer, IconButton } from '@mui/material';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import ShopIcon from './ShopIcon';
import styles from './ShopCollectionsDrawer.module.css';

export default function ShopCollectionsDrawer({ type, onClose, collections }) {
  const [error, setError] = useState('');
  const wishlist = type === 'wishlist';
  const [pending, setPending] = useState('');
  async function changeItem(key, operation) {
    setError(''); setPending(key);
    try { const result = await operation(); if (result?.refreshError) setError('Your change was saved. Refresh the list to see the latest items.'); }
    catch (err) { setError(shopError(err)); }
    finally { setPending(''); }
  }
  const busy = collections.busy || Boolean(pending);
  const loading = wishlist ? collections.wishlistLoading : collections.loading;
  const loadError = wishlist ? collections.wishlistError : collections.cartError;
  const items = wishlist ? collections.wishlist : collections.cart;
  const total = collections.cart.reduce((sum, row) => sum + (row.sale || 0) * row.quantity, 0);
  const knownPrices = collections.cart.every((row) => row.sale != null);
  return <Drawer anchor="right" open={Boolean(type)} onClose={onClose} disableScrollLock slotProps={{ paper: { className: styles.drawer, role: 'dialog', 'aria-modal': true, 'aria-label': wishlist ? 'Wishlist' : 'Shopping cart' } }}>
    <div className={styles.heading}><h2>{wishlist ? 'My Wishlist' : 'Shopping Cart'} <span>({items.length})</span></h2><IconButton aria-label="Close drawer" onClick={onClose}><ShopIcon name="close" size={20} /></IconButton></div>
    <div className={styles.content}>{!collections.loggedIn ? <div className={styles.empty}><ShopIcon name={wishlist ? 'heart' : 'cart'} size={40} /><h3>Sign in to view your {wishlist ? 'wishlist' : 'cart'}</h3><Link href="/user/login?next=%2Fshop" onClick={onClose}>Login</Link></div> : loading ? <p role="status" className={styles.empty}>Loading {wishlist ? 'wishlist' : 'cart'}...</p> : loadError ? <Alert severity="error" sx={{ mt: 2 }}>{loadError}<Button onClick={collections.refresh}>Try again</Button></Alert> : !items.length ? <div className={styles.empty}><ShopIcon name={wishlist ? 'heart' : 'cart'} size={40} /><h3>{wishlist ? 'Your wishlist is empty' : 'Your cart is empty'}</h3><p>{wishlist ? 'Save products using the heart icon.' : 'Add your favourite products to get started.'}</p><Link href="/shop" onClick={onClose}>Continue shopping</Link></div> : <ul className={styles.items}>{items.map((item) => <li key={wishlist ? item.id : item.key}>
      <Link href={item.slug ? `/shop/${encodeURIComponent(item.slug)}` : '/shop'} onClick={onClose} className={styles.image}>{item.image?.url ? <Image src={item.image.url} alt={item.image.alt || item.title || 'Product'} width={76} height={92} unoptimized /> : <ShopIcon name="box" size={28} />}</Link>
      <div className={styles.info}><Link href={item.slug ? `/shop/${encodeURIComponent(item.slug)}` : '/shop'} onClick={onClose}><h3>{item.title || 'Saved product'}</h3></Link>{item.sku && <p>{item.sku}</p>}{!wishlist && Object.keys(item.optionValues || {}).length > 0 && <p>{Object.entries(item.optionValues).map(([name, value]) => `${name}: ${value}`).join(' / ')}</p>}<strong>{shopMoney(item.sale)}</strong>
        <div className={styles.actions}>{wishlist ? <Link href={item.slug ? `/shop/${encodeURIComponent(item.slug)}` : '/shop'} onClick={onClose}>View product</Link> : <div className={styles.quantity}><button type="button" aria-label={`Decrease quantity for ${item.title}`} disabled={busy || !item.cartItemId || item.quantity <= 1} onClick={() => changeItem(item.key, () => collections.changeQuantity(item.cartItemId, item.quantity - 1))}>-</button><span aria-live="polite">{item.quantity}</span><button type="button" aria-label={`Increase quantity for ${item.title}`} disabled={busy || !item.cartItemId || (item.stock != null && item.quantity >= item.stock)} onClick={() => changeItem(item.key, () => collections.changeQuantity(item.cartItemId, item.quantity + 1))}>+</button></div>}<button type="button" disabled={busy || (!wishlist && !item.cartItemId)} aria-label={`Remove ${item.title || 'saved product'} from ${wishlist ? 'wishlist' : 'cart'}`} onClick={() => changeItem(wishlist ? item.id : item.key, () => wishlist ? collections.removeWishlist(item.id) : collections.removeCart(item.cartItemId))}>Remove</button></div>{pending === (wishlist ? item.id : item.key) && <p role="status"><CircularProgress size={10} color="inherit" /> Updating...</p>}
      </div>
    </li>)}</ul>}{error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}</div>
    {!wishlist && collections.loggedIn && !loading && !loadError && items.length > 0 && <div className={styles.footer}><div><span>Subtotal</span><strong>{knownPrices ? shopMoney(total) : 'Price unavailable'}</strong></div>{busy ? <button className={styles.checkout} disabled>Updating cart...</button> : <Link href="/shop/checkout" className={styles.checkout} onClick={onClose}>Checkout</Link>}</div>}
  </Drawer>;
}
