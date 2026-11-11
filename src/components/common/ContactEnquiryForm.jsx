import { useEffect, useRef, useState } from 'react';
import { Alert, Button, MenuItem, TextField } from '@mui/material';
import { submitContactEnquiry } from '@/util/contactMessages.mjs';

export default function ContactEnquiryForm({ embedded = false }) {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    if (!['name', 'subject', 'message'].every((key) => String(payload[key] || '').trim())) {
      setError('Please complete your name, subject and message.'); return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true); setNotice(''); setError('');
    try {
      const message = await submitContactEnquiry(payload, { signal: controller.signal });
      if (!controller.signal.aborted) { setNotice(message); form.reset(); }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message || 'Unable to submit your enquiry. Please try again.');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false); }
    }
  }

  return <section id="enquiry-form" className={embedded ? 'min-w-0 scroll-mt-8' : 'mx-auto max-w-4xl scroll-mt-8 px-4 py-10 sm:px-6'}>
    <div className="rounded-2xl border border-rose-100 bg-white p-6 sm:p-8">
      <h2 className="portal-section-heading text-center font-serif font-bold">Enquiry Form</h2>
      <p className="mt-3 text-sm leading-6 text-stone-600">Share your wedding plans and the services you need.</p>
      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit} aria-busy={pending}>
        <TextField name="name" label="Full Name" autoComplete="name" required fullWidth disabled={pending} size="small" slotProps={{ htmlInput: { maxLength: 150 } }} />
        <TextField name="email" label="Email Address" type="email" autoComplete="email" required fullWidth disabled={pending} size="small" />
        <TextField name="phone" label="Phone Number" type="tel" autoComplete="tel" required fullWidth disabled={pending} size="small" slotProps={{ htmlInput: { pattern: '[0-9]{10}', maxLength: 10, title: 'Enter a 10-digit phone number' } }} />
        <TextField name="userType" label="I am a" select defaultValue="CLIENT" required fullWidth disabled={pending} size="small"><MenuItem value="CLIENT">Client</MenuItem><MenuItem value="VENDOR">Vendor / Partner</MenuItem></TextField>
        <TextField name="subject" label="Subject" required fullWidth disabled={pending} size="small" className="sm:col-span-2" slotProps={{ htmlInput: { maxLength: 250 } }} />
        <TextField name="message" label="Your Message" multiline minRows={5} required fullWidth disabled={pending} className="sm:col-span-2" />
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}><TextField name="website" label="Website" autoComplete="off" slotProps={{ htmlInput: { tabIndex: -1 } }} /></div>
        <Button type="submit" variant="contained" disabled={pending} sx={{ justifySelf: 'start', borderRadius: 10, bgcolor: '#b61f4b', px: 3, textTransform: 'none', '&:hover': { bgcolor: '#981a3f' } }}>{pending ? 'Submitting...' : 'Submit Enquiry'}</Button>
        {error && <Alert severity="error" className="sm:col-span-2">{error}</Alert>}
        {notice && <Alert severity="success" className="sm:col-span-2">{notice}</Alert>}
      </form>
    </div>
  </section>;
}
