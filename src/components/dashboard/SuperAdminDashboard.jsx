import useDismissibleDropdown from "@/util/useDismissibleDropdown";
import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import AddCity from "@/components/superadmin/AddCity";
import AddServiceCategory from "@/components/superadmin/AddServiceCategory";
import AddServices from "@/components/superadmin/AddServices";
import CityList from "@/components/superadmin/CityList";
import ServiceCategoryList from "@/components/superadmin/ServiceCategoryList";
import ServiceListingList from "@/components/superadmin/ServiceListingList";
import PropertyListingList from "@/components/superadmin/PropertyListingList";
import VendorKycList from "@/components/superadmin/VendorKycList";
import LeadList from "@/components/superadmin/LeadList";
import FooterSettings from "@/components/superadmin/FooterSettings";
import useAuthLogout from "@/util/useAuthLogout";
import WeddingAdminOverview from "@/components/dashboard/WeddingAdminOverview";
import useAuthUser from "@/util/useAuthUser";
import AccountProfileInfo from "@/components/common/AccountProfileInfo";
import { accountName } from "@/util/accountProfile.mjs";

const icons = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  people: "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z",
  store: "M4 6h16v2H4V6Zm1 4h14l-1 10H6L5 10Zm2-8h10l2 3H5l2-3Z",
  chart: "M5 9.2h3V19H5V9.2Zm5.5-4.2h3V19h-3V5Zm5.5 7h3v7h-3v-7Z",
  calendar: "M7 2h2v2h6V2h2v2h3c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h3V2Zm13 8H4v10h16V10Z",
  settings: "M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65-2-3.46-2.49 1a7.28 7.28 0 0 0-1.69-.98L15 3h-4l-.36 2.93c-.6.23-1.16.56-1.69.98l-2.49-1-2 3.46 2.11 1.65c-.04.32-.07.65-.07.98s.02.66.07.98l-2.11 1.65 2 3.46 2.49-1c.52.4 1.08.74 1.69.98L11 21h4l.36-2.93c.6-.23 1.16-.56 1.69-.98l2.49 1 2-3.46-2.11-1.65ZM13 15.5A3.5 3.5 0 1 1 13 8a3.5 3.5 0 0 1 0 7.5Z",
  profile: "M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z",
  expand: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6Z",
  collapse: "M14 6 8 12l6 6 1.41-1.41L10.83 12l4.58-4.59L14 6Z",
  arrow: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z",
  logout: "M17 7 15.59 8.41 18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5ZM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5Z",
};

const menu = [
  { label: "Overview", icon: "dashboard", sub: [] },
  { label: "Services", icon: "store", sub: ["Services List", "Add Service Category", "Add Services"] },
  { label: "Service Listing", icon: "store", sub: ["Service List"] },
  { label: "Property", icon: "store", sub: ["Property List"] },
  { label: "Cities", icon: "calendar", sub: ["Add City", "City List"] },
  { label: "Vendor", icon: "people", sub: ["Vendor Kyc List"] },
  { label: "Lead", icon: "people", sub: ["Lead List"] },
  // { label: "Agents", icon: "profile", sub: ["Approvals", "Performance", "Payouts"] },
  // { label: "Vendors", icon: "store", sub: ["Listings", "Verification", "Packages"] },
  // { label: "Reports", icon: "chart", sub: ["Revenue", "Traffic", "Bookings"] },
  { label: "Settings", icon: "settings", sub: ["Footer Settings", "Roles", "Permissions", "Platform"] },
];

const dashboardPanels = {
  "Services List": ServiceCategoryList,
  "Service List": ServiceListingList,
  "Property List": PropertyListingList,
  "Add Service Category": AddServiceCategory,
  "Add Services": AddServices,
  "Add City": AddCity,
  "City List": CityList,
  "Vendor Kyc List": VendorKycList,
  "Lead List": LeadList,
  "Footer Settings": FooterSettings,
};

const panelSlugs = {
  Overview: "overview",
  "Services List": "services-list",
  "Service List": "service-listings",
  "Property List": "property-listings",
  "Add Service Category": "add-service-category",
  "Add Services": "add-services",
  "Add City": "add-city",
  "City List": "city-list",
  "Vendor Kyc List": "vendor-kyc-list",
  "Lead List": "lead-list",
  "Footer Settings": "footer-settings",
  Approvals: "approvals",
  Performance: "performance",
  Payouts: "payouts",
  Listings: "listings",
  Verification: "verification",
  Packages: "packages",
  Roles: "roles",
  Permissions: "permissions",
  Platform: "platform",
};

const slugPanels = Object.fromEntries(Object.entries(panelSlugs).map(([label, slug]) => [slug, label]));


function findParentMenu(panel) {
  return menu.find((item) => item.sub.includes(panel))?.label || "";
}

function subscribeToHydrationSnapshot() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true"><path d={icons[name] || icons.dashboard} /></svg>;
}


function DashboardPlaceholder({ title }) {
  return (
    <section className="rounded border border-rose-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b61f4b]">Superadmin</p>
      <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">{title}</h2>
      <p className="mt-3 text-sm font-semibold text-stone-500">This dashboard section is ready for its table or form component.</p>
    </section>
  );
}

export default function SuperAdminDashboard() {
  const authUser = useAuthUser();
  const displayName = accountName(authUser, "Admin");
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useDismissibleDropdown(profileOpen, setProfileOpen);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const { handleLogout, logoutFeedback } = useAuthLogout("/superadmin/login");
  const expanded = !collapsed || hovered;
  const hasHydrated = useSyncExternalStore(
    subscribeToHydrationSnapshot,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const currentPath = hasHydrated && router.isReady ? router.asPath.split("?")[0] : "";
  const panelSlug = currentPath.split("/")[2] || "";
  const activePanel = hasHydrated && router.isReady ? slugPanels[panelSlug] || "Overview" : "Overview";
  const ActivePanel = dashboardPanels[activePanel];
  const activeParentMenu = findParentMenu(activePanel);

  function selectPanel(panel) {
    setMenuSearch("");
    setOpenMenu(findParentMenu(panel));
    const slug = panelSlugs[panel] || panelSlugs.Overview;
    router.push(slug === panelSlugs.Overview ? "/superadmin/dashboard" : `/superadmin/${slug}`);
  }

  return (
    <div className={`wp-dashboard ${expanded ? "wp-expanded" : "wp-collapsed"} h-screen overflow-hidden bg-[#f7f2ef] text-stone-900`}>
      <aside onMouseEnter={() => collapsed && setHovered(true)} onMouseLeave={() => setHovered(false)} className={`wp-sidebar fixed inset-y-0 left-0 z-40 border-r border-rose-100 bg-white shadow-sm transition-all duration-200 ${expanded ? "w-72" : "w-20"}`}>
        <Link href="/" className="wp-brand flex h-16 items-center justify-center border-b border-rose-100 px-4" aria-label="Epic Portal home">
          <Image src="/images/epic-logo-new.png" alt="Epic Wedz" width={200} height={76} priority className="wp-site-logo" />
        </Link>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-3 py-4">
          {menu.filter((item) => !menuSearch || `${item.label} ${item.sub.join(" ")}`.toLowerCase().includes(menuSearch.toLowerCase())).map((item) => {
            const hasSubmenu = item.sub.length > 0;
            const visibleMenu = openMenu === null ? activeParentMenu : openMenu;
            const submenuOpen = expanded && hasSubmenu && (visibleMenu === item.label || Boolean(menuSearch));

            return (
            <div key={item.label}>
              <button type="button" onClick={() => hasSubmenu ? setOpenMenu((current) => (current === null ? activeParentMenu : current) === item.label ? "" : item.label) : selectPanel(item.label)} className={`flex h-12 w-full items-center rounded px-3 text-sm font-semibold transition hover:bg-rose-50 hover:text-[#b61f4b] ${activePanel === item.label || activeParentMenu === item.label ? "bg-rose-50 text-[#b61f4b]" : "text-stone-700"} ${expanded ? "justify-between gap-3" : "justify-center"}`} title={item.label}>
                <span className="flex items-center gap-3"><Icon name={item.icon} />{expanded ? item.label : null}</span>
                {expanded && hasSubmenu ? <span className={`${submenuOpen ? "rotate-180" : ""} transition duration-500`}><Icon name="arrow" /></span> : null}
              </button>
              {expanded && hasSubmenu ? (
                <div className={`dashboard-submenu ml-8 grid gap-1 ${submenuOpen ? "mt-1 max-h-56 pb-2 opacity-100" : "mt-0 max-h-0 pb-0 opacity-0"}`}>
                  {item.sub.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => selectPanel(sub)}
                      className={`flex items-center gap-2 rounded px-3 py-2 text-left text-xs font-semibold hover:bg-rose-50 hover:text-[#b61f4b] ${activePanel === sub ? "bg-rose-50 text-[#b61f4b]" : "text-stone-500"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full border border-white ${activePanel === sub ? "bg-white opacity-100" : "opacity-100"}`} aria-hidden="true" />
                      <span>{sub}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            );
          })}
        </nav>
      </aside>
      <div className={`h-screen overflow-hidden transition-all duration-200 ${expanded ? "pl-72" : "pl-20"}`}>
        <header className="wp-topbar relative z-30 flex h-16 items-center justify-between border-b border-rose-100 bg-white/95 px-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full border border-rose-100 text-stone-700 hover:border-[#b61f4b] hover:text-[#b61f4b]" aria-label="Toggle sidebar">
              <Icon name={collapsed ? "expand" : "collapse"} />
            </button>
            <strong className="wp-header-role">Super -Admin</strong>
            <label className="wp-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg><span className="sr-only">Search dashboard navigation</span><input type="search" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search pages, services, vendors…" /></label>
          </div>
          <div ref={profileMenuRef} className="relative">
            <button type="button" onClick={() => setProfileOpen((open) => !open)} className="wp-account-button" aria-label="Profile" aria-expanded={profileOpen}><span className="wp-account-avatar"><Icon name="profile" /></span><span><strong>{displayName}</strong><small>{authUser?.email || "Admin"}</small></span><Icon name="arrow" /></button>
            <div className={`absolute right-0 top-full mt-3 w-64 rounded border border-rose-100 bg-white p-3 shadow-xl transition duration-150 ${profileOpen ? "pointer-events-auto visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-2 opacity-0"}`}>
              <div className="flex items-center gap-3 border-b border-rose-100 pb-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-[#b61f4b]"><Icon name="profile" /></span>
                <AccountProfileInfo user={authUser} fallbackName="Admin" fallbackType="Admin" />
              </div>
              <Link href="#profile-settings" className="mt-2 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="settings" /> Profile setting</Link>
              <button type="button" onClick={() => { setProfileOpen(false); setLogoutConfirmOpen(true); }} className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-normal text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"><Icon name="logout" /> Logout</button>
            </div>
          </div>
        </header>
        <main className="wp-main h-[calc(100vh-4rem)] overflow-y-auto p-2">
          {ActivePanel ? (
            <ActivePanel embedded />
          ) : activePanel === "Overview" ? (
            <WeddingAdminOverview onNavigate={selectPanel} />
          ) : (
            <DashboardPlaceholder title={activePanel} />
          )}
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
