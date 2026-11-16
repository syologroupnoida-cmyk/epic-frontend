import Image from 'next/image';
import { useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { ecommerceVariantId } from '@/util/ecommerceProducts.mjs';
import { primaryClass, productSelectSlotProps } from './ProductControls';
import styles from './ProductDetailView.module.css';

const money = (value) => value != null && Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) / 100) : '—';
const fieldLabel = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
const quantity = (variant) => {
  const value = variant?.stockQuantity ?? variant?.availableStock ?? variant?.inventory?.availableStock ?? variant?.stock;
  return ['number', 'string'].includes(typeof value) && String(value).trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
};
const date = (value) => value && Number.isFinite(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '—';
const imageUrl = (item) => {
  const url = typeof item === 'string' ? item : item?.url || item?.imageUrl || item?.secureUrl || item?.src;
  return typeof url === 'string' && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : null;
};
function DetailIcon({ type = 'box' }) {
  const paths = { tag: 'M20 13 11 22 2 13V2h11l9 9-2 2ZM7 7h.01', box: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5', calendar: 'M8 2v4m8-4v4M3 10h18M4 4h16v17H4V4Z', percent: 'M5 19 19 5M7 5h.01M17 19h.01', info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z' };
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type] || paths.box} /></svg>;
}
function Gallery({ product, variant }) {
  const [selected, setSelected] = useState('');
  const [failed, setFailed] = useState([]);
  const source = Array.isArray(variant?.images) && variant.images.length ? variant.images : product.images;
  const images = [...new Set((Array.isArray(source) ? source : []).map(imageUrl).filter(Boolean))].filter((url) => !failed.includes(url));
  const active = images.includes(selected) ? selected : images[0];
  return <div><div className={styles.mainImage}>
    {active ? <Image src={active} alt={product.title} fill unoptimized sizes="(max-width: 700px) 85vw, 360px" onError={() => setFailed((current) => [...current, active])} /> : <div className={styles.placeholder}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="2" /><path d="m3 17 6-6 4 4 3-3 5 5" /></svg><span>No product image available</span></div>}
    {variant?.isDefault && <span className={styles.defaultLabel}><span aria-hidden="true">★</span>Default Variant</span>}
  </div>{images.length > 1 && <div className={styles.thumbnails}>{images.map((url, index) => <button type="button" className={styles.thumbnail} key={url} aria-label={`View product image ${index + 1}`} aria-pressed={active === url} onClick={() => setSelected(url)}><Image src={url} alt="" fill unoptimized sizes="76px" /></button>)}</div>}</div>;
}

export default function ProductDetailView({ product, busy, needsRefresh, stock, onStockChange, onStockSubmit, onPublish }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, variants.findIndex((variant) => variant.isDefault)));
  const selected = variants[selectedIndex] || variants.find((variant) => variant.isDefault) || variants[0];
  const options = Array.isArray(product.optionDefinitions) ? product.optionDefinitions : [...new Set(variants.flatMap((variant) => Object.keys(variant.optionValues || {})))].map((name) => ({ name, values: [...new Set(variants.map((variant) => variant.optionValues?.[name]).filter(Boolean))] }));
  const specifications = Object.entries(product.specifications || {});
  const disabled = busy || needsRefresh;
  const stockCount = quantity(selected);
  const discount = selected && selected.saleAmountPaise != null && Number(selected.mrpAmountPaise) > 0 && Number(selected.saleAmountPaise) >= 0 && Number(selected.saleAmountPaise) < Number(selected.mrpAmountPaise) ? Math.round((1 - Number(selected.saleAmountPaise) / Number(selected.mrpAmountPaise)) * 100) : 0;
  function selectVariant(index) {
    setSelectedIndex(index);
    const variantId = ecommerceVariantId(variants[index]);
    if (variantId) onStockChange({ ...stock, variantId });
  }
  function selectOption(name, value) {
    let index = variants.findIndex((variant) => variant.optionValues?.[name] === value && options.every((option) => option.name === name || !selected?.optionValues?.[option.name] || variant.optionValues?.[option.name] === selected.optionValues[option.name]));
    if (index < 0) index = variants.findIndex((variant) => variant.optionValues?.[name] === value);
    if (index >= 0) selectVariant(index);
  }
  const facts = [['Brand', product.brandName, 'tag'], ...(product.category?.name ? [['Category', product.category.name, 'box']] : []), ...(product.subcategory?.name ? [['Subcategory', product.subcategory.name, 'box']] : []), ['GST', product.gstPercentage != null ? `${product.gstPercentage}%` : '—', 'percent']];
  const additional = [['Total variants', variants.length, 'info'], ...options.map((option) => [`Available ${option.name.toLowerCase()}`, option.values.join(', '), 'box']), ['Created at', date(product.createdAt), 'calendar'], ['Last updated', date(product.updatedAt), 'calendar']];
  return <div className={styles.view}>
    <div className={styles.top}>
      <div className={styles.column}>
      <article className={`${styles.panel} ${styles.overview}`}>
        <Gallery product={product} variant={selected} />
        <div className={styles.summary}><h2>{product.title}</h2><div className={styles.tags}>{selected?.sku && <span className={styles.tag}>SKU: {selected.sku}</span>}<span className={`${styles.tag} ${stockCount > 0 ? styles.good : ''}`}>{stockCount == null ? 'Stock unavailable' : stockCount > 0 ? `In Stock (${stockCount})` : 'Out of stock'}</span>{product.status && <span className={styles.tag}>{product.status}</span>}</div><p className={styles.description}>{product.description || 'No description provided.'}</p>
          <h3 className="sr-only">Product information</h3><dl className={styles.facts}>{facts.map(([label, value, icon]) => <div key={label} className="contents"><dt><DetailIcon type={icon} />{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
          <div className={styles.pricing}><h3>Pricing (Selected Variant)</h3><div className={styles.prices}><div><small>MRP</small><span className={styles.mrp}>{money(selected?.mrpAmountPaise)}</span></div><div><small>Sale Price</small><strong className={styles.sale}>{money(selected?.saleAmountPaise)}</strong></div>{discount > 0 && <span className={`${styles.tag} ${styles.good}`}>{discount}% OFF</span>}</div></div>
          {product.status === 'DRAFT' && <div className={styles.publish}><button className={primaryClass} disabled={disabled} onClick={onPublish}>{busy ? 'Saving...' : 'Publish product'}</button></div>}
        </div>
      </article>

      </div>
      <div className={styles.column}>

      <article className={styles.panel}><section><h3 className={styles.heading}>Specifications</h3>{specifications.length ? <div className={styles.scroll}><table className={`${styles.table} ${styles.specs}`} aria-label="Product specifications"><tbody>{specifications.map(([key, value]) => <tr key={key}><th scope="row">{fieldLabel(key)}</th><td>{typeof value === 'boolean' ? <span className={`${styles.tag} ${value ? styles.good : ''}`}>{value ? 'Yes' : 'No'}</span> : typeof value === 'object' ? JSON.stringify(value) : String(value)}</td></tr>)}</tbody></table></div> : <p className={styles.empty}>No specifications provided.</p>}</section>
      <section className={styles.additional}><h3 className={styles.heading}>Options</h3>{options.length ? <div className={styles.options}>{options.map((option) => <div className={styles.optionRow} key={option.name}><div className={styles.optionName}>{option.name}</div><div className={styles.optionValues}>{option.values.map((value) => <button key={value} className={styles.chip} type="button" disabled={busy || !variants.some((variant) => variant.optionValues?.[option.name] === value)} aria-pressed={selected?.optionValues?.[option.name] === value} onClick={() => selectOption(option.name, value)}>{value}</button>)}</div></div>)}</div> : <p className={styles.empty}>No product options defined.</p>}</section>
      <section className={styles.additional}><h3 className={styles.heading}>Additional Information</h3><dl className={styles.info}>{additional.map(([label, value, icon]) => <div className="contents" key={label}><dt><DetailIcon type={icon} />{label}</dt><dd>{value}</dd></div>)}</dl></section></article>
      </div>
    </div>
      <article className={styles.panel}><h3 className={styles.heading}>Product variants ({variants.length})</h3><div className={styles.scroll}><table className={`${styles.table} ${styles.variants}`} aria-label="Product variants"><thead><tr><th>SKU</th>{options.map((option) => <th key={option.name}>{option.name}</th>)}{['MRP', 'Sale Price', 'Stock', 'Default'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{variants.map((variant, index) => <tr key={ecommerceVariantId(variant) || index} className={selected === variant ? styles.selected : undefined}><td><button type="button" disabled={busy} className={styles.variantButton} aria-pressed={selected === variant} onClick={() => selectVariant(index)}>{variant.sku || `Variant ${index + 1}`}</button></td>{options.map((option) => <td key={option.name}>{variant.optionValues?.[option.name] || '—'}</td>)}<td>{money(variant.mrpAmountPaise)}</td><td><strong>{money(variant.saleAmountPaise)}</strong></td><td>{quantity(variant) ?? '—'}</td><td>{variant.isDefault ? <span className={styles.check} aria-label="Default variant">✓</span> : '—'}</td></tr>)}</tbody></table></div>{!variants.length && <p className={styles.empty}>No variants returned for this product.</p>}
      </article>
    <article className={`${styles.panel} ${styles.inventory}`}><h3 className={styles.heading}>Inventory adjustment</h3><p className={styles.hint}>Record received stock for a product variant.</p><form onSubmit={onStockSubmit}><fieldset disabled={disabled}><legend className="sr-only">Adjust variant stock</legend><div className={styles.fields}>
      <TextField select slotProps={productSelectSlotProps} required fullWidth size="small" label="Variant" disabled={disabled} value={stock.variantId} onChange={(event) => onStockChange({ ...stock, variantId: event.target.value })}><MenuItem value="">Choose variant</MenuItem>{variants.filter((variant) => ecommerceVariantId(variant)).map((variant) => <MenuItem key={ecommerceVariantId(variant)} value={ecommerceVariantId(variant)}>{variant.sku}</MenuItem>)}</TextField>
      <TextField select slotProps={productSelectSlotProps} fullWidth size="small" label="Adjustment type" disabled={disabled} value={stock.type} onChange={(event) => onStockChange({ ...stock, type: event.target.value })}><MenuItem value="STOCK_RECEIVED">Stock received</MenuItem></TextField>
      <TextField required fullWidth size="small" label="Quantity received" disabled={disabled} type="number" slotProps={{ htmlInput: { min: 1, step: 1 } }} value={stock.quantity} onChange={(event) => onStockChange({ ...stock, quantity: event.target.value })} />
      <TextField required fullWidth size="small" className={styles.note} label="Note" disabled={disabled} multiline minRows={2} value={stock.note} onChange={(event) => onStockChange({ ...stock, note: event.target.value })} />
    </div><div className={styles.footer}><button type="submit" disabled={disabled || !variants.some((variant) => ecommerceVariantId(variant))} className={primaryClass}>{busy ? 'Saving...' : 'Save stock adjustment'}</button></div></fieldset></form></article>
  </div>;
}
