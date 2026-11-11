import { InputAdornment, TextField } from '@mui/material';

export default function MeetingTableSearch({ value, onChange }) {
  return <TextField type="search" size="small" placeholder="Search this page" value={value} onChange={(event) => onChange(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search meetings on this page' }, input: { startAdornment: <InputAdornment position="start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></InputAdornment> } }} sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 260 }, '& .MuiInputBase-root': { height: 32, fontSize: 12 }, '& .MuiInputBase-input': { py: .75 } }} />;
}
