import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ShopPublicHeader from './components/ShopPublicHeader';
import ShopIcon from './components/ShopIcon';
import useShopCollections from './components/useShopCollections';
import { shopProductId } from '@/util/shopCatalog.mjs';
import { chooseShopVariant, defaultShopVariant, fetchShopProduct, ShopApi, shopError, shopMoney, shopOptionDefinitions, shopProductImages, shopProductPrice, shopStock } from '@/util/shopCatalog.mjs';
import { isColorOption, productColorHex } from '@/util/productPresentation.mjs';
import styles from './ShopProductPage.module.css';

export default function ShopProductPage({ slug }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopProduct(ShopApi, slug, { signal: controller.signal }).then((row) => { if (!controller.signal.aborted) { setProduct(row); } }).catch((err) => { if (!controller.signal.aborted) { setError(shopError(err)); setNotFound(err.response?.status === 404); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, retry]);
  return <div className={styles.page}><Head><title>{product ? `${product.title} | Epic Collection` : 'Product Details | Epic Collection'}</title>{product?.description && <meta name="description" content={product.description.slice(0, 180)} />}</Head><ShopPublicHeader /><main className={styles.main}>{loading ? <div className={styles.state} role="status">Loading product details...</div> : error ? <div className={styles.state} role="alert"><h1>{notFound ? 'Product not found' : 'Product could not be loaded'}</h1><p>{error}</p>{notFound ? <Link href="/shop">Back to collection</Link> : <button onClick={() => { setLoading(true); setError(''); setNotFound(false); setRetry((value) => value + 1); }}>Try again</button>}</div> : product && <ShopProductDetails key={slug} product={product} />}</main></div>;
}

export function ShopProductDetails({ product }) {
  const router = useRouter();
  const action = useRef(false);
  const [pendingAction, setPendingAction] = useState('');
  const variants = Array.isArray(product.variants) && product.variants.length ? product.variants : product.defaultVariant ? [product.defaultVariant] : [];
  const [variant, setVariant] = useState(() => defaultShopVariant(product));
  const [imageUrl, setImageUrl] = useState('');
  const [failedImages, setFailedImages] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState('');
  const collections = useShopCollections();
  const saved = collections.wishlist.some((row) => row.id === shopProductId(product));
  const options = shopOptionDefinitions(product);
  const images = shopProductImages(product, variant).filter((image) => !failedImages.includes(image.url));
  const activeImage = images.find((image) => image.url === imageUrl) || images[0];
  const prices = shopProductPrice(product, variant);
  const stock = shopStock(variant);
  async function purchase(buyNow = false) {
    if (action.current) return;
    action.current = true; setPendingAction(buyNow ? 'buy' : 'cart'); setCartNotice('');
    try {
      await (buyNow ? collections.buyNow(product, variant, quantity) : collections.addToCart(product, variant, quantity));
      if (buyNow) await router.push('/shop/checkout');
    } catch (err) { setCartNotice(shopError(err)); }
    finally { action.current = false; setPendingAction(''); }
  }
  async function saveWishlist() {
    try { await collections.toggleWishlist(product); }
    catch (err) { setCartNotice(shopError(err)); }
  }
  const unavailable = !variant || variant.isActive === false || !stock || prices.sale == null;
  const purchasing = Boolean(pendingAction) || collections.busy;
  function choose(name, value) { const next = chooseShopVariant(variants, variant, name, value); if (next) { setVariant(next); setImageUrl(''); setQuantity(1); setCartNotice(''); } }
  return <>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={product.category?.slug ? `/shop?categorySlug=${encodeURIComponent(product.category.slug)}` : '/shop'}>{product.category?.name || 'Collection'}</Link><span>/</span><span aria-current="page">{product.title}</span></nav>
    <div className={styles.layout}>
      <section className={styles.gallery} aria-label="Product images"><div className={styles.mainImage}>{activeImage ? <Image src={activeImage.url} alt={activeImage.alt || product.title} fill unoptimized sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 1000px) 48vw, 466px" loading="eager" onError={() => setFailedImages((current) => [...current, activeImage.url])} /> : <div className={styles.placeholder}><ShopIcon name="box" size={48} /><span>No product image available</span></div>}<button type="button" className={styles.imageWishlist} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved} disabled={collections.busy} onClick={saveWishlist}><ShopIcon name="heart" size={20} fill={saved ? 'currentColor' : 'none'} /></button></div>{images.length > 1 && <div className={styles.thumbnails}>{images.map((image, index) => <button key={image.url} type="button" className={styles.thumbnail} aria-label={`View image ${index + 1}`} aria-pressed={activeImage?.url === image.url} onClick={() => setImageUrl(image.url)}><Image src={image.url} alt={image.alt || `${product.title}, view ${index + 1}`} fill unoptimized sizes="(max-width: 600px) 30vw, (max-width: 1000px) 16vw, 150px" /></button>)}</div>}</section>
      <section className={styles.summary} aria-label="Product information"><p className={styles.brandName}>{product.brandName || 'Epic Collection'}</p><h1>{product.title}</h1>{variant?.sku && <p className={styles.sku}>SKU: {variant.sku}</p>}<div className={styles.prices}><strong>{shopMoney(prices.sale)}</strong>{prices.discount > 0 && <><del>{shopMoney(prices.mrp)}</del><span className={styles.discount}>{prices.discount}% OFF</span></>}</div><p className={styles.tax}>Inclusive of applicable taxes</p><p className={styles.description}>{product.description || 'Discover this piece from the Epic collection.'}</p>
        {options.map((option) => <div className={styles.option} key={option.name}><h2>{isColorOption(option.name) ? 'Color' : `Select ${option.name.toLowerCase()}`}{isColorOption(option.name) && variant?.optionValues?.[option.name] && <span>: {variant.optionValues[option.name]}</span>}</h2><div className={styles.choices}>{option.values.map((value) => <button key={value} type="button" className={isColorOption(option.name) ? styles.colorChoice : styles.choice} aria-label={`${option.name}: ${value}`} title={value} aria-pressed={variant?.optionValues?.[option.name] === value} disabled={!variants.some((row) => row.optionValues?.[option.name] === value)} onClick={() => choose(option.name, value)}>{isColorOption(option.name) ? <span style={{ backgroundColor: productColorHex(value) }} /> : value}</button>)}</div></div>)}
        <p className={`${styles.stock} ${stock > 0 ? styles.inStock : ''}`}><ShopIcon name="shield" size={15} />{stock == null ? 'Stock availability is not available yet' : stock === 0 ? 'Out of stock' : `In stock — ${stock} available`}</p><div className={styles.purchase}><div className={styles.quantity}><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1 || stock === 0} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span aria-live="polite">{quantity}</span><button type="button" aria-label="Increase quantity" disabled={stock == null || quantity >= stock} onClick={() => setQuantity((value) => Math.min(stock, value + 1))}>+</button></div><button type="button" disabled={unavailable || purchasing} className={styles.purchaseButton} onClick={() => purchase()}><ShopIcon name="cart" size={16} />{pendingAction === 'cart' ? 'Adding...' : 'Add to Cart'}</button></div><button type="button" disabled={unavailable || purchasing} className={`${styles.purchaseButton} ${styles.buyNow}`} onClick={() => purchase(true)}>{pendingAction === 'buy' ? 'Preparing...' : 'Buy Now'}</button>{cartNotice && <p role="status" className={styles.purchaseNote}>{cartNotice}</p>}
        <div className={styles.services}><p><ShopIcon name="truck" size={16} />Delivery availability — check at checkout</p><p><ShopIcon name="shield" size={16} />Review your delivery address at checkout</p></div>
        {Object.keys(product.specifications || {}).length > 0 && <details className={styles.specifications}><summary>Product specifications</summary><dl>{Object.entries(product.specifications).map(([key, value]) => <div key={key} className="contents"><dt>{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}</dt><dd>{typeof value === 'boolean' ? value ? 'Yes' : 'No' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl></details>}
      </section>
    </div>
  </>;
}
