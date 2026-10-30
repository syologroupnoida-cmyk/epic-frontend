import { FormControlLabel, Switch } from '@mui/material';
import { subscriptionPlanColors } from '@/util/subscriptionPlans.mjs';
import styles from './SubscriptionPlans.module.css';

export function SubscriptionPlanStatus({ active, disabled, onChange, name }) {
  return <FormControlLabel sx={{ m: 0, gap: 0.5, '& .MuiFormControlLabel-label': { fontSize: 11, color: active ? '#047857' : '#64748b' } }} control={<Switch size="small" checked={Boolean(active)} disabled={disabled} onChange={onChange} slotProps={{ input: { 'aria-label': `${name || 'Plan'} active status` } }} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#b61f4b' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#b61f4b' } }} />} label={active ? 'Active' : 'Inactive'} />;
}
const price = (value) => value === '' || value == null || !Number.isFinite(Number(value)) ? 'Not set' : Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

export default function SubscriptionPlanCard({ plan, children, action, statusBadge }) {
  const [accent, soft] = subscriptionPlanColors(plan.theme);
  const benefits = Array.isArray(plan.benefits) ? plan.benefits.filter((item) => typeof item === 'string' && item.trim()) : [];
  return <article className={`${styles.card} ${plan.isFeatured ? styles.featured : ''}`} style={{ '--plan-accent': accent, '--plan-soft': soft }}>
    {(plan.badgeText || plan.isFeatured) && <p className={styles.badge}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m3 6 4 4 5-7 5 7 4-4-3 13H6L3 6Zm3 16h12" /></svg>{plan.badgeText || 'Most popular'}</p>}
    <div className={styles.cardContent}>
      {statusBadge}
      <div className={styles.planIdentity}><span className={styles.planIcon} aria-hidden="true"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{plan.isFeatured ? <path d="M3 8 7 3h10l4 5-9 13L3 8Zm0 0h18M7 3l5 18 5-18M7 8l5-5 5 5" /> : /BASIC|FREE|STARTER/i.test(plan.code || plan.kind || '') ? <path d="m3 10 18-7-7 18-4-7-7-4Zm7 4L21 3M10 14v6l3-3" /> : <path d="m3 6 4 4 5-7 5 7 4-4-3 13H6L3 6Zm3 16h12" />}</svg></span><p className={styles.code}>{plan.code || 'PLAN CODE'}{plan.isDefault ? ' / DEFAULT' : ''}</p></div>
      <h3>{plan.displayName || 'Your plan name'}</h3>
      {plan.shortDescription && <p className={styles.description}>{plan.shortDescription}</p>}
      <div className={styles.price}><strong>{price(plan.monthlyPrice)}</strong><span>/ month</span></div>
      <p className={styles.leadPrice}>Direct lead price: <strong>{price(plan.directLeadPrice)}</strong></p>
      {benefits.length > 0 && <ul className={styles.benefits}>{benefits.map((benefit, index) => <li key={index}><span className={styles.benefitCheck} aria-hidden="true"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m4 8 3 3 5-6" /></svg></span><div>{benefit.split(/(\d[\d,.]*\+?)/g).map((part, position) => position % 2 ? <strong key={position}>{part}</strong> : part)}</div></li>)}</ul>}
      {action || <span className={styles.cta}>{plan.ctaText || 'Choose plan'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></span>}
    </div>
    {children && <footer className={styles.cardFooter}>{children}</footer>}
  </article>;
}
