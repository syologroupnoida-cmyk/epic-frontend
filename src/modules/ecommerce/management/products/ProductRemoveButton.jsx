import { IconButton, SvgIcon } from '@mui/material';

export default function ProductRemoveButton({ label, disabled, onClick }) {
  return <IconButton type="button" size="small" aria-label={label} title={label} disabled={disabled} onClick={onClick} sx={{ width: 32, height: 32, color: '#9f344b', '&:hover': { bgcolor: '#fff1f4' } }}><SvgIcon sx={{ fontSize: 18 }} viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></SvgIcon></IconButton>;
}
