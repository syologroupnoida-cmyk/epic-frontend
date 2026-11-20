// Request fields follow the user contract; response envelopes/status names are synthetic.
const http = require('http');
const shop = require('./shop');
const customer = require('./customer');
const inventory = require('./inventory');
const adminOrders = require('./orders');
const seed = () => Array.from({ length: 25 }, (_, index) => ({ ecommerceProductId: `product-${index + 1}`, title: `Product ${index + 1}`, description: 'Product description', brandName: 'Epic Collection', categoryId: 'category & one', subcategoryId: 'subcategory & one', gstPercentage: 5, specifications: { fabric: 'Silk', blouseIncluded: true }, optionDefinitions: [], images: [], status: 'DRAFT', variants: [{ ecommerceVariantId: `variant-${index + 1}`, sku: `SKU-${index + 1}`, optionValues: {}, mrpAmountPaise: 1599000, saleAmountPaise: 1299000, stockQuantity: 5, isDefault: true }] }));
const state = typeof pm !== 'undefined' ? pm.state : null;
let fallback = seed();
let fallbackUploads = [];
const key = 'ecommerce-products:rows';
async function read() { if (!state) return fallback; const rows = await state.get(key); if (Array.isArray(rows)) return rows; const initial = seed(); await state.set(key, initial); return initial; }
async function write(rows) { if (state) await state.set(key, rows); else fallback = rows; }
async function uploads() { return state ? (await state.get('ecommerce-products:uploads')) || [] : fallbackUploads; }
async function saveUploads(items) { if (state) await state.set('ecommerce-products:uploads', items); else fallbackUploads = items; }
http.createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    if (await customer(req, res)) return;
    if (shop(req, res)) return;
    if (req.headers.authorization !== 'Bearer ecommerce-product-test-token') return send(401, { message: 'Unauthorized.' });
    if (await inventory(req, res)) return;
    if (await adminOrders(req, res)) return;
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname === '/__reset') { await write(seed()); await saveUploads([]); return send(200, { success: true }); }
    if (req.method === 'POST' && url.pathname === '/api/v1/uploads/image') {
      if (!req.headers['content-type']?.startsWith('multipart/form-data;')) return send(400, { message: 'Expected multipart image upload.' });
      let raw = req.body;
      if (raw == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); raw = Buffer.concat(chunks).toString(); }
      if (Buffer.isBuffer(raw)) raw = raw.toString();
      const valid = typeof raw === 'string' ? raw.includes('ecommerce-product-media') && raw.includes('filename=') && [...raw.matchAll(/Content-Disposition: form-data; name="([^"]+)"/gi)].map((match) => match[1]).sort().join(',') === 'file,purpose' : raw?.purpose === 'ecommerce-product-media' && Boolean(raw.file);
      if (!valid) return send(400, { message: 'Expected purpose ecommerce-product-media and file only.' });
      if (req.headers['x-test-upload'] === 'unavailable') return send(503, { message: 'Upload service unavailable.' });
      if (req.headers['x-test-upload'] === 'invalid') return send(200, { success: true, data: { image: { url: 'https://images.example.test/no-public-id.png' } } });
      const items = await uploads();
      const image = { url: `https://images.example.test/product-${items.length + 1}.png`, publicId: `products/media-${items.length + 1}` };
      items.push(image); await saveUploads(items); return send(201, { success: true, data: { image } });
    }
    const rows = await read();
    const endpoint = '/api/v1/admin/ecommerce/products';
    let body = req.body;
    if (['POST', 'PATCH'].includes(req.method)) {
      if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
      else if (typeof body === 'string') body = JSON.parse(body);
    }
    if (url.pathname === endpoint && req.method === 'GET') {
      if ([...url.searchParams.keys()].some((name) => !['page', 'limit', 'status'].includes(name))) return send(400, { message: 'Unexpected query parameter.' });
      if (req.headers['x-test-response'] === 'invalid') return send(200, { success: true, data: {} });
      const page = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit'));
      if (!Number.isInteger(page) || page < 1 || ![20, 50, 100].includes(limit)) return send(400, { message: 'Invalid pagination.' });
      const filtered = rows.filter((row) => !url.searchParams.get('status') || row.status === url.searchParams.get('status'));
      return send(200, { success: true, data: { products: filtered.slice((page - 1) * limit, page * limit), pagination: { total: filtered.length } } });
    }
    if (url.pathname === endpoint && req.method === 'POST') {
      const keys = 'brandName,categoryId,description,gstPercentage,images,optionDefinitions,specifications,subcategoryId,title,variants';
      if (!body || Object.keys(body).sort().join(',') !== keys || typeof body.gstPercentage !== 'number' || !Array.isArray(body.variants) || !body.variants.length) return send(400, { message: 'Invalid product payload.' });
      for (const variant of body.variants) if (Object.keys(variant).filter(key => key !== 'imageUrl').sort().join(',') !== 'initialStock,isDefault,mrpAmountPaise,optionValues,saleAmountPaise,sku' || (variant.imageUrl !== undefined && (typeof variant.imageUrl !== 'string' || !/^https?:\/\//i.test(variant.imageUrl))) || ![variant.mrpAmountPaise, variant.saleAmountPaise, variant.initialStock].every((value) => Number.isSafeInteger(value) && value >= 0) || typeof variant.isDefault !== 'boolean') return send(400, { message: 'Invalid variant payload.' });
      if (!Array.isArray(body.images) || body.images.some(image => Object.keys(image).sort().join(',') !== 'altText,publicId,sortOrder,url' || !image.altText?.trim() || !image.publicId?.trim() || !/^https?:\/\//i.test(image.url) || !Number.isSafeInteger(image.sortOrder))) return send(400, { message: 'Invalid product images.' });
      if (body.title === 'Unavailable') return send(503, { message: 'Product service unavailable.' });
      if (body.title === 'Rejected') return send(200, { success: false, message: 'Product request rejected.' });
      if (rows.some((row) => row.title === body.title)) return send(409, { message: 'Product already exists.' });
      const id = `created & ${rows.length + 1}`;
      const product = { ...body, ecommerceProductId: id, status: 'DRAFT', variants: body.variants.map(({ initialStock, ...variant }, index) => ({ ...variant, ecommerceVariantId: `${id}-variant-${index + 1}`, stockQuantity: initialStock })) };
      rows.push(product); await write(rows); return send(201, { success: true, data: { product } });
    }
    if (url.pathname.startsWith(`${endpoint}/`)) {
      const segments = url.pathname.slice(endpoint.length + 1).split('/').map(decodeURIComponent);
      const id = segments[0];
      if (id === 'unavailable') return send(503, { message: 'Product service unavailable.' });
      if (id === 'denied') return send(403, { message: 'Access denied.' });
      if (id === 'invalid') return send(200, { success: true, data: { product: null } });
      const product = rows.find((row) => row.ecommerceProductId === id);
      if (!product) return send(404, { message: 'Product not found.' });
      if (segments.length === 1 && req.method === 'GET') return send(200, { success: true, data: { product } });
      if ((segments.length === 1 && req.method === 'PATCH') || (segments[1] === 'archive' && req.method === 'POST')) {
        if (req.headers['x-test-catalog'] === 'unavailable') return send(503, { message: 'Product update unavailable.' });
        if (req.method === 'PATCH') {
          if (Object.keys(body || {}).sort().join(',') !== 'brandName,categoryId,description,gstPercentage,optionDefinitions,specifications,subcategoryId,title' || !body.title?.trim() || !Array.isArray(body.optionDefinitions) || typeof body.gstPercentage !== 'number') return send(400, { message: 'Invalid product update payload.' });
          Object.assign(product, body);
        } else {
          if (Object.keys(body || {}).length) return send(400, { message: 'Archive expects no fields.' });
          product.status = 'ARCHIVED';
        }
        await write(rows);
        if (req.headers['x-test-catalog'] === 'after-write') return send(503, { message: 'Response lost after product update.' });
        return send(200, { success: true, data: { product } });
      }
      if (segments.length === 2 && segments[1] === 'images' && req.method === 'POST') {
        if (Object.keys(body).sort().join(',') !== 'altText,publicId,sortOrder,url' || typeof body.altText !== 'string' || !body.altText.trim() || !Number.isSafeInteger(body.sortOrder) || body.sortOrder < 0 || !(await uploads()).some((image) => image.url === body.url && image.publicId === body.publicId)) return send(400, { message: 'Invalid product image payload.' });
        if (body.altText === 'Unavailable') return send(503, { message: 'Image association unavailable.' });
        if (product.images.some((image) => image.publicId === body.publicId)) return send(409, { message: 'Image already attached.' });
        product.images.push(body); await write(rows); return send(201, { success: true, data: { image: body } });
      }
      if (segments.length === 2 && segments[1] === 'variants' && req.method === 'POST') {
        if (Object.keys(body).sort().join(',') !== 'initialStock,mrpAmountPaise,optionValues,saleAmountPaise,sku' || typeof body.sku !== 'string' || !body.sku.trim() || ![body.mrpAmountPaise, body.saleAmountPaise, body.initialStock].every((value) => Number.isSafeInteger(value) && value >= 0) || body.saleAmountPaise > body.mrpAmountPaise || product.optionDefinitions.some((option) => !option.values.includes(body.optionValues?.[option.name]))) return send(400, { message: 'Invalid live variant payload.' });
        if (body.sku === 'Unavailable') return send(503, { message: 'Variant service unavailable.' });
        if (product.variants.some((variant) => variant.sku.toLowerCase() === body.sku.toLowerCase())) return send(409, { message: 'Variant SKU already exists.' });
        const { initialStock, ...fields } = body;
        const variant = { ...fields, ecommerceVariantId: `${id}-variant-${product.variants.length + 1}`, stockQuantity: initialStock, isDefault: false };
        product.variants.push(variant); await write(rows); return send(201, { success: true, data: { variant } });
      }
      if (segments.length === 2 && segments[1] === 'publish' && req.method === 'POST') {
        product.status = 'PUBLISHED'; await write(rows); return send(200, { success: true, data: { product } });
      }
    }
    const edit = url.pathname.match(/^\/api\/v1\/admin\/ecommerce\/variants\/([^/]+)$/);
    if (edit && req.method === 'PATCH') {
      if (Object.keys(body).sort().join(',') !== 'isActive,saleAmountPaise' || !Number.isSafeInteger(body.saleAmountPaise) || body.saleAmountPaise < 0 || typeof body.isActive !== 'boolean') return send(400, { message: 'Invalid variant update payload.' });
      const variant = rows.flatMap((row) => row.variants).find((row) => row.ecommerceVariantId === decodeURIComponent(edit[1]));
      if (!variant) return send(404, { message: 'Variant not found.' });
      if (body.saleAmountPaise > variant.mrpAmountPaise) return send(400, { message: 'Sale exceeds MRP.' });
      Object.assign(variant, body); await write(rows); return send(200, { success: true, data: { variant } });
    }
    const stock = url.pathname.match(/^\/api\/v1\/admin\/ecommerce\/variants\/([^/]+)\/inventory-adjustments$/);
    if (stock && req.method === 'POST') {
      if (Object.keys(body).sort().join(',') !== 'note,quantity,type' || !Number.isSafeInteger(body.quantity) || body.quantity < 1 || body.type !== 'STOCK_RECEIVED' || !body.note?.trim()) return send(400, { message: 'Invalid adjustment payload.' });
      const variant = rows.flatMap((row) => row.variants).find((row) => row.ecommerceVariantId === decodeURIComponent(stock[1]));
      if (!variant) return send(404, { message: 'Variant not found.' });
      variant.stockQuantity += body.quantity; await write(rows); return send(201, { success: true, data: { variant } });
    }
    return send(501, { message: 'Endpoint not modeled.' });
  } catch (error) { send(500, { message: error.message }); }
}).listen(Number(process.env.PORT || 4520), '127.0.0.1');
