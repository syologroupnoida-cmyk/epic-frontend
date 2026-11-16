import { useId, useState } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem, SvgIcon } from '@mui/material';
import { agentListActionButtonSx } from '@/components/vendor/listings/tableStyles';

export default function InventoryActions({ sku, disabled, onHistory, onThreshold }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  return <>
    <IconButton size="small" disabled={disabled} aria-label={`Actions for ${sku}`} aria-haspopup="menu" aria-expanded={Boolean(anchor)} aria-controls={anchor ? id : undefined} onClick={(event) => setAnchor(event.currentTarget)} sx={agentListActionButtonSx}><SvgIcon fontSize="small"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></SvgIcon></IconButton>
    <Menu id={id} disableScrollLock anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { 'aria-label': `Actions for ${sku}` }, paper: { sx: { minWidth: 190, mt: .5, borderRadius: 2 } } }}><MenuItem sx={{ fontSize: 12 }} onClick={() => { setAnchor(null); onHistory(); }}><ListItemIcon><SvgIcon fontSize="small"><path d="M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" fill="none" stroke="currentColor" strokeWidth="1.7" /></SvgIcon></ListItemIcon>Movement history</MenuItem>{onThreshold && <MenuItem sx={{ fontSize: 12 }} onClick={() => { setAnchor(null); onThreshold(); }}><ListItemIcon><SvgIcon fontSize="small"><path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6" fill="none" stroke="currentColor" strokeWidth="1.7" /></SvgIcon></ListItemIcon>Set threshold</MenuItem>}</Menu>
  </>;
}
