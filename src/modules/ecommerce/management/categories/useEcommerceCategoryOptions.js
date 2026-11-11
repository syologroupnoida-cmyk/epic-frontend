import { useEffect, useState } from 'react';
import MainApi from '@/util/MainApi';
import { ecommerceCategoryError, fetchAllEcommerceCategories } from '@/util/ecommerceCategories.mjs';

export default function useEcommerceCategoryOptions() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchAllEcommerceCategories(MainApi, { signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setResult({ attempt, items }); }).catch((error) => { if (!controller.signal.aborted) setResult({ attempt, items: [], error: ecommerceCategoryError(error) }); });
    return () => controller.abort();
  }, [attempt]);
  const current = result?.attempt === attempt ? result : null;
  return { items: current?.items || [], loading: !current, error: current?.error || '', retry: () => setAttempt((value) => value + 1) };
}
