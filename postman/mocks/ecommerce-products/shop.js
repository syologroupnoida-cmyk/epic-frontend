// Synthetic populated catalog; live list/category envelopes were observed read-only.
const categories = [{ id: 'bridal & category', name: 'Bridal Wear', slug: 'bridal-wear' }, { id: 'groom-category', name: 'Groom Wear', slug: 'groom-wear' }];
const subcategories = [{ id: 'lehenga & subcategory', categoryId: categories[0].id, name: 'Bridal Lehenga' }, { id: 'saree-subcategory', categoryId: categories[0].id, name: 'Bridal Saree' }, { id: 'sherwani-subcategory', categoryId: categories[1].id, name: 'Sherwani' }];
const products = Array.from({ length: 25 }, (_, index) => ({ id: `shop-${index}`, slug: index === 0 ? 'royal-bridal-lehenga' : `product-${index}`, title: index === 0 ? 'Royal Bridal Lehenga' : `Product ${index}`, description: 'Silk bridal wear.', brandName: 'Epic Collection', category: categories[index < 20 ? 0 : 1], subcategoryId: subcategories[index < 10 ? 0 : index < 20 ? 1 : 2].id, specifications: { fabric: 'Silk', blouseIncluded: true }, optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }, { name: 'Size', values: ['M', 'L'] }], images: [], variants: [{ id: `shop-variant-${index}`, sku: `LEH-${index}`, optionValues: { Color: 'Red', Size: 'M' }, mrpAmountPaise: 1599000, saleAmountPaise: index === 0 ? 1299000 : 100000 + index * 10000, availableQuantity: 5, inStock: true, isDefault: true, isActive: true }] }));
module.exports = function shop(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/shop/')) return false;
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); return true; };
  const ok = (data) => send(200, { success: true, data });
  if (req.headers.authorization) return send(400, { message: 'Public requests must not include admin credentials.' });
  if (req.method !== 'GET') return send(501, { message: 'Public write not modeled.' });
  if (req.headers['x-test-shop'] === 'unavailable') return send(503, { message: 'Shop unavailable.' });
  if (req.headers['x-test-shop'] === 'invalid') return ok({ products: [{}] });
  if (url.pathname === '/api/v1/shop/categories') return ok({ categories, pagination: { total: 2, hasNextPage: false } });
  if (url.pathname === '/api/v1/shop/subcategories') return ok({ subcategories: subcategories.filter((row) => row.categoryId === url.searchParams.get('categoryId')) });
  if (url.pathname === '/api/v1/shop/products') {
    if ([...url.searchParams.keys()].some((key) => !['page', 'limit', 'categorySlug', 'subcategoryId', 'minPrice', 'maxPrice'].includes(key))) return send(400, { message: 'Unexpected filter.' });
    const page = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit'));
    const filtered = products.filter((row) => (!url.searchParams.get('categorySlug') || row.category.slug === url.searchParams.get('categorySlug')) && (!url.searchParams.get('subcategoryId') || row.subcategoryId === url.searchParams.get('subcategoryId')) && (!url.searchParams.has('minPrice') || row.variants[0].saleAmountPaise >= Number(url.searchParams.get('minPrice'))) && (!url.searchParams.has('maxPrice') || row.variants[0].saleAmountPaise <= Number(url.searchParams.get('maxPrice'))));
    return ok({ products: filtered.slice((page - 1) * limit, page * limit), pagination: { total: filtered.length, hasNextPage: page * limit < filtered.length } });
  }
  if (url.pathname.startsWith('/api/v1/shop/products/')) {
    const slug = decodeURIComponent(url.pathname.slice('/api/v1/shop/products/'.length));
    const product = products.find((row) => row.slug === slug);
    return product ? ok({ product }) : send(404, { message: 'Product not found.' });
  }
  return send(501, { message: 'Endpoint not modeled.' });
};

module.exports.products = products;
