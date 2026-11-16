import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { shopError } from '@/util/shopCatalog.mjs';
export default function CatalogMutationDialog({ title, text, successText, execute, onClose, onDone }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false), [needsRefresh, setNeedsRefresh] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function confirm() {
    if (request.current || saved || needsRefresh) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try { await execute(controller.signal); if (!controller.signal.aborted) setSaved(true); }
    catch (err) { if (!controller.signal.aborted) { const uncertain = !err.response || err.response.status >= 500 || err.response.status === 408; setNeedsRefresh(uncertain); setError(uncertain ? 'The change could not be confirmed. Refresh the list before trying again.' : shopError(err)); } }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  function close() { if (!busy) { if (saved || needsRefresh) onDone(); else onClose(); } }
  return <Dialog open onClose={close} fullWidth maxWidth="xs" disableScrollLock><DialogTitle>{saved ? successText : title}</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{!saved && <p className="text-sm text-stone-600">{text}</p>}</DialogContent><DialogActions>{saved || needsRefresh ? <Button onClick={onDone}>{saved ? 'OK' : 'Refresh list'}</Button> : <><Button disabled={busy} onClick={onClose}>Cancel</Button><Button color="error" variant="contained" disabled={busy} onClick={confirm} startIcon={busy ? <CircularProgress size={15} color="inherit" /> : undefined}>{busy ? 'Saving...' : 'Confirm'}</Button></>}</DialogActions></Dialog>;
}
