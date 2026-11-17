import Head from 'next/head';
import Link from 'next/link';
import ShopPublicHeader from './ShopPublicHeader';
import useShopCollections from './useShopCollections';
import styles from '../ShopCheckout.module.css';
import orderStyles from '../ShopOrderDetails.module.css';

export default function ShopAccountPage({ title, path, children, orderLayout = false }) {
  const account = useShopCollections();
  if (orderLayout) return <div className={orderStyles.page}><Head><title>{title} | Epic Shop</title></Head><ShopPublicHeader /><main className={orderStyles.main}>{account.loggedIn ? children(account) : <section className={styles.state}><h1 className={orderStyles.pageTitle}>{title}</h1><h2>Sign in to continue</h2><p>Use your account to view your order and payment status.</p><Link className={styles.primaryLink} href={`/user/login?next=${encodeURIComponent(path)}`}>Login</Link></section>}</main></div>;
  return <div className={styles.page}><Head><title>{title} | Epic</title></Head><ShopPublicHeader /><main className={styles.main}><nav className={styles.breadcrumb}><Link href="/shop">Shop</Link><span>/</span><span>{title}</span></nav><h1>{title}</h1>{account.loggedIn ? children(account) : <section className={styles.state}><h2>Sign in to continue</h2><p>Use your account to view your cart, addresses and orders.</p><Link className={styles.primaryLink} href={`/user/login?next=${encodeURIComponent(path)}`}>Login</Link></section>}</main></div>;
}
