import { InputAdornment, TextField } from '@mui/material';

export default function ShopTableSearch({ value, onChange, label = 'Search categories on this page', placeholder = 'Search this page' }) {
  return <TextField type="search" size="small" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} slotProps={{ htmlInput: { 'aria-label': label }, input: { startAdornment: <InputAdornment position="start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></InputAdornment> } }} sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 260 }, '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& .MuiInputBase-input': { py: .75 } }} />;
}
