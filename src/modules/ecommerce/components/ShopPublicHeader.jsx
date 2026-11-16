import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Badge } from '@mui/material';
import HeaderAccountMenu from '@/components/common/HeaderAccountMenu';
import ShopIcon from './ShopIcon';
import ShopCollectionsDrawer from './ShopCollectionsDrawer';
import useShopCollections from './useShopCollections';
import styles from '../ShopProductPage.module.css';

export default function ShopPublicHeader() {
  const [drawer, setDrawer] = useState('');
  const collections = useShopCollections();
  const cartCount = collections.cart.reduce((sum, row) => sum + row.quantity, 0);
  return <>
    <header className={styles.header}><Link href="/" className={styles.brand} aria-label="Epic home"><Image src="/images/epic-logo-new.png" alt="Epic" width={114} height={44} className={styles.brandLogo} preload /></Link><nav aria-label="Shop navigation"><Link href="/shop">Home</Link><Link href="/shop">Collections</Link>
      <button type="button" disabled={collections.busy} aria-label={`Open wishlist (${collections.wishlist.length})`} aria-haspopup="dialog" aria-expanded={drawer === 'wishlist'} onClick={() => { setDrawer('wishlist'); collections.refresh(); }}><Badge badgeContent={collections.wishlist.length} sx={{ '& .MuiBadge-badge': { bgcolor: '#a4002b', color: 'white', fontSize: 9 } }}><ShopIcon name="heart" size={20} /></Badge></button>
      <button type="button" disabled={collections.busy} aria-label={`Open cart (${cartCount})`} aria-haspopup="dialog" aria-expanded={drawer === 'cart'} onClick={() => { setDrawer('cart'); collections.refresh(); }}><Badge badgeContent={cartCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#a4002b', color: 'white', fontSize: 9 } }}><ShopIcon name="cart" size={20} /></Badge></button>
      <HeaderAccountMenu dashboardHref="/dashboard/shop" accountLinks={[{ href: '/user/orders', label: 'My orders' }, { href: '/shop/checkout', label: 'Delivery addresses' }]} guestFallback={<Link href="/user/login?next=%2Fshop" className={styles.loginButton}>Login</Link>} />
    </nav></header>
    <ShopCollectionsDrawer type={drawer} onClose={() => setDrawer('')} collections={collections} />
  </>;
}
