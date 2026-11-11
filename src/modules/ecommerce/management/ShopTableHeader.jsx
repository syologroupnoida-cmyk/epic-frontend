export default function ShopTableHeader({ title, children }) {
  return <header className="shrink-0 border-b border-slate-200">
    <div className="border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">{title}</h1></div>
    <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-3" data-shop-table-toolbar="true">{children}</div>
  </header>;
}
