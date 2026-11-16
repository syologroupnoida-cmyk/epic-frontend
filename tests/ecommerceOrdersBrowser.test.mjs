import test from 'node:test';
import assert from 'node:assert/strict';
const app = process.env.SHOP_BROWSER_BASE_URL;
const simulation = process.env.SHOP_BROWSER_SIMULATION_URL;
const cdp = process.env.CHROME_CDP_URL;
test('browser admin order payment, fulfilment, return, refund and cancellation', { skip: !app || !simulation || !cdp, timeout: 90000 }, async (t) => {
  const target = await (await fetch(`${cdp}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0; const pending = new Map(); const traffic = []; const errors = []; const failReads = false;
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  socket.addEventListener('message', async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if (message.error) task?.reject(new Error(message.error.message)); else task?.resolve(message.result); return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    try {
      const path = new URL(request.url).pathname.replace(/^\/api\/v1/, '') + new URL(request.url).search;
      const headers = { 'Content-Type': 'application/json' };
      if (request.headers.Authorization) headers.Authorization = request.headers.Authorization;
      const forced = failReads && request.method === 'GET' && ['/shop/cart', '/shop/wishlist'].includes(path);
      const response = request.method === 'OPTIONS' ? new Response(null, { status: 204 }) : forced ? new Response(JSON.stringify({ message: 'Initial list temporarily unavailable.' }), { status: 503 }) : await fetch(`${simulation}${path}`, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.postData });
      traffic.push({ path, method: request.method, status: response.status, authenticated: Boolean(headers.Authorization) });
      await send('Fetch.fulfillRequest', { requestId, responseCode: response.status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: '*' }], body: Buffer.from(await response.text()).toString('base64') });
    } catch (error) { errors.push(error.message); await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }).catch(() => {}); }
  });
  t.after(async () => { await fetch(`${cdp}/json/close/${target.id}`).catch(() => {}); socket.close(); });
  const evaluate = async (expression) => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
  const wait = async (expression, label) => { const deadline = Date.now() + 18000; while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error(`${label}: ${await evaluate('document.body.innerText')}\nTraffic: ${JSON.stringify(traffic)}\nErrors: ${JSON.stringify(errors)}`); };
  const click = async (expression) => { await wait(`Boolean(${expression}) && !(${expression}).disabled`, 'Clickable control'); await evaluate(`(${expression}).click()`); };
  const button = (text) => `[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(text)})`;
  await fetch(`${simulation.replace(/\/api\/v1$/, '')}/__admin_orders_reset`, { method: 'POST', headers: { Authorization: 'Bearer ecommerce-product-test-token', 'Content-Type': 'application/json' }, body: '{}' });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCookies', { cookies: [{ name: 'epic_access_token', value: 'ecommerce-product-test-token', url: app }, { name: 'epic_refresh_token', value: 'synthetic-admin-refresh', url: app }, { name: 'epic_auth_role', value: 'SUPER_ADMIN', url: app }] });
  await send('Fetch.enable', { patterns: [{ urlPattern: 'https://api.epicwedplanner.com/api/v1/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('epic_access_token','ecommerce-product-test-token');localStorage.setItem('epic_auth_user',JSON.stringify({id:'synthetic-admin',role:'SUPER_ADMIN',fullName:'Test Admin'}));` });
  await send('Page.navigate', { url: `${app}/orders` });
  await wait(`document.querySelector('table[aria-label="Admin shop orders"]')?.innerText.includes('ADMIN-1')`, 'Admin order list loaded');
  const menuAction = async (number, label) => { await click(`document.querySelector('[aria-label="Actions for order ${number}"]')`); await click(`[...document.querySelectorAll('[role="menuitem"]')].find(x=>x.textContent.trim()===${JSON.stringify(label)})`); };
  const fill = async (label, value, textarea = false) => evaluate(`(()=>{const input=[...document.querySelectorAll(${JSON.stringify(textarea ? 'textarea:not([aria-hidden="true"])' : 'input')})].find(x=>document.querySelector('label[for="'+x.id+'"]')?.textContent.includes(${JSON.stringify(label)}));Object.getOwnPropertyDescriptor(${textarea ? 'HTMLTextAreaElement' : 'HTMLInputElement'}.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const confirm = async () => { await click(button('Confirm')); await wait(`document.querySelector('[aria-label="Request status"]') || [...document.querySelectorAll('[role="dialog"]')].some(x=>x.innerText.includes('successfully.') || x.innerText.includes('paid for testing.'))`, 'Action success popup'); await click(button('OK')); };
  const rowStatus = (number, status) => `[...document.querySelectorAll('tbody tr')].some(x=>x.innerText.includes(${JSON.stringify(number)}) && x.innerText.includes(${JSON.stringify(status)}))`;
  await menuAction('ADMIN-1', 'Mark paid (test)'); await confirm(); await wait(rowStatus('ADMIN-1','PAID'), 'Admin marked paid');
  await menuAction('ADMIN-1', 'View details'); await wait(`document.body.innerText.includes('Fulfilment: PAID')`, 'Admin order detail');
  for (const [label, status] of [['Start processing','PROCESSING'],['Mark packed','PACKED'],['Ship order','SHIPPED'],['Mark delivered','DELIVERED']]) {
    await click(button(label));
    if(status==='SHIPPED'){await fill('Courier name','Delhivery');await fill('Tracking number','TEST123456');await fill('Tracking URL','https://example.com/track/TEST123456');}
    await confirm();await wait(`document.body.innerText.includes('Fulfilment: ${status}')`, `${status} status refreshed`);
  }
  assert.equal(await evaluate(`document.querySelector('a[href="https://example.com/track/TEST123456"]')?.textContent`),'Track shipment');
  await click(button('Orders List')); await wait(rowStatus('ADMIN-1','DELIVERED'), 'Return to order list');
  await menuAction('ADMIN-2','Accept return and restock');await confirm();await wait(rowStatus('ADMIN-2','RETURNED'),'Return accepted');
  await menuAction('ADMIN-2','Record refund');await confirm();await wait(rowStatus('ADMIN-2','REFUNDED'),'Refund recorded');
  await menuAction('ADMIN-3','Cancel order');await fill('Cancellation reason','Customer requested cancellation',true);await confirm();await wait(rowStatus('ADMIN-3','CANCELLED'),'Payment-pending order cancelled');
  await click(`document.querySelector('[aria-label="Go to next page"]')`);await wait(`document.querySelector('tbody')?.querySelectorAll('tr').length===5`,'Admin orders second page');
  assert.equal(errors.length,0,errors.join('\n'));
  assert.equal(traffic.filter(row=>row.method==='PATCH' && row.path.endsWith('/fulfilment') && row.status===200).length,6);
  assert.ok(traffic.some(row=>row.method==='POST' && row.path.endsWith('/mark-paid-for-test') && row.status===200));
});
