import { useId, useState } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem, SvgIcon } from '@mui/material';
import { agentListActionButtonSx } from '@/components/vendor/listings/tableStyles';

export default function ProductActions({ title, onView, onEdit, onArchive }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  return <>
    <IconButton id={`${id}-button`} size="small" aria-label={`Actions for ${title}`} aria-haspopup="menu" aria-controls={anchor ? `${id}-menu` : undefined} aria-expanded={Boolean(anchor)} onClick={(event) => setAnchor(event.currentTarget)} sx={agentListActionButtonSx}>
      <SvgIcon fontSize="small"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></SvgIcon>
    </IconButton>
    <Menu disableScrollLock id={`${id}-menu`} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ list: { 'aria-labelledby': `${id}-button` }, paper: { sx: { minWidth: 170, mt: 0.5, borderRadius: 2, border: '1px solid #eee6eb', boxShadow: '0 6px 24px #34202b14' } } }}>
      <MenuItem onClick={() => { setAnchor(null); onView(); }} sx={{ fontSize: 12, py: 1.25 }}><ListItemIcon><SvgIcon fontSize="small" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /></SvgIcon></ListItemIcon>View details</MenuItem>
      <MenuItem onClick={() => { setAnchor(null); onEdit(); }} sx={{ fontSize: 12, py: 1.25 }}><ListItemIcon><SvgIcon fontSize="small" viewBox="0 0 24 24"><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></SvgIcon></ListItemIcon>Edit product</MenuItem>
      {onArchive && <MenuItem sx={{ fontSize: 12 }} onClick={() => { setAnchor(null); onArchive(); }}><ListItemIcon><SvgIcon fontSize="small"><path d="M3 3h18v5H3ZM5 8v13h14V8M9 12h6" fill="none" stroke="currentColor" strokeWidth="1.6" /></SvgIcon></ListItemIcon>Archive product</MenuItem>}
    </Menu>
  </>;
}
