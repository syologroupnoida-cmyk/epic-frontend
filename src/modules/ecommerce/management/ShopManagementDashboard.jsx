import Image from 'next/image';
import Link from 'next/link';
import useAuthUser from '@/util/useAuthUser';
import { accountName } from '@/util/accountProfile.mjs';
import ShopIcon from '../components/ShopIcon';
import ShopProductList from './ShopProductList';
import { categories, products, formatPrice } from '../data/catalog.mjs';
import styles from './ShopManagement.module.css';

export default function ShopManagementDashboard({ activePanel = 'Overview', onPanelChange = () => {}, categoryCount }) {
  const user = useAuthUser();
  const panel = activePanel;
  const catalogCategories = categories.filter((category) => category.id !== 'all');
  const inStock = products.filter((product) => product.stock === 'in-stock').length;

  function openPanel(next) { onPanelChange(next); }
  if (panel === 'Products') return <ShopProductList />;
  return <section className={styles.dashboard} aria-label="Shop dashboard">
    {panel === 'Overview' && <>
      <section className={`wp-welcome ${styles.welcomeBanner}`} aria-label="Shop welcome banner"><Image src="/images/ecommerce/shop-dashboard-banner.png" alt="Elegant bridal boutique with a burgundy lehenga, wedding jewellery and gift boxes" fill preload sizes="(max-width: 900px) 100vw, 80vw" /><div className="wp-welcome-copy"><p>Welcome back,</p><h1>{accountName(user, 'Admin')}</h1><blockquote>Curate beautiful collections,<br />for every celebration.</blockquote></div><div className="wp-welcome-motto">Curate<br /><span>Manage<br />Grow</span><br />Beautifully <span aria-hidden="true">♡</span></div></section>
      <div className={styles.stats}>{[['Products', products.length, 'box', 'Products'], ['Categories', categoryCount ?? catalogCategories.length, 'grid', 'Categories'], ['In Stock', inStock, 'shield', 'Products'], ['Pre-Order', products.length - inStock, 'cart', 'Products']].map(([label, value, icon, next]) => <button key={label} onClick={() => openPanel(next)} className={styles.stat}><span className={styles.statIcon}><ShopIcon name={icon} size={22} /></span><span><small>{label}</small><strong>{value}</strong></span></button>)}</div>
      <div className={styles.sectionHeading}><h2>Catalog Preview</h2><button onClick={() => openPanel('Products')}>View all products &rarr;</button></div>
      <div className={styles.preview}>{products.slice(0, 4).map((product) => <article key={product.id}><Image src={product.image} alt={product.name} width={360} height={250} /><div><h3>{product.name}</h3><p>{categories.find((category) => category.id === product.category)?.name}</p><strong>{formatPrice(product.price)}</strong></div></article>)}</div>
    </>}
    {panel === 'Categories' && <><div className={styles.sectionHeading}><h2>Product Categories</h2></div><div className={styles.categoryGrid}>{catalogCategories.map((category) => <article key={category.id}><ShopIcon name={category.icon} size={25} /><h3>{category.name}</h3><p>{products.filter((product) => product.category === category.id).length} products</p></article>)}</div></>}
    {panel === 'Orders' && <div className={styles.empty}><ShopIcon name="cart" size={40} /><h2>Orders</h2><p>Live orders are not connected yet.</p><span>New orders will appear here once the shop checkout and order API are available.</span><Link href="/shop">Explore the shop</Link></div>}
  </section>;
}

