import { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogContent, DialogTitle } from '@mui/material';
import MainApi from '@/util/MainApi';
import { fetchSubscriptionPlans, setSubscriptionPlanActive, subscriptionPlanError, subscriptionPlanId } from '@/util/subscriptionPlans.mjs';
import SubscriptionPlanCard, { SubscriptionPlanStatus } from './SubscriptionPlanCard';
import SubscriptionPlanEditor from './SubscriptionPlanEditor';
import styles from './SubscriptionPlans.module.css';

export default function SubscriptionPlans() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const [editor, setEditor] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const actionRequest = useRef(null);
  useEffect(() => () => actionRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchSubscriptionPlans(MainApi, { signal: controller.signal }).then((plans) => {
      if (!controller.signal.aborted) setResult({ attempt, plans });
    }).catch((error) => { if (!controller.signal.aborted) setResult({ attempt, error: subscriptionPlanError(error), plans: [] }); });
    return () => controller.abort();
  }, [attempt]);
  const current = result?.attempt === attempt ? result : null;
  async function toggleActive(plan) {
    const id = subscriptionPlanId(plan);
    if (!id || actionRequest.current) return;
    const controller = new AbortController(); actionRequest.current = controller;
    setBusyId(id); setFeedback(null);
    try {
      const response = await setSubscriptionPlanActive(MainApi, id, !plan.isActive, controller.signal);
      if (!controller.signal.aborted) {
        setFeedback({ success: true, message: response.message });
        setEditor((previous) => previous?.plan && subscriptionPlanId(previous.plan) === id ? { plan: { ...previous.plan, isActive: !plan.isActive } } : previous);
        setAttempt((value) => value + 1);
        return true;
      }
    } catch (error) {
      if (!controller.signal.aborted) setFeedback({ success: false, message: subscriptionPlanError(error) });
    } finally { if (!controller.signal.aborted) { actionRequest.current = null; setBusyId(''); } }
  }
  return <section className={styles.layout}>
    <div className={styles.header}><div><h1>Subscription Plans</h1><p>Manage pricing, limits and benefits for each plan.</p></div>{!editor && <Button variant="contained" disabled={Boolean(busyId)} onClick={() => setEditor({ plan: null })} sx={{ textTransform: 'none', bgcolor: '#b61f4b', fontSize: 12, '&:hover': { bgcolor: '#981a3f' } }}>+ Create plan</Button>}</div>
    <div className={styles.body}>
      {feedback && !feedback.success && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>{feedback.message}</Alert>}
      {!editor && current?.error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
      {editor ? <SubscriptionPlanEditor key={editor.plan ? subscriptionPlanId(editor.plan) : 'new-plan'} plan={editor.plan} activating={Boolean(busyId)} onToggleActive={toggleActive} onClose={() => setEditor(null)} onSaved={(message) => { setEditor(null); setFeedback({ success: true, message }); setAttempt((value) => value + 1); }} /> : !current ? <div className={styles.empty} role="status"><CircularProgress size={28} aria-label="Loading subscription plans" /></div> : current.error ? <p className={styles.empty}>Subscription plans could not be loaded.</p> : !current.plans.length ? <p className={styles.empty}>No subscription plans found.</p> : <div className={styles.grid}>{current.plans.map((plan, index) => {
        const id = subscriptionPlanId(plan);
        return <SubscriptionPlanCard key={id || index} plan={plan}><SubscriptionPlanStatus active={plan.isActive} name={plan.displayName} disabled={!id || Boolean(busyId)} onChange={() => toggleActive(plan)} /><div className="flex items-center gap-1"><Button size="small" disabled={!id || Boolean(busyId)} onClick={() => setEditor({ plan })} startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5M4 15 15.5 3.5a3.54 3.54 0 0 1 5 5L9 20l-6 1 1-6Z" /></svg>} sx={{ textTransform: 'none', fontSize: 11, color: '#b61f4b' }}>Edit plan</Button></div></SubscriptionPlanCard>;
      })}</div>}
    </div>
    <Dialog open={Boolean(feedback?.success)} onClose={() => setFeedback(null)} disableScrollLock maxWidth="xs" fullWidth aria-labelledby="subscription-success-title" aria-describedby="subscription-success-message" slotProps={{ paper: { sx: { borderRadius: 3, p: 2, textAlign: 'center' } } }}>
      <div className={styles.successIcon} aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg></div>
      <DialogTitle id="subscription-success-title" sx={{ fontSize: 19, fontWeight: 600, pb: 1 }}>Plan saved successfully</DialogTitle>
      <DialogContent><p id="subscription-success-message" className={styles.successMessage}>{feedback?.success ? feedback.message : ''}</p><Button variant="contained" fullWidth onClick={() => setFeedback(null)} sx={{ mt: 3, textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>Done</Button></DialogContent>
    </Dialog>
  </section>;
}
