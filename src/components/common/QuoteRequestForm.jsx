import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Alert, Autocomplete, Button, InputAdornment, TextField } from '@mui/material';
import useCities from '@/util/useCities';
import useFooterCategories from '@/util/useFooterCategories';
import { getPublicCatalog } from '@/util/publicCatalog.mjs';
import { loadPublicServiceSubcategories } from '@/util/serviceCategories.mjs';
import { enquiryDateToday, enquiryPhoneInput, enquiryPhoneInputProps, enquirySuccessMessage } from '@/util/vendorEnquiries.mjs';
import { sendQuoteLead, validateQuoteLead } from '@/util/quoteLeads.mjs';
import styles from './QuoteModal.module.css';

function QuoteIcon({ name }) {
  const paths = {
    customerName: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    customerPhone: <path d="m8 3 3 5-2 2a15 15 0 0 0 5 5l2-2 5 3-1 4C11 22 2 13 4 4Z" />,
    customerEmail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    eventDate: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18m5 5 3 3 5-5" /></>,
    guestCount: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2" /></>,
    budgetMin: <><path d="m12 2 10 6-10 6L2 8Zm-9 11 9 5 9-5M3 18l9 5 9-5" /></>,
    cityId: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    message: <path d="M4 5h16M4 10h16M4 15h16M4 20h10" />,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.guestCount}</svg>;
}

export default function QuoteRequestForm({ onClose }) {
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', cityId: '', serviceSubcategoryId: '', eventDate: '', guestCount: '', budgetMin: '', budgetMax: '', message: '' });
  const [categoryId, setCategoryId] = useState('');
  const [subcategories, setSubcategories] = useState({ items: [], loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const requestRef = useRef(null);
  const formRef = useRef(null);
  const cityState = useCities();
  const catalog = useFooterCategories();
  const categories = catalog.items.filter((item) => item.isActive !== false);
  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!categoryId) return undefined;
    const controller = new AbortController();
    loadPublicServiceSubcategories(getPublicCatalog, categoryId, { signal: controller.signal }).then((items) => {
      if (!controller.signal.aborted) setSubcategories({ items: items.filter((item) => item.isActive !== false), loading: false, error: '' });
    }).catch(() => {
      if (!controller.signal.aborted) setSubcategories({ items: [], loading: false, error: 'Unable to load services. Please try again.' });
    });
    return () => controller.abort();
  }, [categoryId, attempt]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: name === 'customerPhone' ? enquiryPhoneInput(value) : value }));
    setErrors((current) => ({ ...current, [name]: '' })); setError('');
  }
  function selectCategory(category) {
    setCategoryId(category?.id || '');
    update('serviceSubcategoryId', '');
    setErrors((current) => ({ ...current, categoryId: '' }));
    setSubcategories({ items: [], loading: Boolean(category), error: '' });
  }

  async function submit(event) {
    event.preventDefault();
    if (requestRef.current) return;
    const next = validateQuoteLead(form);
    if (!categoryId) next.categoryId = 'Choose a category first.';
    if (form.cityId && !cityState.cities.some((item) => item.id === form.cityId)) next.cityId = 'Choose a city from the list.';
    if (form.serviceSubcategoryId && !subcategories.items.some((item) => item.id === form.serviceSubcategoryId)) next.serviceSubcategoryId = 'Choose a service from this category.';
    setErrors(next);
    if (Object.keys(next).length) { formRef.current?.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
    const controller = new AbortController(); requestRef.current = controller;
    setPending(true); setError('');
    try {
      const response = await sendQuoteLead(form, { signal: controller.signal });
      if (!controller.signal.aborted) setSuccess({ message: enquirySuccessMessage(response, 'Your quote request has been submitted successfully.') });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.name === 'TimeoutError' ? 'The request timed out. Please try again.' : failure.message || 'Unable to send your request. Please try again.');
    } finally {
      if (!controller.signal.aborted) { requestRef.current = null; setPending(false); }
    }
  }

  function field(name, label, type = 'text', extra = {}) {
    const { min, step, maxLength, ...props } = extra;
    return <TextField className={styles.field} id={`quote-${name}`} name={name} label={label} placeholder={`${label} *`} type={type} value={form[name]} onChange={(event) => update(name, event.target.value)} disabled={pending} required fullWidth size="small" error={Boolean(errors[name])} helperText={errors[name]} slotProps={{ htmlInput: { min, step, maxLength, ...(name === 'customerPhone' ? enquiryPhoneInputProps : {}) }, input: { notched: false, startAdornment: <InputAdornment position="start"><QuoteIcon name={name} /></InputAdornment> }, inputLabel: { shrink: true } }} {...props} />;
  }
  function dropdown(name, label, options, value, onChange, loading, disabled = false) {
    return <Autocomplete id={`quote-${name}`} className={styles.field} size="small" options={options} value={value || null} onChange={(_, option) => onChange(option)} getOptionLabel={(option) => option.label || option.name} isOptionEqualToValue={(a, b) => a.id === b.id} loading={loading} disabled={pending || disabled} noOptionsText={loading ? 'Loading options…' : 'No options available'} renderInput={(params) => <TextField {...params} name={name} label={label} placeholder={`${label} *`} required error={Boolean(errors[name])} helperText={errors[name]} slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true }, input: { ...params.slotProps.input, notched: false, startAdornment: <><InputAdornment position="start"><QuoteIcon name={name} /></InputAdornment>{params.slotProps.input.startAdornment}</> } }} />} />;
  }

  return <div className={styles.panel}>
    <svg width="0" height="0" className={styles.curve} aria-hidden="true"><defs><clipPath id="quote-image-curve" clipPathUnits="objectBoundingBox"><path d="M0 0H1C.78 .22 .89 .48 .88 .67C.87 .85 .8 .96 .66 1H0Z" /></clipPath></defs></svg>
    <aside className={styles.visual}><div className={styles.photo}><Image src="/images/content/vendor-enquiry-portrait.png" alt="A floral wedding arch overlooking a palace lake at sunset" fill sizes="(min-width: 768px) 400px, 100vw" className={styles.image} /><div className={styles.shade} /><div className={styles.visualCopy}><h3>A Celebration<br />Made for You</h3><ul>{['Verified Vendors', 'Personalized Quotes', 'Hassle-Free Planning'].map((label) => <li key={label}><span aria-hidden="true">✓</span>{label}</li>)}</ul></div></div></aside>
    <div className={styles.content}>
    <button type="button" className={styles.close} onClick={onClose} aria-label="Close quote form"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    {success ? <div className={styles.success} role="status"><span aria-hidden="true">✓</span><p className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</p><h2 id="quote-request-title">Quote request sent</h2><p>{success.message}</p><p>We’ve received your requirements for {subcategories.items.find((item) => item.id === form.serviceSubcategoryId)?.name} in {cityState.cities.find((item) => item.id === form.cityId)?.name}.</p><Button className={styles.submit} variant="contained" onClick={onClose}>Done</Button></div> : <>
      <header className={styles.header}><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={92} height={48} className={styles.logo} /><h2 id="quote-request-title">Your vision. The right vendors.</h2><p>Tell us what you have in mind and request quotes for your celebration.</p></header>
      <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending} className={styles.form}>
        <div className={styles.contactGrid}>{field('customerName', 'Full name', 'text', { autoComplete: 'name', maxLength: 150, autoFocus: true })}{field('customerPhone', 'Phone number', 'tel', { autoComplete: 'tel-national', maxLength: 10 })}<div className={styles.full}>{field('customerEmail', 'Email address', 'email', { autoComplete: 'email', maxLength: 254 })}</div></div>
        <div className={styles.eventGrid}>
          {dropdown('cityId', 'Event city', cityState.cities, cityState.cities.find((item) => item.id === form.cityId), (item) => update('cityId', item?.id || ''), cityState.loading)}
          {dropdown('categoryId', 'Category', categories, categories.find((item) => item.id === categoryId), selectCategory, catalog.loading)}
          {dropdown('serviceSubcategoryId', 'Service', subcategories.items, subcategories.items.find((item) => item.id === form.serviceSubcategoryId), (item) => update('serviceSubcategoryId', item?.id || ''), subcategories.loading, !categoryId || subcategories.loading)}
        </div>
        {(cityState.error || catalog.error || subcategories.error) && <Alert severity="error" className={styles.catalogError}>{cityState.error && <div>{cityState.error} <button type="button" onClick={cityState.retry}>Retry cities</button></div>}{catalog.error && <div>{catalog.error} <button type="button" onClick={catalog.retry}>Retry categories</button></div>}{subcategories.error && <div>{subcategories.error} <button type="button" onClick={() => { setSubcategories((current) => ({ ...current, loading: true, error: '' })); setAttempt((current) => current + 1); }}>Retry services</button></div>}</Alert>}
        <div className={styles.twoColumns}>{field('eventDate', 'Event date', 'date', { min: enquiryDateToday() })}{field('guestCount', 'Number of guests', 'number', { min: 1, step: 1 })}</div>
        <div className={styles.twoColumns}>{field('budgetMin', 'Minimum budget (₹)', 'number', { min: 0, step: '0.01' })}{field('budgetMax', 'Maximum budget (₹)', 'number', { min: 0, step: '0.01' })}</div>
        <TextField className={styles.field} name="message" id="quote-message" label="Tell us a little more" multiline rows={2} required fullWidth size="small" value={form.message} onChange={(event) => update('message', event.target.value)} disabled={pending} error={Boolean(errors.message)} helperText={errors.message} placeholder="Tell us a little more *" slotProps={{ htmlInput: { maxLength: 5000 }, inputLabel: { shrink: true }, input: { notched: false, startAdornment: <InputAdornment position="start"><QuoteIcon name="message" /></InputAdornment> } }} />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" className={styles.submit} variant="contained" disabled={pending} aria-label="Submit quote request">{pending ? 'Sending your request…' : <>Continue <span aria-hidden="true">→</span></>}</Button>
      </form>
    </>}
    </div>
  </div>;
}
