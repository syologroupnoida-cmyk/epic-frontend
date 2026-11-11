export const categories = [
  { id: 'all', name: 'All Products', icon: 'grid' },
  { id: 'invites', name: 'Wedding Invites', icon: 'invites' },
  { id: 'return-gifts', name: 'Return Gifts', icon: 'gift' },
  { id: 'decor', name: 'Décor & Styling', icon: 'flower' },
  { id: 'bride', name: 'Bride Essentials', icon: 'bride' },
  { id: 'groom', name: 'Groom Essentials', icon: 'groom' },
  { id: 'jewellery', name: 'Jewellery & Accessories', icon: 'necklace' },
  { id: 'personalized', name: 'Personalized Gifts', icon: 'mug' },
  { id: 'hampers', name: 'Hampers & Gifts', icon: 'gift' },
];

const product = (id, name, category, image, price, originalPrice, rating, reviews, stock = 'in-stock') => ({ id, name, category, image: `/images/ecommerce/${image}.webp`, price, originalPrice, rating, reviews, stock });

export const products = [
  product('decor-lanterns', 'Decorative Lantern Set (3 Pcs)', 'decor', 'lanterns', 1499, 1999, 4.8, 326),
  product('hamper-1', 'Personalized Wedding Hamper', 'personalized', 'hamper', 2299, 2999, 4.9, 121),
  product('jewellery-1', 'Bridal Necklace Set', 'jewellery', 'necklace', 7499, 9999, 4.8, 156),
  product('invites-1', 'Premium Wedding Invites', 'invites', 'invites', 1999, 2499, 4.8, 142),
  product('gifts-1', 'Wedding Return Gift Boxes', 'return-gifts', 'return-gifts', 499, 699, 4.7, 89),
  product('decor-1', 'Wedding Décor Backdrop', 'decor', 'decor', 24999, 29999, 4.9, 214, 'pre-order'),
  product('bride-1', 'Bridal Lehenga (Designer)', 'bride', 'lehenga', 49999, 59999, 4.7, 98),
  product('groom-1', 'Groom Sherwani Set', 'groom', 'sherwani', 14999, 18999, 4.8, 76),
  product('jewellery-2', 'Bride Hair Accessories Set', 'jewellery', 'hair-accessories', 899, 1299, 4.6, 67),
  product('invites-2', 'Royal Gold Invitation Suite', 'invites', 'invites', 2499, 3299, 4.9, 84, 'pre-order'),
  product('hamper-2', 'Celebration Gift Hamper', 'hampers', 'hamper', 3499, 4499, 4.8, 53),
  product('gifts-2', 'Golden Keepsake Favor Box', 'return-gifts', 'return-gifts', 599, 799, 4.5, 104),
  product('bride-2', 'Floral Bridal Hair Vine', 'bride', 'hair-accessories', 1299, 1799, 4.7, 48),
];

export const formatPrice = (value) => `₹${value.toLocaleString('en-IN')}`;

export function filterProducts(items, { search = '', selectedCategories = [], maxPrice = 50000, rating = 0, availability = [], wishlistOnly = false, wishlist = [], sort = 'popular' } = {}) {
  const filtered = items.filter((item) => (!search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase())) && (!selectedCategories.length || selectedCategories.includes(item.category)) && item.price <= maxPrice && item.rating >= rating && (!availability.length || availability.includes(item.stock)) && (!wishlistOnly || wishlist.includes(item.id)));
  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  return filtered;
}
