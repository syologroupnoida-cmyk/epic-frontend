import useDismissibleDropdown from "@/util/useDismissibleDropdown";
import AccountProfileInfo from "@/components/common/AccountProfileInfo";
import { accountName } from "@/util/accountProfile.mjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import BusinessPasswordUpdate from "@/components/vendor/BusinessPasswordUpdate";
import BusinessProfileUpdate from "@/components/vendor/BusinessProfileUpdate";
import VendorDashboardOverview from "@/components/dashboard/VendorDashboardOverview";
import MainApi from "@/util/MainApi";
import { getAuthUser } from "@/util/authSession";
import useAuthLogout from "@/util/useAuthLogout";
import { agentPanelPath } from "@/util/agentDashboardRoutes.mjs";
import useAuthUser from "@/util/useAuthUser";

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
  { label: "Overview", icon: "dashboard", sub: [] },
  { label: "Business Profile", icon: "profile", sub: ["Update Profile", "Update Password"] },
  { label: "Services & Packages", icon: "store", sub: ["Manage Services"] },
];

const dashboardPanels = {
  "Update Profile": BusinessProfileUpdate,
  "Update Password": BusinessPasswordUpdate,
  "Manage Services": BusinessProfileUpdate,
};


function Icon({ name }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true"><path d={icons[name] || icons.dashboard} /></svg>;
}

function VendorAvatar({ src, name }) {
  const [failedSrc, setFailedSrc] = useState("");
  return src && src !== failedSrc ? <Image src={src} alt={`${name} profile`} width={36} height={36} unoptimized onError={() => setFailedSrc(src)} className="h-full w-full rounded-full object-cover" /> : <Icon name="profile" />;
}


function normalizeKycStatus(status = "") {
  return String(status).trim().toUpperCase();
}

function isApprovedKycStatus(status) {
  const normalizedStatus = normalizeKycStatus(status);
  return normalizedStatus === "APPROVED" || normalizedStatus === "APPROVEL";
}

function getVendorDashboardAccess() {
  const user = getAuthUser();
  const isVendor = user?.role === "VENDOR";
  const kycStatus = normalizeKycStatus(user?.vendorProfile?.kycStatus);
  const nextStep = user?.vendorProfile?.nextStep;

  if (!isVendor || isApprovedKycStatus(kycStatus)) return "approved";
  if (kycStatus === "AWAITING") return "awaiting";
  if (kycStatus === "PENDING" || nextStep === "COMPLETE_KYC") return "pending";
  return "pending";
}

function subscribeToAuthSnapshot(callback) {
  window.addEventListener("epic-auth-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("epic-auth-change", callback); window.removeEventListener("storage", callback); };
}


function getVendorDashboardServerSnapshot() {
  return "loading";
}

export default function AgentDashboard({ activePanel = "Overview" }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useDismissibleDropdown(profileOpen, setProfileOpen);
  const [menuSearch, setMenuSearch] = useState("");
  const [profile, setProfile] = useState(null);
  const authUser = useAuthUser();
  const userSnapshot = JSON.stringify(authUser);
  const displayName = accountName(authUser, "Vendor");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { handleLogout, logoutFeedback } = useAuthLogout("/agent/login");
  const expanded = !collapsed || hovered;
  const ActivePanel = dashboardPanels[activePanel];
  const dashboardAccess = useSyncExternalStore(
    subscribeToAuthSnapshot,
    getVendorDashboardAccess,
    getVendorDashboardServerSnapshot,
  );

  function navigateToPanel(panel) {
    setMenuSearch("");
    router.push(agentPanelPath(panel));
  }

  useEffect(() => {
    if (dashboardAccess !== "approved") return;
    const controller = new AbortController();
    MainApi.get("/vendor/profile", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setProfile(data?.data || null);
    }).catch(() => { /* Keep the account name when the business profile is unavailable. */ });
    return () => controller.abort();
  }, [dashboardAccess, userSnapshot]);

  useEffect(() => {
    if (dashboardAccess === "pending") {
      router.replace("/kyc");
    }
  }, [dashboardAccess, router]);

  if (dashboardAccess === "loading" || dashboardAccess === "pending") return null;

  if (dashboardAccess === "awaiting") {
    return (
      <ApiStatusModal
        status="success"
        title="KYC is submitted"
        text="KYC approval is pending from Admin side."
        okLabel="OK"
        onOk={() => router.replace("/agent/login")}
      />
    );
  }

  return (
    <div className={`wp-dashboard vp-dashboard ${expanded ? "wp-expanded" : "wp-collapsed"} h-screen overflow-hidden bg-[#f7f2ef] text-stone-900`}>
      <aside onMouseEnter={() => collapsed && setHovered(true)} onMouseLeave={() => setHovered(false)} className={`wp-sidebar fixed inset-y-0 left-0 z-40 border-r border-rose-100 bg-white shadow-sm transition-all duration-200 ${expanded ? "w-72" : "w-20"}`}>
        <Link href="/" className="wp-brand flex h-16 items-center justify-center border-b border-rose-100 px-4" aria-label="Epic Wedz home"><Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={200} height={76} priority className="wp-site-logo" /></Link>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-3 py-4">{menu.filter((item) => !menuSearch || `${item.label} ${item.sub.join(" ")}`.toLowerCase().includes(menuSearch.toLowerCase())).map((item) => { const hasSubmenu = item.sub.length > 0; const menuActive = activePanel === item.label || item.sub.includes(activePanel); const submenuOpen = expanded && hasSubmenu && ((openMenu || (menuActive ? item.label : "")) === item.label || Boolean(menuSearch)); return <div key={item.label}><button type="button" onClick={() => hasSubmenu ? setOpenMenu((current) => (current || (menuActive ? item.label : "")) === item.label ? "closed" : item.label) : navigateToPanel(item.label)} className={`flex h-12 w-full items-center rounded px-3 text-sm font-semibold transition hover:bg-rose-50 hover:text-[#b61f4b] ${menuActive ? "bg-rose-50 text-[#b61f4b]" : "text-stone-700"} ${expanded ? "justify-between gap-3" : "justify-center"}`} title={item.label}><span className="flex items-center gap-3"><Icon name={item.icon} />{expanded ? item.label === "Overview" ? "Partner Dashboard" : item.label : null}</span>{expanded && hasSubmenu ? <span className={`${submenuOpen ? "rotate-180" : ""} transition duration-500`}><Icon name="arrow" /></span> : null}</button>{expanded && hasSubmenu ? <div className={`dashboard-submenu ml-8 grid gap-1 ${submenuOpen ? "mt-1 max-h-40 pb-2 opacity-100" : "mt-0 max-h-0 pb-0 opacity-0"}`}>{item.sub.map((sub) => <button key={sub} type="button" onClick={() => navigateToPanel(sub)} className={`flex items-center gap-2 rounded px-3 py-2 text-left text-xs font-semibold hover:bg-rose-50 hover:text-[#b61f4b] ${activePanel === sub ? "bg-rose-50 text-[#b61f4b]" : "text-stone-500"}`}><span className={`h-1.5 w-1.5 rounded-full border border-white ${activePanel === sub ? "bg-white opacity-100" : "opacity-100"}`} aria-hidden="true" />{sub}</button>)}</div> : null}</div>; })}</nav>
      </aside>
      <div className={`vp-workspace h-screen overflow-hidden transition-all duration-200 ${expanded ? "pl-72" : "pl-20"}`}>
        <header className="wp-topbar relative z-30 flex h-16 items-center justify-between border-b border-rose-100 bg-white/95 px-5 shadow-sm backdrop-blur"><div className="flex items-center gap-4"><button type="button" onClick={() => setCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full border border-rose-100 text-stone-700 hover:border-[#b61f4b] hover:text-[#b61f4b]" aria-label="Toggle sidebar"><Icon name={collapsed ? "expand" : "collapse"} /></button><strong className="wp-header-role">Partner</strong><label className="wp-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg><span className="sr-only">Search vendor dashboard navigation</span><input type="search" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search bookings, enquiries, services…" /></label></div><div ref={profileMenuRef} className="vp-header-account relative"><button type="button" onClick={() => setProfileOpen((open) => !open)} className="wp-account-button" aria-label="Profile" aria-expanded={profileOpen}><span className="wp-account-avatar"><VendorAvatar src={profile?.logoUrl || authUser?.profilePictureUrl} name={displayName} /></span><span><strong>{displayName}</strong><small>{authUser?.email || "Wedding Partner"}</small></span><Icon name="arrow" /></button><div className={`absolute right-0 top-full mt-3 w-64 rounded border border-rose-100 bg-white p-3 shadow-xl transition duration-150 ${profileOpen ? "pointer-events-auto visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"}`}><div className="flex items-center gap-3 border-b border-rose-100 pb-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-[#b61f4b]"><Icon name="profile" /></span><AccountProfileInfo user={authUser} fallbackName="Vendor" fallbackType="Vendor" /></div><button type="button" onClick={() => { setProfileOpen(false); setOpenMenu("Business Profile"); navigateToPanel("Update Profile"); }} className="mt-2 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="settings" /> Profile setting</button><button type="button" onClick={() => { setProfileOpen(false); setLogoutConfirmOpen(true); }} className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="logout" /> Logout</button></div></div></header>
        <main className="wp-main h-[calc(100vh-4rem)] overflow-y-auto p-2">
          {ActivePanel ? <ActivePanel /> : <VendorDashboardOverview name={displayName} activePanel={activePanel} onNavigate={navigateToPanel} />}
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
