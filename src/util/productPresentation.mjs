export const productColorPalette = { Red: '#dc2626', Maroon: '#800020', Pink: '#ec4899', Orange: '#f97316', Yellow: '#eab308', Green: '#16a34a', Teal: '#0d9488', Blue: '#2563eb', Purple: '#9333ea', Black: '#171717', White: '#ffffff', Ivory: '#fffff0', Beige: '#d6c5aa', Brown: '#92400e', Grey: '#94a3b8', Gold: '#d4af37' };
export const isColorOption = (name) => /^(color|colour)$/i.test(String(name).trim());
export const isSizeOption = (name) => /^size$/i.test(String(name).trim());
export function productColorHex(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  return Object.entries(productColorPalette).find(([name]) => name.toLowerCase() === String(value).toLowerCase())?.[1] || '#94a3b8';
}
export const imageDescriptionFromFilename = (filename = '') => String(filename).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Product image';
export function productEditorImages(product) {
  const images = [product?.images, product?.productImages, product?.ecommerceProductImages].find(value => Array.isArray(value) && value.length) || [];
  return images.flatMap((value, index) => {
    const row = typeof value === 'string' ? { url: value } : value;
    if (!row || typeof row !== 'object') return [];
    const asset = row.image && typeof row.image === 'object' ? row.image : {};
    const url = [row.url, row.imageUrl, row.secureUrl, row.secure_url, asset.url, asset.secure_url].find(value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)));
    if (!url) return [];
    const filename = url.split('/').at(-1).split('?')[0] || 'Product image';
    return [{ ...asset, ...row, url, publicId: row.publicId || row.public_id || asset.publicId || asset.public_id || '', key: `saved-${row.id || row.ecommerceProductImageId || index}`, filename, altText: row.altText || row.alt || asset.altText || imageDescriptionFromFilename(filename), sortOrder: row.sortOrder ?? index + 1, attached: true, status: 'attached' }];
  });
}
export function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100; const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => { const k = (n + hue / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
const numeric = (value) => value != null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
export function productTableSummary(product) {
  const variants = Array.isArray(product.variants) ? product.variants : null;
  const primary = product.defaultVariant || variants?.find((variant) => variant.isDefault) || variants?.[0];
  const amount = numeric(product.saleAmountPaise ?? primary?.saleAmountPaise);
  const quantities = variants?.map((variant) => numeric(variant.stockQuantity ?? variant.availableStock ?? variant.inventory?.availableStock ?? variant.stock));
  const stock = numeric(product.totalStock) ?? (quantities?.length && quantities.every((value) => value != null) ? quantities.reduce((sum, value) => sum + value, 0) : null);
  const created = product.createdAt && Number.isFinite(new Date(product.createdAt).getTime()) ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(product.createdAt)) : '—';
  return { price: amount == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / 100), variantCount: numeric(product.variantCount ?? product._count?.variants) ?? variants?.length ?? '—', stock: stock ?? '—', created };
}

export function productEditorValues(product) {
  const relatedId = (value, field) => typeof value === 'string' ? value : value?.[field] || value?.id || value?._id || '';
  return { categoryId: relatedId(product.categoryId || product.category, 'ecommerceCategoryId'), subcategoryId: relatedId(product.subcategoryId || product.subcategory, 'ecommerceSubcategoryId'), title: product.title || '', description: product.description || '', brandName: product.brandName || '', gstPercentage: product.gstPercentage ?? '', specifications: structuredClone(product.specifications || {}), optionDefinitions: structuredClone(product.optionDefinitions || []) };
}
