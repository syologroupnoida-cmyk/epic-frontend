export function marketplaceRating(item) {
  const value = item.averageRating ?? item.rating;
  return value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
}

export function presentMarketplaceItems(items, { minPrice = 0, maxPrice = null, minRating = 0, sort = 'relevant' } = {}) {
  const filtered = items.filter((item) => {
    if (minRating && (marketplaceRating(item) ?? -1) < minRating) return false;
    if (minPrice > 0 || maxPrice !== null) {
      if (item.startingPrice == null || item.startingPrice === '') return false;
      const price = Number(item.startingPrice);
      if (!Number.isFinite(price) || price < minPrice || (maxPrice !== null && price > maxPrice)) return false;
    }
    return true;
  });
  const price = (item, fallback) => item.startingPrice == null || item.startingPrice === '' || !Number.isFinite(Number(item.startingPrice)) ? fallback : Number(item.startingPrice);
  if (sort === 'price-low') filtered.sort((a, b) => price(a, Infinity) - price(b, Infinity));
  if (sort === 'price-high') filtered.sort((a, b) => price(b, -Infinity) - price(a, -Infinity));
  if (sort === 'rating') filtered.sort((a, b) => (marketplaceRating(b) ?? -1) - (marketplaceRating(a) ?? -1));
  if (sort === 'newest') filtered.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  return filtered;
}
