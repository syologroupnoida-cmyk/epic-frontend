export const shopPanelSlugs = {
  'Shop Overview': 'shop-management',
  'Add Category': 'shop-add-category',
  'Category List': 'shop-categories',
  'Add Subcategory': 'shop-add-subcategory',
  'Subcategory List': 'shop-subcategories',
  'Add Product': 'shop-add-product',
  'Product List': 'shop-products',
  'Inventory List': 'shop-inventory',
  'Low-stock Variants': 'shop-low-stock',
  'Shop Orders': 'shop-orders',
};

export const shopDashboardMenu = [
  { label: 'Shop Overview', icon: 'dashboard', sub: [] },
  { label: 'Categories', icon: 'store', sub: ['Add Category', 'Category List', 'Add Subcategory', 'Subcategory List'] },
  { label: 'Products', icon: 'store', sub: ['Add Product', 'Product List'] },
  { label: 'Inventory Management', icon: 'store', sub: ['Inventory List', 'Low-stock Variants'] },
  { label: 'Order', icon: 'store', sub: ['Shop Orders'] },
];

export const shopPanelLabel = (label) => ({ 'Shop Overview': 'Dashboard', 'Shop Orders': 'All orders' })[label] || label;
export const isShopPanelSlug = (slug) => Object.values(shopPanelSlugs).includes(slug);

const shopSegments = {
  'shop-management': '',
  'shop-add-category': 'add-category',
  'shop-categories': 'categories',
  'shop-add-subcategory': 'add-subcategory',
  'shop-subcategories': 'subcategories',
  'shop-products': 'product-list',
  'shop-add-product': 'add-product',
  'shop-inventory': 'inventory',
  'shop-low-stock': 'low-stock-variants',
  'shop-orders': 'orders',
};

export function shopPanelPath(panel) {
  const segment = shopSegments[shopPanelSlugs[panel]];
  return segment === undefined ? null : segment ? `/${segment}` : '/dashboard/shop';
}

export function shopSlugFromSegments(segments = []) {
  if (!Array.isArray(segments) || segments.length > 1) return null;
  const segment = segments.join('/');
  if (segment === 'products') return 'shop-products';
  return Object.keys(shopSegments).find((slug) => shopSegments[slug] === segment) || null;
}
