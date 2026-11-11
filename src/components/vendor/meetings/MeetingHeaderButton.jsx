import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import ScheduleMeetingForm from './ScheduleMeetingForm';
import styles from './MeetingHeaderButton.module.css';

export default function MeetingHeaderButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  function close() { if (!busy) setOpen(false); }
  return <>
        <Tooltip title={open ? '' : 'Schedule a meeting'} arrow placement="bottom">
        <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Schedule a video meeting" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? 'vendor-meeting-scheduler' : undefined}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-4v12l-6-4" /></svg>
        </button>
        </Tooltip>
        <Dialog open={open} onClose={(_, reason) => { if (reason !== 'backdropClick') close(); }} fullWidth maxWidth="sm" aria-labelledby="vendor-meeting-scheduler-title" slotProps={{ paper: { id: 'vendor-meeting-scheduler', sx: { maxWidth: 740, borderRadius: 3 } } }}>
          <DialogTitle component="div" className={styles.dialogHeader}><h2 id="vendor-meeting-scheduler-title">Schedule a meeting</h2><IconButton className={styles.closeButton} size="small" aria-label="Close meeting scheduler" disabled={busy} onClick={close}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></IconButton></DialogTitle>
          <DialogContent dividers>{open && <ScheduleMeetingForm onBusyChange={setBusy} onCancel={close} onSuccess={(message) => { setBusy(false); setOpen(false); setSuccess(message); }} />}</DialogContent>
        </Dialog>
    <ApiStatusModal status={success ? 'success' : null} title="Meeting requested" text={success} onOk={() => setSuccess('')} />
  </>;
}
