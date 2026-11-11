export const shopPanelSlugs = {
  'Shop Overview': 'shop-management',
  'Add Category': 'shop-add-category',
  'Category List': 'shop-categories',
  'Add Subcategory': 'shop-add-subcategory',
  'Subcategory List': 'shop-subcategories',
  'Shop Products': 'shop-products',
  'Shop Orders': 'shop-orders',
};

export const shopDashboardMenu = [
  { label: 'Shop Overview', icon: 'dashboard', sub: [] },
  { label: 'Categories', icon: 'store', sub: ['Add Category', 'Category List', 'Add Subcategory', 'Subcategory List'] },
  { label: 'Shop Products', icon: 'store', sub: [] },
  { label: 'Shop Orders', icon: 'calendar', sub: [] },
];

export const shopPanelLabel = (label) => ({ 'Shop Overview': 'Dashboard', 'Shop Products': 'Products', 'Shop Orders': 'Orders' })[label] || label;
export const isShopPanelSlug = (slug) => Object.values(shopPanelSlugs).includes(slug);

const shopSegments = {
  'shop-management': '',
  'shop-add-category': 'add-category',
  'shop-categories': 'categories',
  'shop-add-subcategory': 'add-subcategory',
  'shop-subcategories': 'subcategories',
  'shop-products': 'products',
  'shop-orders': 'orders',
};

export function shopPanelPath(panel) {
  const segment = shopSegments[shopPanelSlugs[panel]];
  return segment === undefined ? null : segment ? `/${segment}` : '/dashboard/shop';
}

export function shopSlugFromSegments(segments = []) {
  if (!Array.isArray(segments) || segments.length > 1) return null;
  const segment = segments.join('/');
  return Object.keys(shopSegments).find((slug) => shopSegments[slug] === segment) || null;
}
