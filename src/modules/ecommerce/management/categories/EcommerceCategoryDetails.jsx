import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import MainApi from '@/util/MainApi';
import { ecommerceCategoryError, fetchEcommerceCategory } from '@/util/ecommerceCategories.mjs';

export default function EcommerceCategoryDetails({ id, onClose }) {
  const [category, setCategory] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchEcommerceCategory(MainApi, id, controller.signal).then((data) => { if (!controller.signal.aborted) { setCategory(data); setError(''); } }).catch((failure) => { if (!controller.signal.aborted) setError(ecommerceCategoryError(failure)); });
    return () => controller.abort();
  }, [id, attempt]);
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="ecommerce-category-details-title">
    <DialogTitle id="ecommerce-category-details-title">Category details</DialogTitle>
    <DialogContent dividers>
      {error ? <Alert severity="error" action={<Button color="inherit" onClick={() => { setError(''); setAttempt((value) => value + 1); }}>Retry</Button>}>{error}</Alert> : !category ? <p role="status" className="py-8 text-center text-sm text-stone-500">Loading category details...</p> : <dl className="grid gap-5 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-stone-500">Category name</dt><dd className="mt-1 break-words font-semibold">{category.name}</dd></div>
        <div><dt className="text-xs text-stone-500">Sort order</dt><dd className="mt-1">{category.sortOrder ?? 'Not provided'}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-stone-500">Description</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-6">{category.description || 'No description provided.'}</dd></div>
        {['createdAt', 'updatedAt'].filter((key) => category[key]).map((key) => <div key={key}><dt className="text-xs text-stone-500">{key === 'createdAt' ? 'Created on' : 'Updated on'}</dt><dd className="mt-1">{Number.isFinite(Date.parse(category[key])) ? new Date(category[key]).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not provided'}</dd></div>)}
      </dl>}
    </DialogContent><DialogActions><Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button></DialogActions>
  </Dialog>;
}
