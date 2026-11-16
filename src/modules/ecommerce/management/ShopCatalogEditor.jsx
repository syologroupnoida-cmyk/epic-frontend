import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MainApi from '@/util/MainApi';
import { fetchEcommerceCategory } from '@/util/ecommerceCategories.mjs';
import { fetchEcommerceSubcategories, ecommerceSubcategoryId } from '@/util/ecommerceSubcategories.mjs';
import { shopError } from '@/util/shopCatalog.mjs';
import EcommerceCategoryForm from './categories/EcommerceCategoryForm';
import EcommerceSubcategoryForm from './subcategories/EcommerceSubcategoryForm';
import ShopTableState from './ShopTableState';
export default function ShopCatalogEditor({ kind, id }) {
  const router = useRouter();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = kind === 'category' ? fetchEcommerceCategory(MainApi, id, controller.signal) : fetchEcommerceSubcategories(MainApi, { signal: controller.signal }).then(({ items }) => {
      const row = items.find(item => ecommerceSubcategoryId(item) === id);
      if (!row) throw new Error('Subcategory not found.');
      return row;
    });
    load.then(row => { if (!controller.signal.aborted) setEntry(row); }).catch(err => { if (!controller.signal.aborted) setError(shopError(err)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, id, revision]);
  const back = () => router.push(kind === 'category' ? '/categories' : '/subcategories');
  if (loading || error) return <section className="rounded border border-slate-200 bg-white p-5"><button type="button" onClick={back} className="mb-4 text-xs text-[#b61f4b]">{kind === 'category' ? 'Category List' : 'Subcategory List'}</button><ShopTableState title={loading ? `Loading ${kind} for editing...` : `Unable to load ${kind}.`} error={loading ? undefined : error} onRetry={loading ? undefined : () => { setLoading(true); setError(''); setRevision(value => value + 1); }} /></section>;
  return kind === 'category' ? <EcommerceCategoryForm key={id} category={entry} onCancel={back} onSaved={back} /> : <EcommerceSubcategoryForm key={id} subcategory={entry} onCancel={back} onSaved={back} />;
}
