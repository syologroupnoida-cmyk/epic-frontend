export default function ShopTableState({ title, error, onRetry }) {
  return <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-5" role={error ? 'alert' : 'status'}>
    <span className={`grid h-14 w-14 place-items-center rounded-full ${error ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{error ? <><path d="m12 3 10 17H2L12 3Z" /><path d="M12 9v4m0 3h.01" /></> : <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 5V3h8v2M8 10h8m-8 4h5" /></>}</svg></span>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {error && <p className="text-xs leading-5 text-slate-500">{error}</p>}
    {onRetry && <button type="button" className="rounded border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-[#b61f4b] hover:bg-rose-50" onClick={onRetry}>Try again</button>}
  </div>;
}
