import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, IconButton, InputAdornment, TextField } from '@mui/material';
import MainApi from '@/util/MainApi';
import { planFormValues, planIntegerFields, planMoneyFields, saveSubscriptionPlan, subscriptionFieldErrors, subscriptionPlanChanges, subscriptionPlanError, subscriptionPlanId, subscriptionPlanColors, validateSubscriptionPlan } from '@/util/subscriptionPlans.mjs';
import SubscriptionPlanCard, { SubscriptionPlanStatus } from './SubscriptionPlanCard';
import styles from './SubscriptionPlans.module.css';

const limits = [
  ['maxActiveServiceListings', 'Active service listings'], ['maxActiveVenueProperties', 'Active venue properties'],
  ['maxDirectLeadPurchasesPerMonth', 'Direct lead purchases / month'], ['maxSharedLeadPurchasesPerMonth', 'Shared lead purchases / month'],
  ['maxMediaPerListing', 'Media files per listing'], ['featuredListingSlots', 'Featured listing slots'],
];
const flags = [['isFeatured', 'Featured plan'], ['isDefault', 'Default plan'], ['isPurchasable', 'Available to purchase']];

export default function SubscriptionPlanEditor({ plan = null, onClose, onSaved, onToggleActive, activating = false }) {
  const [values, setValues] = useState(() => planFormValues(plan || {}));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  const formRef = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const locked = pending || activating;
  const changed = !plan || Object.keys(subscriptionPlanChanges(values, plan)).length > 0;
  function update(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' })); setError('');
  }
  async function submit(event) {
    event.preventDefault();
    if (request.current || activating || !changed) return;
    const validation = validateSubscriptionPlan(values, plan);
    setErrors(validation);
    if (Object.keys(validation).length) { formRef.current?.elements.namedItem(Object.keys(validation)[0])?.focus(); return; }
    const controller = new AbortController(); request.current = controller;
    setPending(true); setError('');
    try {
      const result = await saveSubscriptionPlan(MainApi, values, plan, controller.signal);
      if (!controller.signal.aborted) onSaved(result.message);
    } catch (failure) {
      if (!controller.signal.aborted) { setError(subscriptionPlanError(failure)); setErrors(subscriptionFieldErrors(failure)); }
    } finally { if (!controller.signal.aborted) { request.current = null; setPending(false); } }
  }
  function field(name, label, extra = {}) {
    const numeric = planIntegerFields.includes(name) || planMoneyFields.includes(name);
    const required = ['code', 'kind', 'displayName', 'theme', 'ctaText'].includes(name) || numeric;
    return <TextField id={`subscription-${name}`} name={name} label={label} value={values[name] ?? ''} onChange={(event) => update(name, ['code', 'kind', 'theme'].includes(name) ? event.target.value.toUpperCase() : event.target.value)} type={numeric ? 'number' : 'text'} required={required} disabled={locked} fullWidth size="small" error={Boolean(errors[name])} helperText={errors[name]} slotProps={{ htmlInput: numeric ? { min: 0, step: planIntegerFields.includes(name) ? 1 : '0.01' } : {} }} {...extra} />;
  }
  return <section className={styles.editorPanel} aria-labelledby="subscription-editor-title">
    <div className={styles.editorHeader}><h2 id="subscription-editor-title">{plan ? 'Edit subscription plan' : 'Create subscription plan'}</h2><Button disabled={locked} size="small" onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Back to plans</Button></div>
    <div className={styles.editorContent}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <div className={styles.editor}>
        <form id="subscription-plan-form" ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className={styles.form}>
          <section className={styles.formSection}><h3>Plan identity</h3><div className={styles.fields}>
            {field('code', 'Plan code', { placeholder: 'BASIC', autoFocus: true })}{field('kind', 'Plan kind', { placeholder: 'PAID' })}
            {field('displayName', 'Display name', { placeholder: 'Basic Growth' })}
            <div className={styles.wide}>{field('shortDescription', 'Short description', { multiline: true, rows: 2 })}</div>
          </div></section>
          <section className={styles.formSection}><h3>Pricing</h3><div className={styles.fields}>{field('monthlyPrice', 'Monthly price (INR)')}{field('directLeadPrice', 'Direct lead price (INR)')}{field('sortOrder', 'Sort order')}</div></section>
          <section className={styles.formSection}><h3>Listing and lead limits</h3><div className={styles.fields}>{limits.map(([name, title]) => <div key={name}>{field(name, title)}</div>)}</div></section>
          <section className={styles.formSection}><h3>Benefits</h3><div className={styles.benefitRows}>
            {values.benefits.map((benefit, index) => <div key={index} className={styles.benefitRow}><TextField size="small" fullWidth disabled={locked} label={`Benefit ${index + 1}`} value={benefit} onChange={(event) => update('benefits', values.benefits.map((item, position) => position === index ? event.target.value : item))} /><IconButton disabled={locked} size="small" aria-label={`Remove benefit ${index + 1}`} onClick={() => update('benefits', values.benefits.filter((_, position) => position !== index))}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" /></svg></IconButton></div>)}
            {errors.benefits && <p className="text-xs text-red-700">{errors.benefits}</p>}
            <Button disabled={locked} onClick={() => update('benefits', [...values.benefits, ''])} size="small" sx={{ justifySelf: 'start', textTransform: 'none', color: '#b61f4b' }}>+ Add benefit</Button>
          </div></section>
          <section className={styles.formSection}><h3>Card appearance</h3><div className={styles.fields}>{field('badgeText', 'Badge text', { placeholder: 'Most Popular' })}{field('theme', 'Theme color', { type: 'color', value: subscriptionPlanColors(values.theme)[0], slotProps: { inputLabel: { shrink: true }, htmlInput: { 'aria-label': 'Custom theme color' }, input: { endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: 11 } }}>{subscriptionPlanColors(values.theme)[0]}</InputAdornment> } }, sx: { '& input[type="color"]': { cursor: 'pointer', minWidth: 0 } } })}{field('ctaText', 'Button text', { placeholder: 'Upgrade to Basic' })}</div></section>
          <section className={styles.formSection}><h3>Availability</h3><div className={styles.flags}><SubscriptionPlanStatus active={plan ? plan.isActive : values.isActive} name={values.displayName} disabled={locked || Boolean(plan && !subscriptionPlanId(plan))} onChange={async (event) => { if (!plan) update('isActive', event.target.checked); else if (onToggleActive && await onToggleActive(plan)) setValues((previous) => ({ ...previous, isActive: !plan.isActive })); }} />{flags.map(([name, title]) => <FormControlLabel key={name} control={<Checkbox name={name} size="small" checked={Boolean(values[name])} disabled={locked} onChange={(event) => update(name, event.target.checked)} sx={{ '&.Mui-checked': { color: '#b61f4b' } }} />} label={title} sx={{ '& .MuiFormControlLabel-label': { fontSize: 12 } }} />)}</div></section>
        </form>
        <aside className={styles.preview} aria-label="Live subscription card preview"><p>Live card preview</p><SubscriptionPlanCard plan={values} /></aside>
      </div>
    </div>
    <div className={styles.editorActions}><Button disabled={locked} onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button><Button type="submit" form="subscription-plan-form" variant="contained" disabled={locked || !changed} sx={{ textTransform: 'none', bgcolor: '#b61f4b', '&:hover': { bgcolor: '#981a3f' } }}>{pending ? 'Saving plan...' : plan ? 'Save changes' : 'Create plan'}</Button></div>
  </section>;
}
