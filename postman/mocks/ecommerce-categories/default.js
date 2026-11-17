// Only paths and create fields were supplied. Response envelopes are synthetic.
const http = require('http');
const seed = () => Array.from({ length: 25 }, (_, index) => ({
  ecommerceCategoryId: index === 0 ? 'category & one' : `category-${index + 1}`,
  name: `Wedding Category ${index + 1}`, description: 'Wedding shop category.', sortOrder: index + 1,
  createdAt: '2026-11-10T10:00:00Z',
}));
const seedSubcategories = () => [
  { ecommerceSubcategoryId: 'subcategory & one', categoryId: 'category & one', name: 'Bridal Lehenga', specificationTemplate: { fields: [{ key: 'fabric', label: 'Fabric', type: 'SELECT', required: true, options: ['Silk', 'Velvet'] }, { key: 'blouseIncluded', label: 'Blouse Included', type: 'BOOLEAN', required: true }] } },
  { ecommerceSubcategoryId: 'subcategory-2', categoryId: 'category-2', name: 'Return Gift Boxes', specificationTemplate: { fields: [] } },
];
let fallbackSubcategories = seedSubcategories();
let fallbackRows = seed();
const state = typeof pm !== 'undefined' ? pm.state : null;
const stateKey = 'ecommerce-categories:rows';
async function readRows() {
  if (!state) return fallbackRows;
  const rows = await state.get(stateKey);
  if (Array.isArray(rows)) return rows;
  const initial = seed(); await state.set(stateKey, initial); return initial;
}
async function writeRows(rows) {
  if (state) await state.set(stateKey, rows);
  else fallbackRows = rows;
}
async function readSubcategories() {
  if (!state) return fallbackSubcategories;
  const rows = await state.get('ecommerce-categories:subcategories');
  if (Array.isArray(rows)) return rows;
  const initial = seedSubcategories(); await state.set('ecommerce-categories:subcategories', initial); return initial;
}
async function writeSubcategories(rows) {
  if (state) await state.set('ecommerce-categories:subcategories', rows);
  else fallbackSubcategories = rows;
}
http.createServer(async (req, res) => {
  const send = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    if (req.headers.authorization !== 'Bearer ecommerce-category-test-token') return send(401, { message: 'Unauthorized.' });
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__reset' && req.method === 'POST') { await writeRows(seed()); await writeSubcategories(seedSubcategories()); return send(200, { success: true }); }
    const rows = await readRows();
    const catalogEdit = url.pathname.match(/^\/api\/v1\/admin\/ecommerce\/(categories|subcategories)\/([^/]+)$/);
    if (catalogEdit && ['PATCH', 'DELETE'].includes(req.method)) {
      const sub = catalogEdit[1] === 'subcategories';
      const all = sub ? await readSubcategories() : rows;
      const id = decodeURIComponent(catalogEdit[2]);
      const row = all.find(item => (sub ? item.ecommerceSubcategoryId : item.ecommerceCategoryId) === id);
      if (!row) return send(404, { message: 'Catalog entry not found.' });
      if (req.headers['x-test-catalog'] === 'unavailable') return send(503, { message: 'Catalog service unavailable.' });
      if (req.method === 'DELETE') {
        if (sub) return send(501, { message: 'Subcategory delete not modeled.' });
        const products = state ? (await state.get('ecommerce-products:rows')) || [] : [];
        if ((await readSubcategories()).some(item => item.categoryId === id) || products.some(item => item.categoryId === id)) return send(409, { message: 'Only empty categories can be deleted.' });
        await writeRows(rows.filter(item => item !== row));
      } else {
        let body = req.body;
        if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()); }
        else if (typeof body === 'string') body = JSON.parse(body);
        const expected = sub ? 'categoryId,name,specificationTemplate' : 'description,name,sortOrder';
        if (!body || Object.keys(body).sort().join(',') !== expected || typeof body.name !== 'string' || !body.name.trim()) return send(400, { message: 'Invalid catalog update payload.' });
        if (sub && (!rows.some(item => item.ecommerceCategoryId === body.categoryId) || !Array.isArray(body.specificationTemplate?.fields))) return send(400, { message: 'Invalid subcategory update.' });
        if (!sub && (typeof body.description !== 'string' || !Number.isSafeInteger(body.sortOrder) || body.sortOrder < 0)) return send(400, { message: 'Invalid category update.' });
        if (all.some(item => item !== row && item.name.toLowerCase() === body.name.toLowerCase() && (!sub || item.categoryId === body.categoryId))) return send(409, { message: 'This name already exists.' });
        Object.assign(row, body);
        if (sub) await writeSubcategories(all); else await writeRows(all);
      }
      if (req.headers['x-test-catalog'] === 'after-write') return send(503, { message: 'Response lost after catalog update.' });
      return send(200, { success: true, message: req.method === 'DELETE' ? 'Category deleted.' : sub ? 'Subcategory updated.' : 'Category updated.', data: req.method === 'DELETE' ? {} : { [sub ? 'subcategory' : 'category']: row } });
    }
    if (url.pathname === '/api/v1/admin/ecommerce/subcategories') {
      const subcategories = await readSubcategories();
      if (req.method === 'GET') {
        if ([...url.searchParams.keys()].some((key) => key !== 'categoryId')) return send(400, { message: 'Unexpected query parameter.' });
        if (req.headers['x-test-response'] === 'invalid') return send(200, { success: true, data: { subcategories: null } });
        const categoryId = url.searchParams.get('categoryId');
        if (categoryId === 'unavailable') return send(503, { message: 'Subcategory service unavailable.' });
        if (categoryId === 'denied') return send(403, { message: 'Access denied.' });
        const items = categoryId ? subcategories.filter((row) => row.categoryId === categoryId) : subcategories;
        return send(200, { success: true, data: { subcategories: items } });
      }
      if (req.method === 'POST') {
        let body = req.body;
        if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()); }
        else if (typeof body === 'string') body = JSON.parse(body);
        if (!body || Object.keys(body).sort().join(',') !== 'categoryId,name,specificationTemplate' || typeof body.categoryId !== 'string' || !body.name?.trim() || Object.keys(body.specificationTemplate || {}).join(',') !== 'fields' || !Array.isArray(body.specificationTemplate.fields)) return send(400, { message: 'Invalid subcategory payload.' });
        if (!rows.some((row) => row.ecommerceCategoryId === body.categoryId)) return send(400, { message: 'Parent category not found.' });
        for (const field of body.specificationTemplate.fields) {
          if (!field.key || !field.label || !['SELECT', 'BOOLEAN', 'TEXT'].includes(field.type) || typeof field.required !== 'boolean' || (field.type === 'SELECT' && (!Array.isArray(field.options) || !field.options.length)) || Object.keys(field).sort().join(',') !== (field.type === 'SELECT' ? 'key,label,options,required,type' : 'key,label,required,type')) return send(400, { message: 'Invalid specification field.' });
        }
        if (body.name === 'Unavailable') return send(503, { message: 'Subcategory service unavailable.' });
        if (body.name === 'Rejected') return send(200, { success: false, message: 'Subcategory request rejected.' });
        if (subcategories.some((row) => row.categoryId === body.categoryId && row.name.toLowerCase() === body.name.toLowerCase())) return send(409, { message: 'This subcategory already exists.' });
        const subcategory = { ecommerceSubcategoryId: `subcategory-${subcategories.length + 1}`, ...body };
        await writeSubcategories([...subcategories, subcategory]);
        return send(201, { success: true, message: 'Subcategory created.', data: { subcategory } });
      }
    }
    if (url.pathname === '/api/v1/admin/ecommerce/categories') {
      if (req.method === 'GET') {
        const page = Number(url.searchParams.get('page')), limit = Number(url.searchParams.get('limit'));
        if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) return send(400, { message: 'Invalid pagination.' });
        if (req.headers['x-test-response'] === 'invalid') return send(200, { success: true, data: { categories: null } });
        const ordered = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
        return send(200, { success: true, data: { categories: ordered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: rows.length, hasNextPage: page * limit < rows.length } } });
      }
      if (req.method === 'POST') {
        let body = req.body;
        if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString()); }
        else if (typeof body === 'string') body = JSON.parse(body);
        if (!body || Object.keys(body).sort().join(',') !== 'description,name,sortOrder' || typeof body.name !== 'string' || !body.name.trim() || typeof body.description !== 'string' || !Number.isSafeInteger(body.sortOrder) || body.sortOrder < 0) return send(400, { message: 'Invalid category payload.' });
        if (body.name === 'Unavailable') return send(503, { message: 'Category service unavailable.' });
        if (body.name === 'Rejected') return send(200, { success: false, message: 'Category request rejected.' });
        if (rows.some((row) => row.name.toLowerCase() === body.name.toLowerCase())) return send(409, { message: 'This category already exists.' });
        const category = { ecommerceCategoryId: `category-${rows.length + 1}`, ...body, createdAt: '2026-11-10T10:30:00Z' };
        await writeRows([...rows, category]);
        return send(201, { success: true, message: 'Category created.', data: { category } });
      }
    }
    const match = /^\/api\/v1\/admin\/ecommerce\/categories\/([^/]+)$/.exec(url.pathname);
    if (match && req.method === 'GET') {
      const id = decodeURIComponent(match[1]);
      if (id === 'denied') return send(403, { message: 'Access denied.' });
      if (id === 'unavailable') return send(503, { message: 'Category service unavailable.' });
      if (id === 'invalid') return send(200, { success: true, data: null });
      const category = rows.find((item) => item.ecommerceCategoryId === id);
      return category ? send(200, { success: true, data: { category } }) : send(404, { message: 'Category not found.' });
    }
    return send(501, { message: 'Endpoint not modeled.' });
  } catch { return send(400, { message: 'Invalid request.' }); }
}).listen(process.env.PORT || 4518);
