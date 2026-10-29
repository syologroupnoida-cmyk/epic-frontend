import { useState } from 'react';
import ViewportFit from './ViewportFit';
import styles from './QuoteModal.module.css';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import useMediaQuery from '@mui/material/useMediaQuery';
import QuoteRequestForm from './QuoteRequestForm';

export default function QuoteModal({ isOpen, onClose }) {
  const [fit, setFit] = useState({ width: 0, height: 0, scale: 1 });
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  return <Dialog open={Boolean(isOpen)} onClose={onClose} maxWidth={false} disableScrollLock aria-labelledby="quote-request-title" slots={{ transition: Slide }} transitionDuration={reduceMotion ? 0 : { enter: 320, exit: 200 }} slotProps={{ transition: { direction: 'down' }, backdrop: { sx: { backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', backgroundColor: 'rgba(28,15,22,.48)' } }, paper: { sx: { width: fit.width ? fit.width * fit.scale : 'min(900px, calc(100vw - 24px))', height: fit.height ? fit.height * fit.scale : 'auto', boxSizing: 'content-box', m: '11px', maxWidth: 'calc(100vw - 22px)', maxHeight: 'calc(100dvh - 22px)', borderRadius: '30px', border: '1px solid #fff', overflow: 'hidden' } } }}>{isOpen && <ViewportFit className={styles.canvas} scale={fit.scale} onFit={setFit}><QuoteRequestForm onClose={onClose} /></ViewportFit>}</Dialog>;
}
