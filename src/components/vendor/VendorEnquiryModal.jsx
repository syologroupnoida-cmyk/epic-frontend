import ViewportFit from '@/components/common/ViewportFit';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Slide from '@mui/material/Slide';
import useMediaQuery from '@mui/material/useMediaQuery';
import { enquiryDateToday, enquiryPhoneInput, enquiryPhoneInputProps, enquirySuccessMessage, sendVendorEnquiry, sendServiceEnquiry, sendVenueEnquiry, validateVendorEnquiry, validateServiceEnquiry } from '@/util/vendorEnquiries.mjs';
import styles from './VendorEnquiryModal.module.css';
import { venueEnquiryPresentation } from '@/util/venueEnquiryPresentation.mjs';

function FieldIcon({ kind }) {
  const paths = {
    customerName: <><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></>,
    customerPhone: <path d="m8 3 3 5-2 2a15 15 0 0 0 5 5l2-2 5 3-1 4C11 22 2 13 4 4Z" />,
    customerEmail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    eventDate: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18m-14 4h3" /></>,
    guestCount: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2" /></>,
    message: <><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 10h.01M12 10h.01M17 10h.01" /></>,
    heart: <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-2 12 12 21 12 21S26 12 20 5Z" />,
    shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" /><path d="m8 12 3 3 5-5" /></>,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] || paths.guestCount}</svg>;
}

function newAdditionChallenge() {
  const digits = new Uint32Array(2);
  globalThis.crypto.getRandomValues(digits);
  return { left: digits[0] % 9 + 1, right: digits[1] % 9 + 1 };
}

function EnquiryForm({ recipient, service, venue, onClose }) {
  const noEmail = service || venue;
  const [failedImage, setFailedImage] = useState('');
  const sideImage = recipient.image && recipient.image !== failedImage ? recipient.image : recipient.fallbackImage || '/images/content/vendor-enquiry-portrait.png';
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', eventDate: '', guestCount: '', message: '' });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [challenge, setChallenge] = useState(newAdditionChallenge);
  const [answer, setAnswer] = useState('');
  const [planning, setPlanning] = useState('');
  const controller = useRef(null);
  const formRef = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'customerPhone' ? enquiryPhoneInput(value) : value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (controller.current) return;
    const nextErrors = noEmail ? validateServiceEnquiry(form) : validateVendorEnquiry(form);
    if (!/^\d{1,2}$/.test(answer.trim()) || Number(answer) !== challenge.left + challenge.right) nextErrors.verification = 'Enter the correct answer to continue.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setPending(true); setError('');
    try {
      const response = await (venue ? sendVenueEnquiry : service ? sendServiceEnquiry : sendVendorEnquiry)(recipient.slug, { ...form, message: planning ? `${planning}: ${form.message}` : form.message }, { signal: request.signal });
      if (!request.signal.aborted) { setSuccessMessage(enquirySuccessMessage(response)); setSent(true); }
    } catch (failure) {
      if (!request.signal.aborted) setError(failure.name === 'TimeoutError' ? 'The request timed out. Please try again.' : failure.message || 'Unable to send your enquiry. Please try again.');
    } finally {
      if (!request.signal.aborted) { controller.current = null; setPending(false); }
    }
  }

  function field(name, label, type = 'text', extra = {}) {
    const { maxLength, min, step, ...props } = extra;
    return <TextField className={styles.field} id={`enquiry-${name}`} name={name} label={label} type={type} value={form[name]} onChange={change} required fullWidth size="small" variant="outlined" disabled={pending} error={Boolean(errors[name])} helperText={errors[name]} color="primary" slotProps={{ htmlInput: { maxLength, min, step, ...(name === 'customerPhone' ? enquiryPhoneInputProps : {}) }, input: { startAdornment: <InputAdornment position="start"><FieldIcon kind={name} /></InputAdornment> }, inputLabel: { shrink: true } }} {...props} />;
  }

  return <div className={styles.layout}>
    <svg width="0" height="0" className={styles.curveDefinition} aria-hidden="true"><defs><clipPath id="vendor-enquiry-image-curve" clipPathUnits="objectBoundingBox"><path d="M0 0H1C.78 .22 .89 .48 .88 .67C.87 .85 .8 .96 .66 1H0Z" /></clipPath></defs></svg>
    <aside className={styles.visual}>
      <div className={styles.visualPhoto}>
        <Image src={sideImage} alt={recipient.imageAlt || "A rose-covered wedding arch with glowing lanterns overlooking a palace lake at sunset"} unoptimized={Boolean(recipient.image)} onError={() => setFailedImage(sideImage)} fill sizes="(min-width: 768px) 520px, 100vw" className={styles.image} />
        <div className={styles.imageShade} />
        <div className={styles.visualCopy}><span>PLAN YOUR</span><h2>{venue ? 'Dream Wedding Venue' : 'Dream Celebration'}</h2><div className={styles.occasions}><span><FieldIcon kind="heart" />Weddings</span><span><FieldIcon kind="heart" />Engagements</span><span><FieldIcon kind="guestCount" />Events</span></div></div>
      </div>
    </aside>
    <div className={styles.content}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close enquiry form"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
      {sent ? <div className={styles.success} role="status"><span aria-hidden="true">✓</span><h2 id="vendor-enquiry-title">Enquiry sent</h2><p>{successMessage}</p><p>Your enquiry has been sent to <strong>{recipient.name}</strong>. The provider can contact you using the details you shared.</p><button type="button" className={styles.submit} onClick={onClose}>Done</button></div> : <>
        <Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={88} height={48} className={styles.logo} />
        <h2 id="vendor-enquiry-title" className={styles.title}>Tell us about your celebration</h2><p className={styles.subtitle}>Share a few details about your celebration with <strong>{recipient.name}</strong>.</p>
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
          <div className={styles.fields}>
            {field('customerName', 'Full name', 'text', { autoComplete: 'name', maxLength: 150, placeholder: 'Your name', autoFocus: true })}
            {field('customerPhone', 'Phone number', 'tel', { autoComplete: 'tel-national', maxLength: 10, placeholder: 'Your phone number' })}
            {!noEmail && field('customerEmail', 'Email address', 'email', { autoComplete: 'email', maxLength: 254, placeholder: 'you@example.com' })}
            {field('eventDate', 'Event date', 'date', { min: enquiryDateToday() })}
            {field('guestCount', 'Number of guests', 'number', { min: 1, step: 1, placeholder: 'e.g. 250' })}
            <TextField select className={`${styles.field} ${noEmail ? styles.full : ''}`} label={venue ? "Your venue plans" : "Your wedding plans"} value={planning} onChange={(event) => setPlanning(event.target.value)} disabled={pending} size="small" fullWidth slotProps={{ select: { MenuProps: { disableScrollLock: true } }, inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start"><FieldIcon kind="guestCount" /></InputAdornment> } }}>{(venue ? ['Venue availability', 'Wedding package details', 'Venue visit', 'Other requirements'] : ['Complete wedding planning', 'Venue and vendor booking', 'Engagement celebration', 'Other event']).map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>
            <TextField className={`${styles.field} ${styles.full}`} id="enquiry-message" name="message" label="Your celebration" multiline rows={2} value={form.message} onChange={change} slotProps={{ htmlInput: { maxLength: 5000 }, inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start"><FieldIcon kind="message" /></InputAdornment> } }} placeholder="Tell us about your celebration (e.g. location, style, requirements)" size="small" fullWidth disabled={pending} required error={Boolean(errors.message)} helperText={errors.message} />
            <div className={`${styles.verification} ${styles.full}`}>
              <div className={styles.challenge}><strong aria-label={`${challenge.left} plus ${challenge.right} equals what?`}>{challenge.left} + {challenge.right} = ?</strong></div>
              <TextField className={styles.field} id="enquiry-verification" name="verification" label="Your answer" value={answer} onChange={(event) => { setAnswer(event.target.value.replace(/\D/g, '').slice(0, 2)); setErrors((current) => ({ ...current, verification: '' })); }} slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 2, 'aria-label': `Answer to ${challenge.left} plus ${challenge.right}` } }} size="small" disabled={pending} required error={Boolean(errors.verification)} helperText={errors.verification} />
              <button type="button" className={styles.refresh} disabled={pending} aria-label="Get a new verification question" title="Refresh verification" onClick={() => { setChallenge(newAdditionChallenge()); setAnswer(''); setErrors((current) => ({ ...current, verification: '' })); formRef.current?.elements.namedItem('verification')?.focus(); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></svg></button>
            </div>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={pending} className={styles.submit}>{pending ? 'Sending enquiry…' : <>Send enquiry <span aria-hidden="true">&rarr;</span></>}</button>
          <div className={styles.features}><span><FieldIcon kind="message" />Direct enquiries</span><span><FieldIcon kind="shield" />Wedding professionals</span><span><FieldIcon kind="guestCount" />Personalised planning</span></div>
        </form>
      </>}
    </div>
  </div>;
}

function FittedEnquiryContent({ recipient, service, venue, onClose, scale, onFit }) {
  return <ViewportFit className={styles.canvas} scale={scale} onFit={onFit}><EnquiryForm recipient={recipient} service={service} venue={venue} onClose={onClose} /></ViewportFit>;
}

export default function VendorEnquiryModal({ vendor, listing, property, isOpen, onClose }) {
  const recipient = property ? { slug: property.slug || property.venuePropertySlug, name: property.title, ...venueEnquiryPresentation(property) } : listing ? { slug: listing.slug || listing.listingSlug, name: listing.title } : vendor;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [fit, setFit] = useState({ width: 0, height: 0, scale: 1 });
  return <Dialog open={Boolean(isOpen && recipient?.slug)} onClose={onClose} maxWidth={false} disableScrollLock aria-labelledby="vendor-enquiry-title" slots={{ transition: Slide }} transitionDuration={reduceMotion ? 0 : { enter: 380, exit: 240 }} slotProps={{ transition: { direction: 'down' }, container: { sx: { overflow: 'hidden' } }, backdrop: { sx: { backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', backgroundColor: 'rgba(28, 15, 22, 0.48)' } }, paper: { sx: { borderRadius: '30px', border: '1px solid rgba(255,255,255,.85)', boxSizing: 'content-box', boxShadow: '0 28px 90px rgba(31, 9, 20, .3)', m: '11px', width: fit.width ? fit.width * fit.scale : 'min(980px, calc(100vw - 24px))', height: fit.height ? fit.height * fit.scale : 'auto', maxWidth: 'calc(100vw - 22px)', maxHeight: 'calc(100dvh - 22px)', overflow: 'hidden' } } }}>{isOpen && recipient?.slug && <FittedEnquiryContent key={`${property ? 'venue' : listing ? 'service' : 'vendor'}:${recipient.slug}`} recipient={recipient} service={Boolean(listing)} venue={Boolean(property)} onClose={onClose} scale={fit.scale} onFit={setFit} />}</Dialog>;
}
