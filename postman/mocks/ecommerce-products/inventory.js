// Request paths/queries follow the supplied contract. Populated responses are synthetic.
const inventory = Array.from({ length: 25 }, (_, index) => ({ variantId: `inventory variant & ${index + 1}`, variant: { id: `inventory variant & ${index + 1}`, sku: `INV-${index + 1}`, optionValues: { Color: 'Red', Size: 'M' }, product: { id: `inventory-product-${index + 1}`, title: `Inventory product ${index + 1}` } }, lowStockThreshold: 3, availableStock: index % 5 === 0 ? 0 : 10, reservedStock: index % 2, updatedAt: '2026-11-13T10:00:00Z' }));
const settings = new Map();
module.exports = async function inventoryRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const history = url.pathname === '/api/v1/admin/ecommerce/inventory-movements';
  const setting = url.pathname.match(/^\/api\/v1\/admin\/ecommerce\/variants\/([^/]+)\/inventory-settings$/);
  if (!history && !setting && url.pathname !== '/api/v1/admin/ecommerce/inventory') return false;
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); return true; };
  if (req.headers['x-test-inventory'] === 'unavailable') return send(503, { message: 'Inventory unavailable.' });
  if (req.headers['x-test-inventory'] === 'invalid') return send(200, { success: true, data: { inventory: null } });
  if (req.headers['x-test-inventory'] === 'rejected') return send(200, { success: false, message: 'Inventory request rejected.' });
  if (setting && req.method === 'PATCH') {
    let body = req.body;
    if (body == null) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
    else if (typeof body === 'string') body = JSON.parse(body);
    const variantId = decodeURIComponent(setting[1]);
    if (!inventory.some((row) => row.variantId === variantId)) return send(404, { message: 'Variant not found.' });
    if (!body || Object.keys(body).join(',') !== 'lowStockThreshold' || !Number.isSafeInteger(body.lowStockThreshold) || body.lowStockThreshold < 0) return send(400, { message: 'Invalid threshold payload.' });
    settings.set(variantId, body.lowStockThreshold);
    return send(200, { success: true, data: { inventorySettings: { variantId, lowStockThreshold: body.lowStockThreshold } } });
  }
  if (setting || req.method !== 'GET') return send(501, { message: 'Inventory operation not modeled.' });
  const allowed = history ? ['variantId', 'page', 'limit'] : ['lowStockOnly', 'page', 'limit'];
  if ([...url.searchParams.keys()].some((key) => !allowed.includes(key))) return send(400, { message: 'Unexpected inventory query.' });
  const page = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit'));
  if (!Number.isInteger(page) || page < 1 || ![20, 50, 100].includes(limit)) return send(400, { message: 'Invalid pagination.' });
  let rows = inventory.map((row) => ({ ...row, lowStockThreshold: settings.get(row.variantId) ?? row.lowStockThreshold }));
  if (history) {
    const variantId = url.searchParams.get('variantId');
    if (variantId === 'denied') return send(403, { message: 'Access denied.' });
    if (!inventory.some((row) => row.variantId === variantId)) return send(404, { message: 'Variant not found.' });
    rows = variantId === inventory[0].variantId ? Array.from({ length: 25 }, (_, index) => ({ id: `movement-${index + 1}`, variantId, type: 'STOCK_RECEIVED', quantity: 10, stockBefore: index * 10, stockAfter: (index + 1) * 10, note: 'Warehouse stock received.', createdAt: '2026-11-13T10:00:00Z', createdBy: { name: 'Inventory Admin' } })) : [];
  } else if (url.searchParams.has('lowStockOnly')) {
    if (url.searchParams.get('lowStockOnly') !== 'true') return send(400, { message: 'Expected lowStockOnly=true or omitted.' });
    rows = rows.filter((row) => row.availableStock <= row.lowStockThreshold);
  }
  return send(200, { success: true, data: { [history ? 'movements' : 'inventory']: rows.slice((page - 1) * limit, page * limit), pagination: { total: rows.length, page, limit, hasNextPage: page * limit < rows.length } } });
};
