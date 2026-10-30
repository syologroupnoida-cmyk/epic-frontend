import useDismissibleDropdown from "@/util/useDismissibleDropdown";
import AccountProfileInfo from "@/components/common/AccountProfileInfo";
import Image from "next/image";
import useAuthUser from "@/util/useAuthUser";
import Link from "next/link";
import { useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import useAuthLogout from "@/util/useAuthLogout";

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
  { label: "Dashboard", icon: "dashboard", sub: [] },
  { label: "My Wedding", icon: "leads", sub: ["Checklist", "Budget", "Guest list"] },
  { label: "Shortlist", icon: "store", sub: ["Venues", "Vendors", "Favorites"] },
  { label: "Bookings", icon: "calendar", sub: ["Visits", "Confirmed", "Pending"] },
  { label: "Profile", icon: "profile", sub: ["Account", "Family details", "Preferences"] },
  { label: "Settings", icon: "settings", sub: ["Notifications", "Privacy", "Support"] },
];

const overviewStats = [
  { label: "Saved Vendors", value: "42", change: "+9%", icon: "store", tone: "rose" },
  { label: "Upcoming Visits", value: "6", change: "+3%", icon: "calendar", tone: "gold" },
  { label: "Quotes Received", value: "15", change: "+11%", icon: "people", tone: "rose" },
  { label: "Planning Tasks", value: "28", change: "+5%", icon: "chart", tone: "gold" },
];

const budgetTrend = [
  { label: "Venue", value: 72 },
  { label: "Decor", value: 46 },
  { label: "Photo", value: 38 },
  { label: "Cater", value: 58 },
  { label: "Makeup", value: 24 },
  { label: "Music", value: 18 },
  { label: "Invite", value: 14 },
];

const recentQuotes = [
  { id: "#QT-2184", vendor: "Royal Orchid", service: "Wedding Venue", city: "Delhi NCR", date: "12 Dec 2026", amount: "Rs. 2.5L", status: "Shortlisted" },
  { id: "#QT-2183", vendor: "Candid Frames", service: "Photography", city: "Mumbai", date: "28 Nov 2026", amount: "Rs. 1.2L", status: "Quoted" },
  { id: "#QT-2182", vendor: "Royal Rasoi", service: "Catering", city: "Jaipur", date: "05 Dec 2026", amount: "Rs. 1.8L", status: "Visit" },
  { id: "#QT-2181", vendor: "Dreamz Decor", service: "Decoration", city: "Bengaluru", date: "20 Nov 2026", amount: "Rs. 3.1L", status: "Pending" },
];

const upcomingPlans = [
  { title: "Venue visit", text: "Royal Orchid, Delhi NCR at 11:30 AM" },
  { title: "Photography call", text: "Review album package and delivery timeline" },
  { title: "Finalize guest list", text: "28 names still pending confirmation" },
];

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true"><path d={icons[name] || icons.dashboard} /></svg>;
}

function UserDashboardOverview() {
  const maxBudget = Math.max(...budgetTrend.map((item) => item.value));
  const toneClasses = {
    rose: "bg-rose-100 text-[#8d1230]",
    gold: "bg-amber-100 text-[#b8750d]",
  };
  const statusClasses = {
    Shortlisted: "bg-rose-100 text-rose-700",
    Quoted: "bg-sky-100 text-sky-700",
    Visit: "bg-amber-100 text-amber-700",
    Pending: "bg-stone-100 text-stone-600",
  };

  return (
    <div className="grid gap-4 text-[13px] text-stone-800">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-full ${toneClasses[stat.tone]}`}><Icon name={stat.icon} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-stone-500">{stat.label}</p>
                <p className="mt-1 font-serif text-[30px] font-bold leading-none text-stone-950">{stat.value}</p>
              </div>
              <div className="flex h-8 items-end gap-1 text-[#d9a650]" aria-hidden="true">
                {[40, 58, 74, 92].map((height) => <span key={height} className="block w-1 rounded-full bg-current opacity-70" style={{ height: `${height}%` }} />)}
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] font-medium text-stone-500"><span className="text-emerald-600">{stat.change}</span><span>this week</span></p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="mt-1 text-[#8d1230]"><Icon name="chart" /></span>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-950">Budget Overview</h3>
              <p className="mt-1 text-xs font-medium text-stone-500">Category-wise planning estimate</p>
            </div>
          </div>
          <div className="mt-6 grid h-[255px] grid-cols-7 items-end gap-4 border-b border-l border-stone-200 px-4 pb-4">
            {budgetTrend.map((item) => (
              <div key={item.label} className="flex h-full flex-col justify-end gap-2">
                <div className="rounded-t-lg bg-gradient-to-t from-[#8d1230] to-[#d9a650]" style={{ height: `${Math.max(18, (item.value / maxBudget) * 100)}%` }} />
                <p className="truncate text-center text-[11px] font-medium text-stone-500">{item.label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3">
            <span className="mt-1 text-[#8d1230]"><Icon name="leads" /></span>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-950">Planning Status</h3>
              <p className="mt-1 text-xs font-medium text-stone-500">Wedding checklist progress</p>
            </div>
          </div>
          <div className="mt-7 grid place-items-center gap-6">
            <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#8d1230_0_62%,#d98991_62%_82%,#d5a04f_82%_100%)]">
              <div className="absolute inset-9 grid place-items-center rounded-full bg-white text-center shadow-inner">
                <p className="font-serif text-2xl font-bold text-stone-950">62%</p>
                <p className="text-[11px] font-medium text-stone-500">Completed</p>
              </div>
            </div>
            <div className="grid w-full gap-3 text-xs">
              {["Completed 28", "In review 9", "Pending 17"].map((item, index) => <p key={item} className="flex justify-between text-stone-600"><span>{item}</span><span>{[62, 20, 18][index]}%</span></p>)}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(330px,0.9fr)]">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex gap-3"><span className="mt-1 text-[#8d1230]"><Icon name="calendar" /></span><div><h3 className="font-serif text-xl font-bold text-stone-950">Recent Quotes</h3><p className="mt-1 text-xs font-medium text-stone-500">Latest vendor responses for your wedding</p></div></div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-xs">
              <thead><tr className="bg-stone-50 text-[11px] font-semibold text-stone-700"><th className="rounded-l px-3 py-3">Quote ID</th><th className="px-3 py-3">Vendor</th><th className="px-3 py-3">Service</th><th className="px-3 py-3">Event Date</th><th className="px-3 py-3">Amount</th><th className="rounded-r px-3 py-3">Status</th></tr></thead>
              <tbody>{recentQuotes.map((quote) => <tr key={quote.id}><td className="border-b border-stone-100 px-3 py-3 font-medium">{quote.id}</td><td className="border-b border-stone-100 px-3 py-3"><p className="font-medium text-stone-950">{quote.vendor}</p><p className="text-[11px] text-stone-500">{quote.city}</p></td><td className="border-b border-stone-100 px-3 py-3">{quote.service}</td><td className="border-b border-stone-100 px-3 py-3">{quote.date}</td><td className="border-b border-stone-100 px-3 py-3 font-medium">{quote.amount}</td><td className="border-b border-stone-100 px-3 py-3"><span className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusClasses[quote.status]}`}>{quote.status}</span></td></tr>)}</tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-stone-950">Upcoming Plans</h3>
          <p className="mt-1 text-xs font-medium text-stone-500">Your next planning actions</p>
          <div className="mt-5 grid gap-3">{upcomingPlans.map((item) => <div key={item.title} className="rounded border border-stone-100 bg-[#fff9f5] p-4"><p className="font-semibold text-stone-950">{item.title}</p><p className="mt-1 text-xs text-stone-500">{item.text}</p></div>)}</div>
        </article>
      </section>
    </div>
  );
}

export default function UserDashboard() {
  const authUser = useAuthUser();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useDismissibleDropdown(profileOpen, setProfileOpen);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { handleLogout, logoutFeedback } = useAuthLogout("/user/login");
  const expanded = !collapsed || hovered;

  return (
    <div className="min-h-screen bg-[#f7f2ef] text-stone-900">
      <aside onMouseEnter={() => collapsed && setHovered(true)} onMouseLeave={() => setHovered(false)} className={`fixed inset-y-0 left-0 z-40 border-r border-rose-100 bg-white shadow-sm transition-all duration-200 ${expanded ? "w-72" : "w-20"}`}>
        <Link href="/" className="flex h-20 items-center justify-center border-b border-rose-100 px-4"><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={142} height={50} priority className={`${expanded ? "h-12" : "h-10"} w-auto object-contain`} /></Link>
        <nav className="space-y-1 px-3 py-5">{menu.map((item, index) => { const hasSubmenu = item.sub.length > 0; return <div key={item.label}><button type="button" onClick={() => hasSubmenu && setOpenMenu((current) => current === item.label ? "" : item.label)} className={`flex h-12 w-full items-center rounded px-3 text-sm font-semibold transition hover:bg-rose-50 hover:text-[#b61f4b] ${index === 0 ? "bg-rose-50 text-[#b61f4b]" : "text-stone-700"} ${expanded ? "justify-between gap-3" : "justify-center"}`} title={item.label}><span className="flex items-center gap-3"><Icon name={item.icon} />{expanded ? item.label : null}</span>{expanded && hasSubmenu ? <span className={`${openMenu === item.label ? "rotate-180" : ""} transition`}><Icon name="arrow" /></span> : null}</button>{expanded && hasSubmenu && openMenu === item.label ? <div className="dashboard-submenu ml-8 mt-1 grid gap-1 pb-2">{item.sub.map((sub) => <Link key={sub} href="#" className="rounded px-3 py-2 text-xs font-semibold text-stone-500 hover:bg-rose-50 hover:text-[#b61f4b]">{sub}</Link>)}</div> : null}</div>; })}</nav>
      </aside>
      <div className={`transition-all duration-200 ${expanded ? "pl-72" : "pl-20"}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-rose-100 bg-white/95 px-6 shadow-sm backdrop-blur"><div className="flex items-center gap-4"><button type="button" onClick={() => setCollapsed((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-rose-100 text-stone-700 hover:border-[#b61f4b] hover:text-[#b61f4b]" aria-label="Toggle sidebar"><Icon name={collapsed ? "expand" : "collapse"} /></button><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b61f4b]">User</p><h1 className="mt-1 font-serif text-2xl font-bold text-stone-950">Dashboard</h1></div></div><div ref={profileMenuRef} className="relative"><button type="button" onClick={() => setProfileOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full border border-rose-100 text-[#b61f4b] hover:bg-rose-50" aria-label="Profile" aria-expanded={profileOpen}><Icon name="profile" /></button><div className={`absolute right-0 top-full mt-3 w-64 rounded border border-rose-100 bg-white p-3 shadow-xl transition duration-150 ${profileOpen ? "pointer-events-auto visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"}`}><div className="flex items-center gap-3 border-b border-rose-100 pb-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-[#b61f4b]"><Icon name="profile" /></span><AccountProfileInfo user={authUser} /></div><Link href="#profile-settings" className="mt-2 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="settings" /> Profile setting</Link><button type="button" onClick={() => { setProfileOpen(false); setLogoutConfirmOpen(true); }} className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="logout" /> Logout</button></div></div></header>
        <main className="p-6">
          <UserDashboardOverview />
        </main>
      </div>
      <ConfirmActionModal
        isOpen={logoutConfirmOpen}
        title="Logout?"
        text="Are you sure you want to logout from your account?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
      />
      <ApiStatusModal status={logoutFeedback?.status} title={logoutFeedback?.title} text={logoutFeedback?.text} okLabel={logoutFeedback?.okLabel} onOk={logoutFeedback?.onOk} />
    </div>
  );
}
