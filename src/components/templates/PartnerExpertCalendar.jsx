import { useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { getAccessToken, getAuthUser } from '@/util/authSession';
import { indiaDateTime } from '@/util/vendorMeetings.mjs';
import { lockViewportScroll } from '@/util/stableDialogScrollLock.mjs';
import ScheduleMeetingForm from '@/components/vendor/meetings/ScheduleMeetingForm';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import styles from './PartnerHomePage.module.css';

export default function PartnerExpertCalendar() {
  const [today, setToday] = useState(null);
  const [date, setDate] = useState(null);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  useEffect(() => { setToday(dayjs(indiaDateTime().slice(0, 10))); }, []);
  useEffect(() => {
    if (!open) return undefined;
    return lockViewportScroll(document.documentElement, window.innerWidth);
  }, [open]);
  function continueBooking() {
    const role = String(getAuthUser()?.role || '').toUpperCase();
    setSignedIn(Boolean(getAccessToken()) && ['VENDOR', 'AGENT'].includes(role));
    setOpen(true);
  }
  function close() { if (!busy) setOpen(false); }
  return <aside className={styles.expertCard} aria-labelledby="partner-expert-title">
    <p className={styles.expertEyebrow}>LET'S GROW YOUR BUSINESS</p>
    <h2 id="partner-expert-title">Meet with our expert</h2>
    <p>Pick a date to discuss your business, leads and getting started with Epic.</p>
    <div className={styles.expertMeta}><span>Video consultation</span><span>India Standard Time</span></div>
    {today ? <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar value={date} onChange={setDate} minDate={today} referenceDate={today} reduceAnimations fixedWeekNumber={6} sx={{ width: '100%', maxWidth: 300, height: 280, '& .MuiPickersCalendarHeader-root': { mt: 1, mx: 1 }, '& .MuiPickersCalendarHeader-label': { fontSize: 13, fontWeight: 600 }, '& .MuiDayCalendar-weekDayLabel': { width: 30, height: 26, mx: .2, fontSize: 10 }, '& .MuiPickerDay-root': { width: 30, height: 30, mx: .2, fontSize: 12 }, '& .MuiDayCalendar-weekContainer': { my: .2 }, '& .MuiPickerDay-root.Mui-selected': { bgcolor: '#a00032' } }} />
    </LocalizationProvider> : <div className={styles.calendarLoading} role="status">Loading calendar...</div>}
    <button className={styles.primary} type="button" disabled={!date} onClick={continueBooking}>{date ? `Continue with ${date.format('DD MMM')}` : 'Select a date to continue'} <span aria-hidden="true">&rarr;</span></button>
    <small>Choose your preferred time in the next step.</small>
    <Dialog open={open} onClose={close} disableScrollLock maxWidth="sm" fullWidth aria-labelledby="partner-expert-dialog-title" slotProps={{ paper: { sx: { maxWidth: 740, borderRadius: 3 } } }}>
      <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h2 id="partner-expert-dialog-title">Meet with our expert</h2><IconButton aria-label="Close meeting scheduler" disabled={busy} onClick={close} sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', bgcolor: '#fff1f5', color: '#a00032', border: '1px solid #f2c9d4', boxShadow: '0 3px 10px rgba(143, 31, 63, 0.14)', '&:hover': { bgcolor: '#fce0ea', boxShadow: '0 4px 12px rgba(143, 31, 63, 0.22)' }, '&:focus-visible': { outline: '2px solid #a00032', outlineOffset: 3 }, '&.Mui-disabled': { bgcolor: '#f4efef', boxShadow: 'none' } }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></IconButton></DialogTitle>
      <DialogContent dividers>{open && (signedIn ? <ScheduleMeetingForm initialDate={date?.format('YYYY-MM-DD')} onCancel={close} onBusyChange={setBusy} onSuccess={(message) => { setBusy(false); setOpen(false); setSuccess(message); }} /> : <div className="space-y-4 py-4 text-sm leading-6"><p>Sign in to your partner account to choose a time and request a meeting with our team.</p><div className="flex flex-wrap gap-3"><Link className={styles.primary} href="/partner/login">Sign in to schedule</Link><Link className={styles.login} href="/partner/sign-up">Create a partner account</Link></div></div>)}</DialogContent>
    </Dialog>
    <ApiStatusModal status={success ? 'success' : null} title="Meeting requested" text={success} onOk={() => setSuccess('')} />
  </aside>;
}
