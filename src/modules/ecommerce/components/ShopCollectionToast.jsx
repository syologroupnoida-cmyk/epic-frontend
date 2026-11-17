import { Alert, IconButton, Snackbar } from '@mui/material';
import ShopIcon from './ShopIcon';

export default function ShopCollectionToast({ notice, onClose, onOpen }) {
  if (!notice) return null;
  const wishlist = notice.kind === 'wishlist';
  const collection = wishlist ? 'wishlist' : 'cart';
  const dismiss = () => onClose(notice.id);
  return <Snackbar key={notice.id} open anchorOrigin={{ vertical: 'top', horizontal: 'right' }} autoHideDuration={8000} onClose={(_event, reason) => { if (reason !== 'clickaway') dismiss(); }} sx={{ maxWidth: { sm: 420 } }}>
    <Alert severity={notice.refreshError ? 'warning' : 'success'} role="status" variant="outlined" sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 6, alignItems: 'flex-start', '& .MuiAlert-message': { minWidth: 0 } }} action={<IconButton size="small" color="inherit" aria-label="Dismiss notification" onClick={dismiss}><ShopIcon name="close" size={18} /></IconButton>}>
      <p className="text-sm font-semibold">Added to {collection}.</p>
      {notice.refreshError ? <p className="mt-1 text-xs">Your item was saved. Open your {collection} to refresh the list.</p> : null}
      <button type="button" onClick={() => { onOpen(notice.kind); dismiss(); }} className="mt-1 inline-block cursor-pointer text-sm font-semibold text-[#a4002b] underline underline-offset-2">Go to {collection}</button>
    </Alert>
  </Snackbar>;
}
