import { Tooltip } from '@mui/material';
import { meetingLink } from '@/util/vendorMeetings.mjs';
import styles from './MeetingHeaderButton.module.css';

export default function MeetingJoinButton({ meeting }) {
  const link = meetingLink(meeting);
  if (String(meeting?.status).toUpperCase() !== 'CONFIRMED' || !link) return null;
  const tooltip = meeting.scheduledStartAt && Number.isFinite(Date.parse(meeting.scheduledStartAt))
    ? `Join meeting at ${new Date(meeting.scheduledStartAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`
    : 'Join meeting';
  return <Tooltip title={tooltip} arrow>
    <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Join video meeting (opens in a new tab)" className={styles.joinTrigger}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 6-4v12l-6-4" /></svg>
    </a>
  </Tooltip>;
}
