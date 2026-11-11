import { useEffect, useRef, useState } from 'react';
import { Alert, Button, TextField } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import MainApi from '@/util/MainApi';
import { defaultMeetingTimes, indiaDateTime, meetingError, meetingTimeDisabled, requestSalesMeeting, selectMeetingDates, validateMeetingRequest } from '@/util/vendorMeetings.mjs';
import styles from './ScheduleMeetingForm.module.css';

const calendarSx = { width: '100%', maxWidth: 320, height: 306, '& .MuiPickersCalendarHeader-root': { mx: 1.5, mt: 1 }, '& .MuiPickersCalendarHeader-label': { fontSize: 13, fontWeight: 600 }, '& .MuiDayCalendar-weekDayLabel': { width: 30, height: 28, mx: .15, fontSize: 11 }, '& .MuiPickerDay-root': { width: 30, height: 30, mx: .15, fontSize: 12 }, '& .MuiDayCalendar-weekContainer': { my: .25 }, '& .MuiPickerDay-root.Mui-selected': { bgcolor: '#b61f4b' } };

function MeetingRangeDay({ day, rangeStart, rangeEnd, ...props }) {
  const date = day.format('YYYY-MM-DD');
  const endpoint = date === rangeStart || date === rangeEnd;
  const inside = rangeStart && rangeEnd && date > rangeStart && date < rangeEnd;
  return <PickerDay {...props} day={day} selected={endpoint} sx={inside ? { bgcolor: '#fce7ef', borderRadius: 1, color: '#9d174d', '&:hover': { bgcolor: '#fbcfe8' } } : undefined} />;
}

export default function ScheduleMeetingForm({ onSuccess, onCancel, onBusyChange, initialDate = '' }) {
  const [dates, setDates] = useState({ start: initialDate, end: initialDate });
  const [rangePart, setRangePart] = useState('start');
  const [times, setTimes] = useState(defaultMeetingTimes);
  const [openTime, setOpenTime] = useState(null);
  const [vendorNote, setVendorNote] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const request = useRef(null);
  const today = dayjs(indiaDateTime().slice(0, 10));
  const values = { requestedStartAt: dates.start ? `${dates.start}T${times.start}` : '', requestedEndAt: dates.end ? `${dates.end}T${times.end}` : '', vendorNote };
  useEffect(() => () => request.current?.abort(), []);
  function changeDate(value) {
    if (!value?.isValid()) return;
    const selection = selectMeetingDates(dates, value.format('YYYY-MM-DD'), rangePart);
    setDates(selection.dates); setRangePart(selection.nextPart);
    setErrors({}); setError('');
  }
  function changeTime(which, value) {
    setTimes((current) => ({ ...current, [which]: value }));
    setErrors({}); setError('');
  }
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    const validation = validateMeetingRequest(values);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    const controller = new AbortController(); request.current = controller;
    setSaving(true); setError(''); onBusyChange?.(true);
    try {
      const result = await requestSalesMeeting(MainApi, values, controller.signal);
      if (!controller.signal.aborted) onSuccess(result.message);
    } catch (failure) { if (!controller.signal.aborted) setError(meetingError(failure)); }
    finally { if (!controller.signal.aborted) { request.current = null; setSaving(false); onBusyChange?.(false); } }
  }
  return <form onSubmit={submit} className={styles.form} aria-label="Schedule a sales meeting" aria-busy={saving}>
    {error && <Alert severity="error">{error}</Alert>}
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <div className={styles.layout}>
        <div className={styles.calendar}>
          <h3 id="meeting-date-range-label" aria-live="polite">{dates.start ? dayjs(dates.start).format('DD MMM YYYY') : 'Start date'} → {dates.end ? dayjs(dates.end).format('DD MMM YYYY') : 'End date'}</h3>
          <DateCalendar value={dates[rangePart] ? dayjs(dates[rangePart]) : dates.start ? dayjs(dates.start) : null} onChange={changeDate} minDate={today} referenceDate={today} disabled={saving} reduceAnimations fixedWeekNumber={6} aria-labelledby="meeting-date-range-label" slots={{ day: MeetingRangeDay }} slotProps={{ day: { rangeStart: dates.start, rangeEnd: dates.end } }} sx={calendarSx} />
          {errors.requestedStartAt && !dates.start && <p role="alert" className={styles.error}>{errors.requestedStartAt}</p>}{errors.requestedEndAt && !dates.end && <p role="alert" className={styles.error}>{errors.requestedEndAt}</p>}
        </div>
      <div className={styles.timePanel}>
        <h3>Meeting time</h3>
        {['start', 'end'].map((part) => <DesktopTimePicker key={part} name={`${part}Time`} label={part === 'start' ? 'Start time' : 'End time'} value={times[part] ? dayjs(`2000-01-01T${times[part]}`) : null} onChange={(value) => changeTime(part, value?.isValid() ? value.format('HH:mm') : '')} open={openTime === part} onOpen={() => setOpenTime(part)} onClose={() => setOpenTime(null)} disabled={saving} ampm={false} format="HH:mm" timeSteps={{ minutes: 1 }} shouldDisableTime={(value, view) => meetingTimeDisabled(dates[part] || dates.start || indiaDateTime().slice(0, 10), value.format('HH:mm'), view, Date.now(), part === 'end' && dates.start && (!dates.end || dates.end === dates.start) ? values.requestedStartAt : undefined)} slotProps={{ textField: { required: true, fullWidth: true, size: 'small', error: Boolean(errors[part === 'start' ? 'requestedStartAt' : 'requestedEndAt']), helperText: dates[part] ? errors[part === 'start' ? 'requestedStartAt' : 'requestedEndAt'] : undefined, onClick: () => { if (!saving) setOpenTime(part); }, sx: { cursor: 'pointer', '& .MuiPickersInputBase-root': { cursor: 'pointer' } } }, openPickerButton: { onClick: (event) => { event.stopPropagation(); setOpenTime((current) => current === part ? null : part); } } }} />)}
        <TextField className={styles.note} name="vendorNote" label="Meeting note" required value={vendorNote} onChange={(event) => { setVendorNote(event.target.value); setErrors((current) => ({ ...current, vendorNote: '' })); setError(''); }} multiline minRows={3} fullWidth size="small" disabled={saving} error={Boolean(errors.vendorNote)} helperText={errors.vendorNote} placeholder="What would you like to discuss?" />
        <div className={styles.actions}><Button type="button" onClick={onCancel} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button><Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#b61f4b', textTransform: 'none' }}>{saving ? 'Requesting...' : 'Request meeting'}</Button></div>
      </div>
    </div>
    </LocalizationProvider>
  </form>;
}
