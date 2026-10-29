import { useState } from "react";

function PhoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="m6.6 10.8 2.8-1.3a1 1 0 0 0 .5-1.2L8.4 3.8A1 1 0 0 0 7.3 3L3.8 4A1 1 0 0 0 3 5c.4 8.7 7.3 15.6 16 16a1 1 0 0 0 1-.8l1-3.5a1 1 0 0 0-.8-1.1l-4.5-1.5a1 1 0 0 0-1.2.5l-1.3 2.8a14.8 14.8 0 0 1-6.6-6.6Z" /></svg>;
}

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 21 1.4-4.6a9 9 0 1 1 3.2 3.2L3 21Z" /><path d="M8 7c-2 3 3 8 6 9l2-2-3-2-1 1-2-2 1-1-2-3H8Z" fill="currentColor" strokeWidth=".5" /></svg>;
}

export default function VendorActions({ vendor, onEnquire }) {
  const [revealed, setRevealed] = useState(false);
  const phone = (vendor.phone || "").replace(/[^+\d]/g, "");
  const rawWhatsapp = vendor.whatsapp || phone;
  let whatsapp = rawWhatsapp.replace(/\D/g, "");
  if (vendor.countryCode === "IN" && whatsapp.length === 10) whatsapp = `91${whatsapp}`;
  const canWhatsapp = whatsapp.length >= 11 && whatsapp.length <= 15;
  return <div className="vd-contact-block"><div className="vd-actions vd-jd-actions">
    {revealed && phone ? <a className="vd-contact vd-call" href={`tel:${phone}`}><PhoneIcon />{vendor.phone}</a> : <button type="button" className="vd-contact vd-call" onClick={() => setRevealed(true)}><PhoneIcon />Show Number</button>}
    <button type="button" className="vd-enquire" onClick={onEnquire} disabled={!vendor.slug} title={!vendor.slug ? "This vendor is not available for enquiries yet" : undefined}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>Send Enquiry</button>
    {canWhatsapp ? <a className="vd-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />WhatsApp</a> : <button type="button" className="vd-whatsapp" disabled title="WhatsApp number not provided by this business"><WhatsAppIcon />WhatsApp</button>}
  </div>{revealed && !phone && <p className="vd-contact-note" role="status">Phone number not provided. Send an enquiry for more information.</p>}</div>;
}
