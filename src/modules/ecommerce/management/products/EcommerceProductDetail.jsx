import { useEffect, useRef, useState } from 'react';
import styles from './ProductPresentation.module.css';
import MainApi from '@/util/MainApi';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import ShopTableState from '../ShopTableState';
import { adjustEcommerceStock, ecommerceProductError, fetchEcommerceProduct, publishEcommerceProduct } from '@/util/ecommerceProducts.mjs';
import { buttonClass } from './ProductControls';
import ProductDetailContent from './ProductDetailView';
export { default as ProductDetailContent } from './ProductDetailView';

export default function EcommerceProductDetail({ id, onBack }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [stock, setStock] = useState({ variantId: '', quantity: '', type: 'STOCK_RECEIVED', note: '' });
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceProduct(MainApi, id, controller.signal).then((row) => { if (!controller.signal.aborted) { setProduct(row); setNeedsRefresh(false); } }).catch((err) => { if (!controller.signal.aborted) setError(ecommerceProductError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);
  async function action(kind) {
    if (request.current || needsRefresh) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setFeedback(null); setConfirm(false);
    try {
      if (kind === 'publish') await publishEcommerceProduct(MainApi, id, controller.signal);
      else await adjustEcommerceStock(MainApi, stock.variantId, stock, controller.signal);
      if (controller.signal.aborted) return;
      setFeedback({ success: true, kind, text: kind === 'publish' ? 'Product published successfully.' : 'Stock adjustment saved.' });
      if (kind === 'stock') setStock((current) => ({ ...current, quantity: '', note: '' }));
      try {
        const row = await fetchEcommerceProduct(MainApi, id, controller.signal);
        if (!controller.signal.aborted) setProduct(row);
      } catch (err) {
        if (!controller.signal.aborted) { setNeedsRefresh(true); setFeedback({ success: true, kind, text: `The action succeeded, but details could not be refreshed. ${ecommerceProductError(err)} Return to Products List and reopen this product before making another change.` }); }
      }
    } catch (err) { if (!controller.signal.aborted) setFeedback({ success: false, text: ecommerceProductError(err) }); }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  function refresh() { setLoading(true); setError(''); setRetry((value) => value + 1); }
  const publishFeedback = feedback?.success && feedback.kind === 'publish';
  return <section className={`${styles.detail} ${styles.card}`}>
    <header className={styles.header}><div><h1>Product Details</h1><p className={styles.subtitle}>View and manage product information</p></div><button className={buttonClass} onClick={onBack} disabled={busy}>Products List</button></header>
    <div className={styles.detailBody}>
    {loading ? <div><ShopTableState title="Loading product details..." /></div> : error ? <div><ShopTableState title="Product details could not be loaded." error={error} onRetry={refresh} /></div> : product && <>
      {feedback && !publishFeedback && <p role={feedback.success ? 'status' : 'alert'} className={`mb-4 rounded-lg border p-3 text-sm ${feedback.success ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-rose-100 bg-rose-50 text-red-700'}`}>{feedback.text}</p>}
      <ProductDetailContent product={product} busy={busy} needsRefresh={needsRefresh} stock={stock} onStockChange={setStock} onStockSubmit={(event) => { event.preventDefault(); action('stock'); }} onPublish={() => setConfirm(true)} />
    </>}
    </div>
    <ConfirmActionModal isOpen={confirm} title="Publish this product?" text="This will make the product available for sale." confirmLabel="Publish product" onConfirm={() => action('publish')} onCancel={() => setConfirm(false)} />
    <ApiStatusModal status={publishFeedback ? 'success' : null} title="Product published" text={publishFeedback ? feedback.text : ''} onOk={() => setFeedback(null)} />
  </section>;
}
