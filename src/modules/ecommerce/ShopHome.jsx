import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Drawer, DialogContent, DialogTitle, IconButton } from '@mui/material';
import ShopIcon from './components/ShopIcon';
import ProductCard from './components/ProductCard';
import { categories, products, filterProducts, formatPrice } from './data/catalog.mjs';
import styles from './ShopHome.module.css';

const shopCategories = [
  { id: 'all', name: 'All Products', icon: 'grid', ids: [] },
  { id: 'gifts', name: 'Wedding Gifts', icon: 'gift', ids: ['return-gifts', 'hampers'] },
  { id: 'decor', name: 'Decor & Setup', icon: 'flower', ids: ['decor'] },
  { id: 'bridal', name: 'Bridal Accessories', icon: 'necklace', ids: ['bride', 'groom', 'jewellery'] },
  { id: 'invites', name: 'Invitations', icon: 'invites', ids: ['invites'] },
  { id: 'personalized', name: 'Personalized', icon: 'mug', ids: ['personalized'] },
];

const toggle = (items, value) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

function FilterGroup({ title, children }) {
  return <details className={styles.filterGroup} open><summary>{title}<span aria-hidden="true">⌃</span></summary><div>{children}</div></details>;
}

export default function ShopHome() {
  const [showDiwaliOffer, setShowDiwaliOffer] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [rating, setRating] = useState(0);
  const [availability, setAvailability] = useState([]);
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [cart, setCart] = useState({});
  const [dialog, setDialog] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('epic-shop-demo') || '{}');
      if (Array.isArray(saved.wishlist)) setWishlist(saved.wishlist.filter((id) => products.some((item) => item.id === id)));
      if (saved.cart && typeof saved.cart === 'object' && !Array.isArray(saved.cart)) setCart(Object.fromEntries(Object.entries(saved.cart).filter(([id, quantity]) => products.some((item) => item.id === id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99)));
    } catch { /* Keep the catalog usable when local storage is unavailable. */ }
  }, []);

  function save(nextCart, nextWishlist) {
    try { localStorage.setItem('epic-shop-demo', JSON.stringify({ cart: nextCart, wishlist: nextWishlist })); } catch { /* Session state still works. */ }
  }
  function openDrawer(content) {
    setDialog(content);
    setDrawerOpen(true);
  }
  function addToCart(item) {
    const next = { ...cart, [item.id]: Math.min((cart[item.id] || 0) + 1, 99) };
    setCart(next); save(next, wishlist); openDrawer('cart');
  }
  function updateQuantity(id, quantity) {
    const next = { ...cart };
    if (quantity <= 0) delete next[id]; else next[id] = Math.min(quantity, 99);
    setCart(next); save(next, wishlist);
  }
  function toggleWishlist(id) {
    const next = toggle(wishlist, id);
    setWishlist(next); save(cart, next);
  }
  function clearFilters() {
    setSearch(''); setSelectedCategories([]); setMaxPrice(50000); setRating(0); setAvailability([]); setWishlistOnly(false);
  }
  const filtered = filterProducts(products, { search, selectedCategories, maxPrice, rating, availability, wishlistOnly, wishlist });
  function openProduct(item) { setSelectedProduct(item); openDrawer('product'); }
  const cartItems = products.filter((item) => cart[item.id]);
  const wishlistItems = products.filter((item) => wishlist.includes(item.id));
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);

  return <div className={styles.shop}>
    <Head><title>Wedding Shop | Epic Wedz</title><meta name="description" content="Discover wedding invitations, thoughtful return gifts, bridal essentials, jewellery and more at the Epic Wedz Wedding Shop." /></Head>
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <Link href="/" className={styles.brand} aria-label="Epic Wedz home"><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={154} height={54} preload /></Link>
        <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}><input aria-label="Search wedding products" placeholder="Search wedding products, décor, gifts..." value={search} onChange={(event) => setSearch(event.target.value)} /><button type="submit" aria-label="Search"><ShopIcon name="search" /></button></form>
        <div className={styles.headerActions}>
          <button onClick={() => openDrawer('orders')}><ShopIcon name="box" /><span>Track Order</span></button>
          <button aria-haspopup="dialog" aria-label={`Wishlist, ${wishlist.length} items`} onClick={() => openDrawer('wishlist')} className={drawerOpen && dialog === 'wishlist' ? styles.activeAction : ''}><span className={styles.cartIcon}><ShopIcon name="heart" />{wishlist.length > 0 && <b>{wishlist.length}</b>}</span><span>Wishlist</span></button>
          <button onClick={() => openDrawer('cart')} aria-label={`Cart, ${cartCount} items`}><span className={styles.cartIcon}><ShopIcon name="cart" />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Cart</span></button>
          <Link href="/user/login"><ShopIcon name="user" /><span>Login</span></Link>
        </div>
      </div>
    </header>
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="shop-title"><Image src="/images/ecommerce/wedding-essentials-banner.webp" alt="Blush drapes, flowers and gold lights at an elegant wedding ceremony" fill sizes="100vw" preload className={styles.heroImage} /><div className={styles.heroCopy}><span className={styles.heroKicker}>SHOP THE WEDDING COLLECTION</span><h1 id="shop-title">Wedding Essentials</h1><p>Decor &middot; Gifts &middot; Accessories &middot; Personalized &amp; More</p><a href="#shop-collections" className={styles.heroCta}>Shop Now <span aria-hidden="true">&rarr;</span></a></div></section>
      {showDiwaliOffer && <section className={styles.diwaliOffer} aria-labelledby="diwali-offer-title"><Image src="/images/ecommerce/diwali-banner.webp" alt="Gold gift boxes and glowing diyas for Diwali" fill sizes="100vw" className={styles.diwaliOfferImage} /><div className={styles.diwaliOfferCopy}><span>CELEBRATE THE FESTIVAL OF LIGHTS</span><h2 id="diwali-offer-title">Diwali Festive Offers</h2><p>Light up your celebrations with gifts, decor &amp; more.</p><a href="#shop-collections">Explore Diwali Offers <span aria-hidden="true">&rarr;</span></a></div><button type="button" className={styles.diwaliOfferClose} aria-label="Dismiss Diwali offer banner" onClick={() => setShowDiwaliOffer(false)}><ShopIcon name="close" size={17} /></button></section>}
      <nav id="shop-collections" className={styles.categories} aria-label="Product categories">{shopCategories.map((category) => <button key={category.id} aria-pressed={category.id === 'all' ? !selectedCategories.length : category.ids.length === selectedCategories.length && category.ids.every((id) => selectedCategories.includes(id))} onClick={() => { setSelectedCategories(category.ids); setWishlistOnly(false); }}>{category.image ? <Image src={`/images/ecommerce/${category.image}.webp`} alt="" width={64} height={52} /> : <ShopIcon name={category.icon} size={20} />}<span>{category.name}</span></button>)}</nav>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">&rsaquo;</span><span aria-current="page">Shop</span></nav>
      <div className={styles.catalog}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`} aria-label="Product filters">
          <div className={styles.filterHeading}><h2>Filters</h2><button onClick={clearFilters}>Clear All</button></div>
          <FilterGroup title="Category">{shopCategories.slice(1).map((category) => <label key={category.id}><input type="checkbox" checked={category.ids.every((id) => selectedCategories.includes(id))} onChange={() => setSelectedCategories(category.ids.every((id) => selectedCategories.includes(id)) ? selectedCategories.filter((id) => !category.ids.includes(id)) : [...new Set([...selectedCategories, ...category.ids])])} /><span>{category.name} <small>({products.filter((item) => category.ids.includes(item.category)).length})</small></span></label>)}</FilterGroup>
          <FilterGroup title="Price Range"><div className={styles.priceRange}><span aria-hidden="true" /><input aria-label="Maximum price" type="range" min="500" max="50000" step="1" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} style={{ '--range-progress': `${(maxPrice - 500) / 495}%` }} /></div><div className={styles.priceInputs}><span>&#8377;500</span><label><span className={styles.srOnly}>Maximum price in rupees</span><span aria-hidden="true">&#8377;</span><input type="number" min="500" max="50000" value={maxPrice} onChange={(event) => setMaxPrice(Math.min(50000, Math.max(500, Number(event.target.value) || 500)))} /></label></div></FilterGroup>
          <FilterGroup title="Rating">{[4.5, 4, 3.5].map((value) => <label key={value}><input type="checkbox" checked={rating === value} onChange={() => setRating(rating === value ? 0 : value)} /><span><span className={styles.star}>★</span> {value.toFixed(1)} & Above <small>({products.filter((item) => item.rating >= value).length})</small></span></label>)}</FilterGroup>
          <FilterGroup title="Availability">{[['in-stock', 'In Stock'], ['pre-order', 'Pre-Order']].map(([value, label]) => <label key={value}><input type="checkbox" checked={availability.includes(value)} onChange={() => setAvailability(toggle(availability, value))} /><span>{label} <small>({products.filter((item) => item.stock === value).length})</small></span></label>)}</FilterGroup>
        </aside>
        <section className={styles.results} aria-label="Wedding products">
          <div className={styles.toolbar}><h2>Shop All Products</h2><div className={styles.toolbarActions}><button className={styles.filterToggle} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><ShopIcon name="filter" size={18} />Filters</button><div className={styles.viewToggle}><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><ShopIcon name="grid" size={20} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><ShopIcon name="list" size={20} /></button></div></div></div>
          <div className={`${styles.products} ${view === 'list' ? styles.listView : ''}`}>{filtered.map((item, index) => <ProductCard key={item.id} item={item} index={index} view={view} saved={wishlist.includes(item.id)} onSave={toggleWishlist} onAdd={addToCart} onOpen={openProduct} />)}</div>
          {!filtered.length && <div className={styles.empty}><ShopIcon name={wishlistOnly ? 'heart' : 'search'} size={40} /><h3>{wishlistOnly ? 'Your wishlist is waiting for a little love' : 'No perfect match just yet'}</h3><p>{wishlistOnly ? 'Tap the heart on a product to save your favourites.' : 'Try a different search or clear your filters.'}</p><button onClick={clearFilters}>Explore all products</button></div>}
          <p className={styles.demoNote}>A little inspiration for your big day. This is a sample collection; checkout is not available yet.</p>
        </section>
      </div>
    </main>
    <footer className={styles.footer}><Link href="/">Epic Wedz</Link><nav aria-label="Footer navigation"><Link href="/about-us">About Us</Link><Link href="/contact-us">Contact Us</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms & Conditions</Link></nav><small>&copy; {new Date().getFullYear()} Epic Wedz. All rights reserved.</small></footer>
    <Drawer anchor="right" disableScrollLock open={drawerOpen} transitionDuration={{ enter: 380, exit: 280 }} onClose={() => setDrawerOpen(false)} slotProps={{ transition: { easing: { enter: 'cubic-bezier(0.22, 1, 0.36, 1)', exit: 'cubic-bezier(0.4, 0, 0.2, 1)' } }, paper: { className: styles.drawerPaper, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'shop-dialog-title' } }}><DialogTitle id="shop-dialog-title" component="div" className={styles.dialogTitle}><h2>{dialog === 'cart' ? `Your Cart (${cartCount})` : dialog === 'wishlist' ? `My Wishlist (${wishlist.length})` : dialog === 'product' ? 'Product Details' : 'Track Your Order'}</h2><IconButton aria-label="Close dialog" onClick={() => setDrawerOpen(false)}><ShopIcon name="close" /></IconButton></DialogTitle><DialogContent>
      {dialog === 'wishlist' ? <>
        {wishlistItems.length ? <ul className={styles.cartList}>{wishlistItems.map((item) => <li key={item.id}>
          <button type="button" onClick={() => openProduct(item)} aria-label={`View ${item.name}`}><Image src={item.image} alt={item.name} width={78} height={70} /></button>
          <div className={styles.wishlistItem}>
            <h3><button type="button" onClick={() => openProduct(item)}>{item.name}</button></h3>
            <p>{formatPrice(item.price)}</p>
            <div className={styles.wishlistActions}>
              <button type="button" className={styles.addButton} onClick={() => addToCart(item)}>Add to Cart</button>
              <button type="button" onClick={() => toggleWishlist(item.id)} aria-label={`Remove ${item.name} from wishlist`}>Remove</button>
            </div>
          </div>
        </li>)}</ul> : <div className={styles.empty}><ShopIcon name="heart" size={40} /><h3>Your wishlist is empty</h3><p>Tap the heart on a product to save your favourites.</p></div>}
        <button type="button" className={styles.continueButton} onClick={() => setDrawerOpen(false)}>Continue Shopping</button>
      </> : dialog === 'product' && selectedProduct ? <div className={styles.productDetails}>
        <Image src={selectedProduct.image} alt={selectedProduct.name} width={720} height={540} sizes="(max-width: 600px) 100vw, 600px" />
        <h3>{selectedProduct.name}</h3><p className={styles.rating}><span className={styles.star}>&#9733;</span> {selectedProduct.rating.toFixed(1)} ({selectedProduct.reviews} reviews)</p>
        <div className={styles.price}><strong>{formatPrice(selectedProduct.price)}</strong><del>{formatPrice(selectedProduct.originalPrice)}</del><span>{Math.round((1 - selectedProduct.price / selectedProduct.originalPrice) * 100)}% Off</span></div>
        <p>{categories.find((category) => category.id === selectedProduct.category)?.name}</p><p>{selectedProduct.stock === 'pre-order' ? 'Available for pre-order' : 'In stock'}</p>
        <button className={styles.continueButton} onClick={() => addToCart(selectedProduct)}>Add to Cart</button>
      </div> : dialog === 'cart' ? <>{cartItems.length ? <><ul className={styles.cartList}>{cartItems.map((item) => <li key={item.id}><Image src={item.image} alt={item.name} width={78} height={70} /><div><h3>{item.name}</h3><p>{formatPrice(item.price)}</p><div className={styles.quantity}><button aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, cart[item.id] - 1)}>−</button><span>{cart[item.id]}</span><button aria-label={`Increase ${item.name} quantity`} disabled={cart[item.id] >= 99} onClick={() => updateQuantity(item.id, cart[item.id] + 1)}>+</button><button onClick={() => updateQuantity(item.id, 0)}>Remove</button></div></div></li>)}</ul><div className={styles.cartTotal}><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div><p className={styles.cartNote}>Your sample cart is saved on this device. Online checkout is coming soon.</p></> : <div className={styles.empty}><ShopIcon name="cart" size={40} /><h3>Your cart is empty</h3><p>Add something beautiful for your celebration.</p></div>}<button className={styles.continueButton} onClick={() => setDrawerOpen(false)}>Continue Shopping</button></> : <div className={styles.empty}><ShopIcon name="box" size={40} /><h3>No orders to track yet</h3><p>This shop is a preview collection. Order tracking will be available when checkout launches.</p></div>}
    </DialogContent></Drawer>
  </div>;
}
