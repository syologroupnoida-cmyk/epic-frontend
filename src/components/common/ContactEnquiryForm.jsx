import { useState } from 'react';
import { contactDetails } from '@/data/websiteContent.mjs';

export default function ContactEnquiryForm({ embedded = false }) {
  const [notice, setNotice] = useState('');
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [...data.entries()].map(([key, value]) => `${key}: ${String(value).trim()}`).join('\n');
    window.location.href = `mailto:${contactDetails.email}?subject=${encodeURIComponent('Wedding enquiry - ' + data.get('Full Name'))}&body=${encodeURIComponent(body)}`;
    setNotice('Your enquiry is ready in your email app. Send the email to complete your request.');
  }
  const inputClass = 'w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-[#b61f4b]';
  return <section id="enquiry-form" className={embedded ? 'min-w-0 scroll-mt-8' : 'mx-auto max-w-4xl scroll-mt-8 px-4 py-10 sm:px-6'}><div className="rounded-2xl border border-rose-100 bg-white p-6 sm:p-8"><h2 className="text-center font-serif text-3xl font-bold">Enquiry Form</h2><p className="mt-3 text-sm leading-6 text-stone-600">Share your plans with {contactDetails.email} using your email app.</p><form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
    {[['Full Name', 'text', true], ['Email Address', 'email', true], ['Mobile Number', 'tel', true], ['Wedding City', 'text', true], ['Wedding Date', 'date', false], ['Services Required', 'text', true]].map(([name, type, required]) => <label key={name} className="grid gap-2 text-sm font-semibold text-stone-700"><span>{name}{required ? ' *' : ''}</span><input className={inputClass} name={name} type={type} required={required} autoComplete={name === 'Full Name' ? 'name' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined} /></label>)}
    <label className="grid gap-2 text-sm font-semibold text-stone-700 sm:col-span-2"><span>Your Message *</span><textarea className={inputClass} name="Your Message" rows={5} required /></label><button type="submit" className="justify-self-start rounded-full bg-[#b61f4b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#981a3f]">Submit Enquiry</button>{notice && <p role="status" className="text-sm text-stone-600 sm:col-span-2">{notice}</p>}
  </form></div></section>;
}
