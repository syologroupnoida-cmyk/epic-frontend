import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import SocialLinks from '@/common/SocialLinks';
import { fetchShopCategories, ShopApi, shopCategoryId } from '@/util/shopCatalog.mjs';
import styles from './ShopPublicFooter.module.css';

export default function ShopPublicFooter() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopCategories(ShopApi, { signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setCategories(items); }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <footer className={styles.footer}><div className={styles.inner}>
    <div className={styles.brand}><Link href="/" aria-label="Epic home"><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={142} height={50} /></Link><p>Discover something beautiful for your celebration.</p><SocialLinks className={styles.social} /></div>
    <nav aria-label="Shop footer navigation" className={styles.columns}>
      {/* Reload the shop so its initial filters reflect the selected category. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <div><h2>Shop categories</h2><a href="/shop">All products</a>{categories.map((category) => <a key={shopCategoryId(category)} href={`/shop?categorySlug=${encodeURIComponent(category.slug)}`}>{category.name}</a>)}</div>
      <div><h2>Your account</h2><Link href="/user/orders">My orders</Link><Link href="/shop/checkout">Checkout</Link><Link href="/user/login?next=%2Fshop">Sign in</Link></div>
      <div><h2>Help &amp; information</h2><Link href="/contact-us">Contact us</Link><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-and-conditions">Terms &amp; conditions</Link></div>
    </nav>
  </div></footer>;
}
