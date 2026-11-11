import { useId, useState } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { MoreVert, ViewOutlined } from '@/components/vendor/listings/ServiceIcons';

export default function EcommerceCategoryActions({ name, disabled, onView }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const open = Boolean(anchor);
  const close = () => setAnchor(null);

  return <>
    <IconButton
      id={`${id}-button`}
      size="small"
      disabled={disabled}
      aria-label={`Actions for ${name || 'category'}`}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? `${id}-menu` : undefined}
      onClick={(event) => setAnchor(event.currentTarget)}
      sx={{ width: 32, height: 32, borderRadius: 1.5, color: '#64748b', bgcolor: open ? '#fff1f5' : 'transparent', '&:hover': { bgcolor: '#fff1f5', color: '#b61f4b' } }}
    >
      <MoreVert sx={{ fontSize: 19 }} />
    </IconButton>
    <Menu
      id={`${id}-menu`}
      anchorEl={anchor}
      open={open}
      onClose={close}
      disableScrollLock
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        list: { 'aria-labelledby': `${id}-button`, dense: true, sx: { p: 0.5 } },
        paper: { sx: { mt: 0.5, minWidth: 172, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 8px 28px rgb(15 23 42 / 12%)' } },
      }}
    >
      <MenuItem onClick={() => { close(); onView(); }} sx={{ borderRadius: 1, py: 1, fontSize: 13, color: '#334155', '&:hover': { bgcolor: '#fff1f5', color: '#b61f4b' } }}>
        <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}><ViewOutlined sx={{ fontSize: 18 }} /></ListItemIcon>
        View details
      </MenuItem>
    </Menu>
  </>;
}
