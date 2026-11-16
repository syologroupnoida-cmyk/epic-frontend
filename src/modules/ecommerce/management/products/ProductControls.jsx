export const buttonClass = 'rounded border border-rose-200 px-4 py-2 text-xs font-semibold text-[#b61f4b] hover:bg-rose-50 disabled:opacity-50';
export const primaryClass = 'rounded bg-[#b61f4b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#981a40] disabled:opacity-50';
export const productSelectSlotProps = { select: { MenuProps: { disableScrollLock: true } } };
export function ProductField({ label, children }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-stone-600"><span>{label}</span>{children}</label>;
}
export const inputClass = 'w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[#b61f4b] disabled:bg-stone-100';
