import Image from 'next/image';
import { useRef, useState } from 'react';
import Link from 'next/link';
import ShopIcon from './ShopIcon';
import { shopError, shopMoney, shopProductImages, shopProductPrice, shopProductSlug } from '@/util/shopCatalog.mjs';
import styles from '../ShopHome.module.css';

export default function ProductCard({ product, index = 0, view = 'grid', saved = false, onSave }) {
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() { if (saving.current) return; saving.current = true; setBusy(true); setError(''); try { const result = await onSave(product); if (result?.refreshError) setError('Saved. Open your wishlist to refresh it.'); } catch (err) { setError(shopError(err)); } finally { saving.current = false; setBusy(false); } }
  const price = shopProductPrice(product);
  const image = shopProductImages(product)[0];
  const href = `/shop/${encodeURIComponent(shopProductSlug(product))}`;
  return <article className={styles.product}>
    <div className={styles.productImage}><Link href={href} className={styles.productPreview} aria-label={`View ${product.title}`}>{image ? <Image src={image.url} alt={image.alt || product.title} fill unoptimized sizes={view === 'list' ? '200px' : '(max-width: 760px) 50vw, 25vw'} loading={index < 4 ? 'eager' : 'lazy'} /> : <span className={styles.imagePlaceholder}><ShopIcon name="box" size={36} /><span>No image available</span></span>}</Link>{onSave && <button type="button" className={styles.wishlistButton} aria-label={`${saved ? 'Unsave' : 'Save'} ${product.title}`} aria-pressed={saved} disabled={busy} onClick={save}><ShopIcon name="heart" size={16} fill={saved ? 'currentColor' : 'none'} /></button>}</div>
    <div className={styles.productInfo}>{error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}<h3><Link href={href}>{product.title}</Link></h3><p className={styles.productCategory}>{product.category?.name || product.brandName || ''}</p><div className={styles.price}><strong>{shopMoney(price.sale)}</strong>{price.discount > 0 && <><del>{shopMoney(price.mrp)}</del><span>{price.discount}% Off</span></>}</div><Link href={href} className={styles.addButton}>View details <span aria-hidden="true">&rarr;</span></Link></div>
  </article>;
}
