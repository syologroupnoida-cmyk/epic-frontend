import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const icons = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  people: "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z",
  store: "M4 6h16v2H4V6Zm1 4h14l-1 10H6L5 10Zm2-8h10l2 3H5l2-3Z",
  calendar: "M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H4v10h16V10Z",
  leads: "M12 2 2 7l10 5 10-5-10-5Zm0 12L4 10v7l8 5 8-5v-7l-8 4Z",
  chart: "M5 9.2h3V19H5V9.2Zm5.5-4.2h3V19h-3V5Zm5.5 7h3v7h-3v-7Z",
  settings: "M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65-2-3.46-2.49 1a7.28 7.28 0 0 0-1.69-.98L15 3h-4l-.36 2.93c-.6.23-1.16.56-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.07.65-.07.98s.02.66.07.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.74 1.69.98L11 21h4l.36-2.93c.6-.23 1.16-.56 1.69-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z",
  profile: "M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z",
  expand: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6Z",
  collapse: "M14 6 8 12l6 6 1.41-1.41L10.83 12l4.58-4.59L14 6Z",
  arrow: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z",
  logout: "M17 7 15.59 8.41 18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5ZM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5Z",
};

const menu = [
  { label: "Overview", icon: "dashboard", sub: ["Today summary", "Targets"] },
  { label: "Leads", icon: "leads", sub: ["New leads", "Follow ups", "Closed"] },
  { label: "Clients", icon: "people", sub: ["Families", "Meetings", "Notes"] },
  { label: "Bookings", icon: "calendar", sub: ["Visits", "Events", "Calendar"] },
  { label: "Vendors", icon: "store", sub: ["Shortlists", "Quotes", "Partners"] },
  { label: "Settings", icon: "settings", sub: ["Profile", "Notifications", "Account"] },
];

const metrics = [
  { label: "New Leads", value: "126", change: "+10%", icon: "leads" },
  { label: "Meetings", value: "34", change: "+7%", icon: "calendar" },
  { label: "Vendor Matches", value: "89", change: "+14%", icon: "store" },
  { label: "Closed Deals", value: "18", change: "+6%", icon: "chart" },
];

const activities = ["Bride inquiry assigned for Jaipur palace venue", "Catering shortlist shared with Mumbai client", "Photographer availability confirmed", "Destination wedding follow-up scheduled"];

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true"><path d={icons[name] || icons.dashboard} /></svg>;
}

export default function AgentDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState("Overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const expanded = !collapsed || hovered;

  return (
    <div className="min-h-screen bg-[#f7f2ef] text-stone-900">
      <aside onMouseEnter={() => collapsed && setHovered(true)} onMouseLeave={() => setHovered(false)} className={`fixed inset-y-0 left-0 z-40 border-r border-rose-100 bg-white shadow-sm transition-all duration-200 ${expanded ? "w-72" : "w-20"}`}>
        <Link href="/" className="flex h-20 items-center justify-center border-b border-rose-100 px-4"><Image src="/images/epic-logo.webp" alt="Epic Wedz" width={142} height={50} priority className={`${expanded ? "h-12" : "h-10"} w-auto object-contain`} /></Link>
        <nav className="space-y-1 px-3 py-5">{menu.map((item, index) => <div key={item.label}><button type="button" onClick={() => setOpenMenu((current) => current === item.label ? "" : item.label)} className={`flex h-12 w-full items-center rounded px-3 text-sm font-semibold transition hover:bg-rose-50 hover:text-[#b61f4b] ${index === 0 ? "bg-rose-50 text-[#b61f4b]" : "text-stone-700"} ${expanded ? "justify-between gap-3" : "justify-center"}`} title={item.label}><span className="flex items-center gap-3"><Icon name={item.icon} />{expanded ? item.label : null}</span>{expanded ? <span className={`${openMenu === item.label ? "rotate-180" : ""} transition`}><Icon name="arrow" /></span> : null}</button>{expanded && openMenu === item.label ? <div className="dashboard-submenu ml-8 mt-1 grid gap-1 pb-2">{item.sub.map((sub) => <Link key={sub} href="#" className="rounded px-3 py-2 text-xs font-semibold text-stone-500 hover:bg-rose-50 hover:text-[#b61f4b]">{sub}</Link>)}</div> : null}</div>)}</nav>
      </aside>
      <div className={`transition-all duration-200 ${expanded ? "pl-72" : "pl-20"}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-rose-100 bg-white/95 px-6 shadow-sm backdrop-blur"><div className="flex items-center gap-4"><button type="button" onClick={() => setCollapsed((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-rose-100 text-stone-700 hover:border-[#b61f4b] hover:text-[#b61f4b]" aria-label="Toggle sidebar"><Icon name={collapsed ? "expand" : "collapse"} /></button><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b61f4b]">Agent</p><h1 className="mt-1 font-serif text-2xl font-bold text-stone-950">Dashboard</h1></div></div><div className="relative"><button type="button" onClick={() => setProfileOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-rose-100 text-[#b61f4b] hover:bg-rose-50" aria-label="Profile"><Icon name="profile" /></button><div className={`absolute right-0 top-full mt-3 w-64 rounded border border-rose-100 bg-white p-3 shadow-xl transition duration-150 ${profileOpen ? "pointer-events-auto visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"}`}><div className="flex items-center gap-3 border-b border-rose-100 pb-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-[#b61f4b]"><Icon name="profile" /></span><div><p className="font-bold text-stone-950">Agent Partner</p><p className="text-xs font-semibold text-stone-500">agent@epicwedz.com</p></div></div><button type="button" className="mt-2 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="logout" /> Logout</button></div></div></header>
        <main className="p-6">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <div key={metric.label} className="rounded border border-rose-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded bg-rose-50 text-[#b61f4b]"><Icon name={metric.icon} /></span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{metric.change}</span></div><p className="mt-5 font-serif text-3xl font-bold text-stone-950">{metric.value}</p><p className="mt-1 text-sm font-semibold text-stone-500">{metric.label}</p></div>)}</section>
          <section className="mt-6 rounded border border-rose-100 bg-white p-5 shadow-sm"><h2 className="font-serif text-2xl font-bold text-stone-950">Recent Activity</h2><div className="mt-5 grid gap-3 lg:grid-cols-2">{activities.map((activity) => <div key={activity} className="flex items-center gap-3 rounded border border-rose-100 bg-[#fff9f5] p-4"><span className="h-2.5 w-2.5 rounded-full bg-[#b61f4b]" /><p className="text-sm font-semibold text-stone-700">{activity}</p></div>)}</div></section>
        </main>
      </div>
    </div>
  );
}
