import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export default function PropertyFeedback({ feedback, onClose }) {
    const success = feedback?.status === 'success';
    return <Dialog open={Boolean(feedback)} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock aria-labelledby="property-feedback-title" aria-describedby="property-feedback-message" slotProps={{ paper: { sx: { borderRadius: 2, p: 1, textAlign: 'center' } } }}>
        <div className={`mx-auto mt-5 grid h-14 w-14 place-items-center rounded-full ${success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" />{success ? <path d="m7 12 3 3 7-7" /> : <path d="M12 7v6m0 4h.01" />}</svg></div>
        <DialogTitle id="property-feedback-title">{feedback?.title || (success ? 'Property updated' : 'Unable to complete the request')}</DialogTitle>
        <DialogContent><DialogContentText id="property-feedback-message">{feedback?.message}</DialogContentText></DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}><Button type="button" autoFocus variant="contained" onClick={onClose} sx={{ minWidth: 100, textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>OK</Button></DialogActions>
    </Dialog>;
}
