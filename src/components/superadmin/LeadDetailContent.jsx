import { useState } from 'react';
import Image from 'next/image';
import { leadLabel } from '@/util/adminLeads.mjs';
import { leadDate } from '@/util/vendorLeads.mjs';
import { publicMediaUrl } from '@/util/marketplaceListings.mjs';

const label = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
const groups = { requirement: 'Requirement', source: 'Source', targetVendor: 'Target vendor', pricing: 'Pricing', review: 'Review', closure: 'Closure' };
const visibleEntries = (values) => Object.entries(values).filter(([key]) => !/(?:userId|slug|ByAdminId)$/i.test(key));

function LeadImage({ url, title }) {
  const [failedUrl, setFailedUrl] = useState('');
  if (failedUrl === url) return <span className="text-xs text-slate-500">Image unavailable</span>;
  return <Image src={url} alt={title} width={96} height={96} unoptimized onError={() => setFailedUrl(url)} className="h-24 w-24 rounded-lg border border-slate-200 bg-white object-contain p-1" />;
}

function readable(value, key) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.map((item) => readable(item, key)).join(', ') : 'None';
  if (typeof value === 'object') return visibleEntries(value).map(([name, item]) => `${label(name)}: ${readable(item, name)}`).join('; ');
  if (typeof value === 'string' && /(?:At|Date)$/.test(key) && /^\d{4}-\d{2}-\d{2}/.test(value)) return leadDate(value, key.endsWith('At'));
  if (/budget|price/i.test(key) && Number.isFinite(Number(value))) return Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  if (['status', 'leadType', 'sourceType', 'type'].includes(key)) return leadLabel(value);
  return String(value);
}
function Fields({ values, prefix = '' }) {
  return visibleEntries(values).map(([key, value]) => {
    const title = `${prefix}${label(key)}`;
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length) return <Fields key={key} values={value} prefix={`${title} / `} />;
    const imageUrl = /(?:logo|image|photo|cover)(?:Url)?$/i.test(key) ? publicMediaUrl(value) : '';
    return <div key={key} className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-3 ${/message|reason|description|notes/i.test(key) ? 'sm:col-span-3' : ''}`}><dt className="break-words text-xs leading-6 text-slate-500">{imageUrl ? title.replace(/\s+Url$/i, '') : title}</dt><dd className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{imageUrl ? <LeadImage url={imageUrl} title={title.replace(/\s+Url$/i, '')} /> : readable(value, key)}</dd></div>;
  });
}

export default function LeadDetailContent({ lead }) {
  const remaining = Object.fromEntries(Object.entries(lead).filter(([key]) => key !== 'customer' && !(key in groups)));
  return <div className="space-y-5">
    {lead.customer && <dl className="grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-3"><Fields values={lead.customer} /></dl>}
    {!!Object.keys(remaining).length && <dl className="grid gap-4 sm:grid-cols-3"><Fields values={remaining} /></dl>}
    {Object.entries(groups).map(([key, title]) => lead[key] && <section key={key} className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3><dl className="grid gap-4 sm:grid-cols-3"><Fields values={typeof lead[key] === 'object' ? lead[key] : { [key]: lead[key] }} /></dl></section>)}
  </div>;
}
