import { useEffect, useRef, useState } from 'react';

export default function ContactEnquiryForm({ embedded = false }) {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries([...data.entries()].map(([key, value]) => [key, String(value).trim()]));
    const controller = new AbortController();
    request.current = controller;
    setPending(true); setNotice(''); setError('');
    try {
      const response = await fetch('/api/contact-enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || 'Unable to submit your enquiry. Please try again.');
      if (!controller.signal.aborted) setNotice(result.message);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message || 'Unable to submit your enquiry. Please try again.');
    } finally {
      if (!controller.signal.aborted) { request.current = null; setPending(false); }
    }
  }
  const inputClass = 'w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#b61f4b]';
  return <section id="enquiry-form" className={embedded ? 'min-w-0 scroll-mt-8' : 'mx-auto max-w-4xl scroll-mt-8 px-4 py-10 sm:px-6'}><div className="rounded-2xl border border-rose-100 bg-white p-6 sm:p-8"><h2 className="text-center font-serif text-3xl font-bold">Enquiry Form</h2><p className="mt-3 text-sm leading-6 text-stone-600">Share your wedding plans and the services you need.</p><form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit} aria-busy={pending}>
    {[['fullName', 'Full Name', 'text', true], ['email', 'Email Address', 'email', true], ['mobileNumber', 'Mobile Number', 'tel', true], ['weddingCity', 'Wedding City', 'text', true], ['weddingDate', 'Wedding Date', 'date', false], ['servicesRequired', 'Services Required', 'text', true]].map(([name, label, type, required]) => <label key={name} className="grid gap-2 text-sm font-semibold text-stone-700"><span>{label}{required ? ' *' : ''}</span><input className={inputClass} name={name} type={type} required={required} disabled={pending} autoComplete={name === 'fullName' ? 'name' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined} /></label>)}
    <label className="grid gap-2 text-sm font-semibold text-stone-700 sm:col-span-2"><span>Your Message *</span><textarea className={inputClass} name="message" rows={5} required disabled={pending} /></label><button type="submit" disabled={pending} className="justify-self-start rounded-full bg-[#b61f4b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#981a3f] disabled:cursor-wait disabled:opacity-60">{pending ? 'Submitting...' : 'Submit Enquiry'}</button>{error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
  </form></div></section>;
}
