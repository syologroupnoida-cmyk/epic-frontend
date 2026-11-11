import { Chip } from '@mui/material';
import { meetingLabel } from '@/util/vendorMeetings.mjs';

export function meetingStatusSx(status) {
  const color = ({ PENDING: '#b45309', CONFIRMED: '#15803d', REJECTED: '#b91c1c', CANCELLED: '#64748b', COMPLETED: '#1d4ed8' })[String(status || '').toUpperCase()] || '#64748b';
  return { color, borderColor: color };
}

export default function MeetingStatusChip({ status }) {
  return <Chip size="small" variant="outlined" label={meetingLabel(status) || 'Not provided'} sx={{ fontSize: 11, ...meetingStatusSx(status) }} />;
}
