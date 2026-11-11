import Image from 'next/image';
import ShopIcon from './ShopIcon';
import { categories, formatPrice } from '../data/catalog.mjs';
import styles from '../ShopHome.module.css';

export default function ProductCard({ item, index, view, saved, onSave, onAdd, onOpen }) {
  const badge = { 'decor-lanterns': 'Best Seller', 'hamper-1': 'Trending', 'jewellery-1': 'New Arrival' }[item.id];
  return <article className={styles.product}>
    <div className={styles.productImage}>
      {badge && <span className={styles.productBadge}>{badge}</span>}
      <button className={styles.productPreview} onClick={() => onOpen(item)} aria-label={`View ${item.name}`}><Image src={item.image} alt={item.name} fill sizes={view === 'list' ? '200px' : '(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 22vw'} loading={index < 4 ? 'eager' : 'lazy'} /></button>
      <button className={styles.wishlistButton} aria-label={`${saved ? 'Remove' : 'Save'} ${item.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={() => onSave(item.id)}><ShopIcon name="heart" size={16} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className={styles.productInfo}>
      <h3><button onClick={() => onOpen(item)}>{item.name}</button></h3>
      <p className={styles.productCategory}>{categories.find((category) => category.id === item.category)?.name}</p>
      <p className={styles.rating}><span className={styles.star}>★</span> {item.rating.toFixed(1)} <span>({item.reviews})</span></p>
      <div className={styles.price}><strong>{formatPrice(item.price)}</strong><del>{formatPrice(item.originalPrice)}</del><span>{Math.round((1 - item.price / item.originalPrice) * 100)}% Off</span></div>
      <div className={styles.productActions}>
        <button type="button" className={styles.addButton} onClick={() => onAdd(item)}><ShopIcon name="cart" size={15} />Add to Cart</button>
        <button type="button" className={styles.viewButton} onClick={() => onOpen(item)} aria-label={`View card for ${item.name}`}>View Card</button>
      </div>
    </div>
  </article>;
}
