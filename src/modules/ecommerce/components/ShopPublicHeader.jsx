import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@mui/material';
import HeaderAccountMenu from '@/components/common/HeaderAccountMenu';
import ShopIcon from './ShopIcon';
import ShopCollectionsDrawer from './ShopCollectionsDrawer';
import ShopCollectionToast from './ShopCollectionToast';
import useShopCollections from './useShopCollections';
import styles from '../ShopProductPage.module.css';

export default function ShopPublicHeader() {
  const [drawer, setDrawer] = useState('cart');
  const [drawerOpen, setDrawerOpen] = useState(false);
  function openDrawer(type) { setDrawer(type); setDrawerOpen(true); collections.refresh(); }
  const collections = useShopCollections();
  const cartCount = collections.cart.reduce((sum, row) => sum + row.quantity, 0);
  return <>
    <header className={styles.header}><Link href="/" className={styles.brand} aria-label="Epic home"><Image src="/images/epic-logo-new.png" alt="Epic" width={114} height={44} className={styles.brandLogo} preload /></Link><nav aria-label="Shop navigation"><Link href="/shop">Home</Link><Link href="/shop">Collections</Link>
      <button type="button" disabled={collections.busy} aria-label={`Open wishlist (${collections.wishlist.length})`} aria-haspopup="dialog" aria-expanded={drawerOpen && drawer === 'wishlist'} onClick={() => openDrawer('wishlist')}><Badge badgeContent={collections.wishlist.length} sx={{ '& .MuiBadge-badge': { bgcolor: '#a4002b', color: 'white', fontSize: 9 } }}><ShopIcon name="heart" size={20} /></Badge></button>
      <button type="button" disabled={collections.busy} aria-label={`Open cart (${cartCount})`} aria-haspopup="dialog" aria-expanded={drawerOpen && drawer === 'cart'} onClick={() => openDrawer('cart')}><Badge badgeContent={cartCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#a4002b', color: 'white', fontSize: 9 } }}><ShopIcon name="cart" size={20} /></Badge></button>
      <HeaderAccountMenu accountLinks={[{ href: '/user/orders', label: 'My orders' }, { href: '/shop/checkout', label: 'Delivery addresses' }]} guestFallback={<Link href="/user/login?next=%2Fshop" className={styles.loginButton}>Login</Link>} />
    </nav></header>
    <ShopCollectionsDrawer type={drawer} open={drawerOpen} onClose={() => setDrawerOpen(false)} collections={collections} />
    <ShopCollectionToast notice={collections.notice} onClose={collections.dismissNotice} onOpen={openDrawer} />
  </>;
}
