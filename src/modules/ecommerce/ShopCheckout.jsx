import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, FormControlLabel, Radio, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { checkoutShopCart, createShopAddress, fetchShopAddresses, shopAddressId, shopAddressPayload, shopOrderId, removeShopAddress, updateShopAddress } from '@/util/shopAccount.mjs';
import { shopError, shopMoney } from '@/util/shopCatalog.mjs';
import ShopAccountPage from './components/ShopAccountPage';
import ShopIcon from './components/ShopIcon';
import styles from './ShopCheckout.module.css';

const blankAddress = () => ({ fullName: '', phone: '', line1: '', city: '', state: '', pincode: '', isDefault: true });
const primary = { bgcolor: '#b61f4b', textTransform: 'none' };
export default function ShopCheckout() {
  return <ShopAccountPage title="Delivery address" path="/shop/checkout">{(account) => <CheckoutContent key={account.session} account={account} />}</ShopAccountPage>;
}
export function CheckoutContent({ account }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState(blankAddress);
  const [editing, setEditing] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [needsAddressRefresh, setNeedsAddressRefresh] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [checkoutLocked, setCheckoutLocked] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  function acceptAddresses(items, preferred = '') {
    setAddresses(items);
    setSelected((previous) => items.some((row) => shopAddressId(row) === (preferred || previous)) ? preferred || previous : shopAddressId(items.find((row) => row.isDefault) || items[0]));
  }
  useEffect(() => {
    const controller = new AbortController();
    fetchShopAddresses(MainApi, controller.signal).then((items) => { if (!controller.signal.aborted) { acceptAddresses(items); setNeedsAddressRefresh(false); } }).catch((err) => { if (!controller.signal.aborted) setAddressError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  function retryAddresses() { setLoading(true); setAddressError(''); setRevision((value) => value + 1); }
  function change(key, value) { setForm((current) => ({ ...current, [key]: value })); setDirty(true); }
  function resetForm() { setEditing(''); setForm({ ...blankAddress(), isDefault: addresses.length === 0 }); setDirty(false); }
  function editAddress(row) {
    setEditing(shopAddressId(row)); setSelected(shopAddressId(row));
    setForm(Object.fromEntries(Object.keys(blankAddress()).map((key) => [key, key === 'isDefault' ? Boolean(row[key]) : row[key] || ''])));
    setDirty(true); setMessage(null);
  }
  async function saveAddress(event) {
    event.preventDefault();
    if (request.current || needsAddressRefresh) return;
    let payload;
    try { payload = shopAddressPayload(form); } catch (err) { setMessage({ error: true, text: shopError(err) }); return; }
    const controller = new AbortController(); request.current = controller; setBusy('address'); setMessage(null);
    let saved = false;
    try {
      const address = editing ? await updateShopAddress(MainApi, editing, payload, controller.signal) : await createShopAddress(MainApi, payload, controller.signal);
      saved = true;
      if (controller.signal.aborted) return;
      const preferred = shopAddressId(address) || editing;
      resetForm();
      const items = await fetchShopAddresses(MainApi, controller.signal);
      if (!controller.signal.aborted) { acceptAddresses(items, preferred); setMessage({ error: false, text: 'Address saved.' }); }
    } catch (err) {
      if (!controller.signal.aborted) {
        const uncertain = saved || !err.response || err.response.status >= 500;
        setNeedsAddressRefresh(uncertain);
        setMessage({ error: true, text: `${saved ? 'Address saved. Refresh your addresses to continue. ' : uncertain ? 'The save could not be confirmed. Refresh addresses before trying again. ' : ''}${shopError(err)}` });
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(''); } }
  }
  async function deleteAddress(row) {
    if (request.current || needsAddressRefresh || checkoutLocked) return;
    const addressId = shopAddressId(row);
    const controller = new AbortController(); request.current = controller; setBusy(`delete:${addressId}`); setMessage(null);
    let removed = false;
    try {
      await removeShopAddress(MainApi, addressId, controller.signal); removed = true;
      if (controller.signal.aborted) return;
      if (selected === addressId) setSelected('');
      if (editing === addressId) resetForm();
      const items = await fetchShopAddresses(MainApi, controller.signal);
      if (!controller.signal.aborted) {
        acceptAddresses(items);
        if (editing === addressId || !dirty) { setForm({ ...blankAddress(), isDefault: items.length === 0 }); setEditing(''); setDirty(false); }
        setMessage({ error: false, text: 'Address deleted.' });
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const uncertain = removed || !err.response || err.response.status >= 500;
        setNeedsAddressRefresh(uncertain);
        setMessage({ error: true, text: `${removed ? 'Address deleted. Refresh addresses to continue. ' : uncertain ? 'Deletion could not be confirmed. Refresh addresses before trying again. ' : ''}${shopError(err)}` });
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(''); } }
  }
  async function checkout() {
    if (request.current || checkoutLocked || !selected || !account.cart.length || dirty || account.cartError || account.loading) return;
    const controller = new AbortController(); request.current = controller; setBusy('checkout'); setMessage(null);
    let confirmed = false;
    try {
      const order = await checkoutShopCart(MainApi, selected, controller.signal);
      confirmed = true;
      if (controller.signal.aborted) return;
      setCheckoutLocked(true); setMessage({ error: false, text: 'Checkout submitted. You can view its status in My orders.' });
      await account.refresh();
      const orderId = shopOrderId(order);
      if (orderId) await router.push(`/shop/orders/${encodeURIComponent(orderId)}`);
    } catch (err) {
      if (!controller.signal.aborted) {
        const uncertain = confirmed || !err.response || err.response.status >= 500 || err.response.status === 408;
        setCheckoutLocked(uncertain);
        setMessage({ error: true, text: confirmed ? 'Checkout was submitted. Open My orders to view it.' : uncertain ? 'Checkout could not be confirmed. Check My orders before trying again.' : shopError(err) });
        await account.refresh();
      }
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(''); } }
  }
  const subtotal = account.cart.reduce((sum, row) => sum + (row.sale || 0) * row.quantity, 0);
  const knownPrices = account.cart.every((row) => row.sale != null);
  const disabled = Boolean(busy) || account.busy;
  return <>
    {message && <Alert severity={message.error ? 'error' : 'success'} sx={{ mb: 3 }}>{message.text}</Alert>}
    <div className={styles.layout}><section className={styles.card}><h2>Delivery address</h2>
      {loading ? <p role="status" className={styles.hint}>Loading saved addresses...</p> : addressError ? <Alert severity="error" sx={{ mb: 2 }}>{addressError}<Button onClick={retryAddresses}>Try again</Button></Alert> : <div className={styles.addresses}>{addresses.map((row) => <article key={shopAddressId(row)} className={styles.address} data-selected={selected === shopAddressId(row)}><label><Radio size="small" name="delivery-address" checked={selected === shopAddressId(row)} disabled={disabled || needsAddressRefresh || checkoutLocked} onChange={() => { setSelected(shopAddressId(row)); resetForm(); }} sx={{ color: '#b61f4b', '&.Mui-checked': { color: '#b61f4b' }, p: .5 }} /><span><strong>{row.fullName}</strong><p>{row.line1}<br />{row.city}, {row.state} {row.pincode}<br />{row.phone}</p>{row.isDefault && <small>Default address</small>}</span></label><Button size="small" disabled={disabled || needsAddressRefresh || checkoutLocked} onClick={() => editAddress(row)} sx={{ minWidth: 0, color: '#b61f4b', textTransform: 'none' }}>Edit</Button><Button size="small" color="error" disabled={disabled || needsAddressRefresh || checkoutLocked} onClick={() => deleteAddress(row)} sx={{ minWidth: 0, textTransform: 'none' }} startIcon={busy === `delete:${shopAddressId(row)}` ? <CircularProgress color="inherit" size={12} /> : undefined}>{busy === `delete:${shopAddressId(row)}` ? 'Deleting...' : 'Delete'}</Button></article>)}</div>}
      {needsAddressRefresh && <Button onClick={retryAddresses} disabled={disabled || loading}>Refresh addresses</Button>}
      <h2>{editing ? 'Edit address' : 'Add a new address'}</h2>
      <form onSubmit={saveAddress}><fieldset disabled={disabled || loading || needsAddressRefresh || checkoutLocked}><div className={styles.fields}>{[['fullName', 'Full name'], ['phone', 'Phone number'], ['line1', 'Street address'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([key, label]) => <TextField key={key} className={key === 'line1' ? styles.wide : undefined} required fullWidth size="small" label={label} type={key === 'phone' ? 'tel' : 'text'} value={form[key]} disabled={disabled || loading || needsAddressRefresh || checkoutLocked} slotProps={{ htmlInput: { ...(key === 'phone' || key === 'pincode' ? { inputMode: 'numeric', maxLength: key === 'phone' ? 10 : 6 } : {}), autoComplete: ({ fullName: 'name', phone: 'tel', line1: 'address-line1', city: 'address-level2', state: 'address-level1', pincode: 'postal-code' })[key] } }} onChange={(event) => change(key, event.target.value)} />)}</div><FormControlLabel control={<Checkbox checked={form.isDefault} onChange={(event) => change('isDefault', event.target.checked)} disabled={disabled || loading || needsAddressRefresh || checkoutLocked} sx={{ '&.Mui-checked': { color: '#b61f4b' } }} />} label="Set as default address" sx={{ mt: 1, '& .MuiTypography-root': { fontSize: 12 } }} /><div className={styles.formActions}>{dirty && <Button type="button" disabled={disabled} onClick={resetForm} sx={{ textTransform: 'none' }}>Cancel</Button>}<Button type="submit" variant="contained" disabled={disabled || loading || needsAddressRefresh || checkoutLocked} startIcon={busy === 'address' ? <CircularProgress color="inherit" size={15} /> : undefined} sx={primary}>{busy === 'address' ? 'Saving...' : editing ? 'Update address' : 'Save address'}</Button></div></fieldset></form>
    </section><aside className={`${styles.card} ${styles.summary}`}><h2>Order summary</h2>{account.loading ? <p role="status">Loading cart...</p> : account.cartError ? <Alert severity="error">{account.cartError}<Button onClick={account.refresh}>Refresh cart</Button></Alert> : !account.cart.length ? <p className={styles.hint}>Your cart is empty. <Link href="/shop">Continue shopping</Link></p> : <ul className={styles.items}>{account.cart.map((item) => <li key={item.key}>{item.image?.url ? <Image src={item.image.url} alt={item.image.alt || item.title} width={58} height={72} unoptimized className={styles.itemImage} /> : <span className={styles.itemImage}><ShopIcon name="box" size={22} /></span>}<div className={styles.itemInfo}><strong>{item.title}</strong><p>{item.sku}</p><p>Quantity: {item.quantity}</p></div><strong className={styles.hint}>{shopMoney(item.sale == null ? null : item.sale * item.quantity)}</strong></li>)}</ul>}
      <div className={styles.totals}><div><span>Subtotal</span><strong>{knownPrices ? shopMoney(subtotal) : 'Price unavailable'}</strong></div></div>
      <Button fullWidth variant="contained" sx={primary} disabled={disabled || account.loading || Boolean(account.cartError) || !account.cart.length || !selected || loading || Boolean(addressError) || needsAddressRefresh || dirty || checkoutLocked} onClick={checkout} startIcon={busy === 'checkout' ? <CircularProgress color="inherit" size={15} /> : undefined}>{busy === 'checkout' ? 'Processing...' : 'Confirm checkout'}</Button>
      {dirty && <p className={styles.hint}>Save or cancel your address changes to continue.</p>}<p className={styles.hint}>Review the items above before confirming. Final totals and order status will appear in your order.</p><Link href="/shop/orders" className={styles.primaryLink}>My orders</Link>
    </aside></div>
  </>;
}
