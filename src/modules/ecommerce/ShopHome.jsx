import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Checkbox, Slider, TextField } from '@mui/material';
import ShopIcon from './components/ShopIcon';
import ShopPublicHeader from './components/ShopPublicHeader';
import ProductCard from './components/ProductCard';
import useShopCollections from './components/useShopCollections';
import { fetchShopCategories, fetchShopProducts, fetchShopSubcategories, ShopApi, shopCategoryId, shopError, shopPriceToPaise, shopProductId, shopProductParams, shopSubcategoryId, shopMoney } from '@/util/shopCatalog.mjs';
import styles from './ShopHome.module.css';

export default function ShopHome({ initialFilters = {} }) {
  const [filters, setFilters] = useState(() => ({ categorySlug: '', subcategoryId: '', minPrice: '', maxPrice: '', page: 1, limit: 20, ...initialFilters }));
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [subLoading, setSubLoading] = useState(Boolean(initialFilters.categorySlug));
  const [subError, setSubError] = useState('');
  const [result, setResult] = useState({ items: [], total: -1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { wishlist, toggleWishlist } = useShopCollections();
  const [prices, setPrices] = useState({ min: initialFilters.minPrice === undefined ? '' : String(initialFilters.minPrice / 100), max: initialFilters.maxPrice === undefined ? '' : String(initialFilters.maxPrice / 100) });
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchShopCategories(ShopApi, { signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setCategories(items); }).catch((err) => { if (!controller.signal.aborted) setCategoryError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setCategoryLoading(false); });
    return () => controller.abort();
  }, [optionsRetry]);
  const selectedCategory = categories.find((category) => category.slug === filters.categorySlug);
  const categoryId = selectedCategory ? shopCategoryId(selectedCategory) : '';
  useEffect(() => {
    if (!categoryId) return;
    const controller = new AbortController();
    fetchShopSubcategories(ShopApi, categoryId, { signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setSubcategories(items); }).catch((err) => { if (!controller.signal.aborted) setSubError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setSubLoading(false); });
    return () => controller.abort();
  }, [categoryId, optionsRetry]);
  useEffect(() => {
    const controller = new AbortController();
    fetchShopProducts(ShopApi, { ...filters, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setResult(data); } }).catch((err) => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, retry]);
  function changeFilters(changes) { setLoading(true); setError(''); setFilters((current) => ({ ...current, page: 1, ...changes })); }
  function chooseCategory(slug) { if (slug !== filters.categorySlug) { setSubcategories([]); setSubError(''); setSubLoading(Boolean(slug)); } changeFilters({ categorySlug: slug, subcategoryId: '' }); }
  function clearFilters() { setSearch(''); setPrices({ min: '', max: '' }); setPriceError(''); setSubcategories([]); setSubError(''); setSubLoading(false); changeFilters({ categorySlug: '', subcategoryId: '', minPrice: '', maxPrice: '' }); }
  const priceCeiling = Math.max(100000, Number(prices.min) || 0, Number(prices.max) || 0, Number(initialFilters.maxPrice || 0) / 100);
  const lowerPrice = Math.max(0, Math.min(Number(prices.min) || 0, priceCeiling));
  const upperPrice = prices.max === '' ? priceCeiling : Math.max(0, Math.min(Number(prices.max) || 0, priceCeiling));
  const priceRange = [Math.min(lowerPrice, upperPrice), Math.max(lowerPrice, upperPrice)];
  function rangePrices(range) { return { min: String(range[0]), max: range[1] === priceCeiling ? '' : String(range[1]) }; }
  function applyPriceValues(next) {
    try { const minPrice = shopPriceToPaise(next.min); const maxPrice = shopPriceToPaise(next.max); shopProductParams({ minPrice, maxPrice }); setPriceError(''); changeFilters({ minPrice, maxPrice }); }
    catch (err) { setPriceError(shopError(err)); }
  }
  const rows = result.items.filter((product) => `${product.title} ${product.brandName || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className={styles.shop}>
    <Head><title>Wedding Shop | Epic Collection</title><meta name="description" content="Browse the Epic wedding collection, bridal wear, gifts and accessories." /></Head>
    <ShopPublicHeader />
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="shop-title"><Image src="/images/ecommerce/wedding-essentials-banner.webp" alt="Wedding flowers and golden lights" fill sizes="100vw" preload className={styles.heroImage} /><div className={styles.heroCopy}><span className={styles.heroKicker}>SHOP THE WEDDING COLLECTION</span><h1 id="shop-title">Wedding Essentials</h1><p>Find something beautiful for your celebration.</p><a href="#shop-collections" className={styles.heroCta}>Explore the collection <span aria-hidden="true">&rarr;</span></a></div></section>
      <nav id="shop-collections" className={styles.categories} aria-label="Product categories"><button aria-pressed={!filters.categorySlug} onClick={() => chooseCategory('')}><ShopIcon name="grid" size={20} /><span>All Products</span></button>{categories.map((category) => <button key={shopCategoryId(category)} aria-pressed={filters.categorySlug === category.slug} onClick={() => chooseCategory(category.slug)}><ShopIcon name="box" size={20} /><span>{category.name}</span></button>)}</nav>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>&rsaquo;</span><span>Shop</span></nav>
      <div className={styles.catalog}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`} aria-label="Product filters"><div className={styles.filterHeading}><h2>Filters</h2><button type="button" onClick={clearFilters}>Clear All</button></div>
          <section className={styles.filterGroup} aria-label="Price filter"><h3 className={styles.filterTitle}>Price range</h3>
            <div className={styles.priceSlider}><Slider min={0} max={priceCeiling} step={100} value={priceRange} disableSwap getAriaLabel={(index) => index === 0 ? 'Minimum price' : 'Maximum price'} getAriaValueText={(value) => value === priceCeiling ? 'Any price' : shopMoney(Math.round(value * 100))} valueLabelDisplay="auto" valueLabelFormat={(value) => value === priceCeiling ? 'Any price' : shopMoney(Math.round(value * 100))} onChange={(_, range) => setPrices(rangePrices(range))} onChangeCommitted={(_, range) => applyPriceValues(rangePrices(range))} sx={{ color: '#a4002b', '& .MuiSlider-thumb': { width: 14, height: 14 } }} /></div>
            <div className={styles.priceLabels}><span>{shopMoney(Math.round(priceRange[0] * 100))}</span><span>{prices.max === '' ? 'Any price' : shopMoney(Math.round(priceRange[1] * 100))}</span></div>
            {priceError && <p role="alert" className={styles.filterHint}>{priceError}</p>}
          </section>
          <section className={styles.filterGroup}><h3 className={styles.filterTitle}>Categories</h3>{categoryLoading ? <p role="status" className={styles.filterHint}>Loading categories...</p> : categoryError ? <div role="alert" className={styles.filterHint}><p>{categoryError}</p><button type="button" onClick={() => { setCategoryLoading(true); setCategoryError(''); setOptionsRetry((value) => value + 1); }}>Try again</button></div> : <>
            <label className={styles.categoryLabel}><Checkbox size="small" checked={!filters.categorySlug} onChange={() => chooseCategory('')} sx={{ p: .5, color: '#ba9aa5', '&.Mui-checked': { color: '#a4002b' } }} /><span>All products</span></label>
            {categories.map((category) => <div key={shopCategoryId(category)}>
              <label className={styles.categoryLabel}><Checkbox size="small" checked={filters.categorySlug === category.slug} onChange={(_, checked) => chooseCategory(checked ? category.slug : '')} sx={{ p: .5, color: '#ba9aa5', '&.Mui-checked': { color: '#a4002b' } }} /><span>{category.name}</span><span className={styles.categoryChevron} aria-hidden="true">{filters.categorySlug === category.slug ? '\u2304' : '\u203a'}</span></label>
              {filters.categorySlug === category.slug && <div className={styles.subcategory} role="group" aria-label={`${category.name} subcategories`}>
                {subLoading ? <p role="status" className={styles.filterHint}>Loading subcategories...</p> : subError ? <div role="alert" className={styles.filterHint}><p>{subError}</p><button type="button" onClick={() => { setSubLoading(true); setSubError(''); setOptionsRetry((value) => value + 1); }}>Retry subcategories</button></div> : !subcategories.length ? <p className={styles.filterHint}>No subcategories available.</p> : subcategories.map((row) => <label key={shopSubcategoryId(row)}><Checkbox size="small" checked={filters.subcategoryId === shopSubcategoryId(row)} onChange={(_, checked) => changeFilters({ subcategoryId: checked ? shopSubcategoryId(row) : '' })} sx={{ p: .5, color: '#ba9aa5', '&.Mui-checked': { color: '#a4002b' } }} /><span>{row.name}</span></label>)}
              </div>}
            </div>)}
          </>}</section>
        </aside>
        <section className={styles.results} aria-label="Wedding products"><div className={styles.toolbar}><div><h2>{selectedCategory?.name || 'Shop All Products'}</h2>{!loading && !error && <p className={styles.filterHint}>{result.total >= 0 ? `${result.total} products` : 'Browse the collection'}</p>}</div><div className={styles.toolbarActions}><button className={styles.filterToggle} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><ShopIcon name="filter" size={18} />Filters</button><div className={styles.viewToggle}><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><ShopIcon name="grid" size={20} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><ShopIcon name="list" size={20} /></button></div></div></div>
          <TextField fullWidth size="small" type="search" label="Search products on this page" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 2 }} />
          {loading ? <div role="status" className={styles.empty}>Loading products...</div> : error ? <div role="alert" className={styles.empty}><h3>Products could not be loaded</h3><p>{error}</p><button onClick={() => { setLoading(true); setError(''); setRetry((value) => value + 1); }}>Try again</button></div> : <><div className={`${styles.products} ${view === 'list' ? styles.listView : ''}`}>{rows.map((product, index) => <ProductCard key={shopProductId(product)} product={product} index={index} view={view} saved={wishlist.some((row) => row.id === shopProductId(product))} onSave={toggleWishlist} />)}</div>{!rows.length && <div className={styles.empty}><ShopIcon name="search" size={36} /><h3>{search ? 'No products match on this page' : 'No products found'}</h3><p>Try another category or adjust your filters.</p><button onClick={clearFilters}>Clear filters</button></div>}</>}
          <div className={styles.pagination}><button disabled={loading || filters.page <= 1} onClick={() => changeFilters({ page: filters.page - 1 })}>Previous</button><span>Page {filters.page}</span><button disabled={loading || Boolean(error) || !result.hasNext} onClick={() => changeFilters({ page: filters.page + 1 })}>Next</button></div>
        </section>
      </div>
    </main>
    <footer className={styles.footer}><Link href="/shop">Epic Collection</Link><nav aria-label="Footer navigation"><Link href="/contact-us">Contact Us</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></nav></footer>
  </div>;
}
