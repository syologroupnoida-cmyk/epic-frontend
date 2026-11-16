import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceOrderCustomer, ecommerceOrderStage, fetchEcommerceOrder } from '@/util/ecommerceOrders.mjs';
import { shopError } from '@/util/shopCatalog.mjs';
import { ShopOrderContent } from '../../ShopOrderDetails';
import ShopTableState from '../ShopTableState';
import EcommerceOrderActions from './EcommerceOrderActions';
export default function EcommerceOrderDetail({ id, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceOrder(MainApi, id, controller.signal).then(data => { if (!controller.signal.aborted) setOrder(data); }).catch(err => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);
  function reload() { setError(''); setLoading(true); setRevision(value => value + 1); }
  const shipping = order?.shipment || order?.shipping || order;
  let trackingUrl;
  try { const url = new URL(shipping?.trackingUrl); if (['http:', 'https:'].includes(url.protocol)) trackingUrl = url.href; } catch { /* Only render usable tracking links. */ }
  return <section className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm"><header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3"><h1 className="text-lg font-semibold">Order details</h1><Button size="small" onClick={onBack}>Orders List</Button></header><div className="min-h-0 flex-1 overflow-auto p-5">{loading || error ? <ShopTableState title={loading ? 'Loading order details...' : 'Order could not be loaded.'} error={loading ? undefined : error} onRetry={loading ? undefined : reload} /> : order && <><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold">{ecommerceOrderCustomer(order)}</p><p className="mt-1 text-xs text-stone-500">Fulfilment: {ecommerceOrderStage(order) || 'Unavailable'}</p></div><EcommerceOrderActions key={`${id}:${revision}`} order={order} onChanged={reload} /></div><ShopOrderContent order={order} />{(shipping?.courierName || shipping?.trackingNumber || trackingUrl) && <section className="mt-5 rounded-xl border border-slate-200 p-5"><h2 className="mb-3 text-sm font-semibold">Shipment details</h2><dl className="grid gap-3 text-xs sm:grid-cols-3"><div><dt className="text-stone-500">Courier</dt><dd className="mt-1">{shipping.courierName || 'Unavailable'}</dd></div><div><dt className="text-stone-500">Tracking number</dt><dd className="mt-1 break-all">{shipping.trackingNumber || 'Unavailable'}</dd></div><div><dt className="text-stone-500">Tracking link</dt><dd className="mt-1">{trackingUrl ? <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="text-[#b61f4b] underline">Track shipment</a> : 'Unavailable'}</dd></div></dl></section>}</>}</div></section>;
}
