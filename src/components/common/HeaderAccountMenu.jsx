import AccountProfileInfo from "@/components/common/AccountProfileInfo";
import { accountName } from "@/util/accountProfile.mjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import { getAccessToken, getAuthUser } from "@/util/authSession";
import useAuthLogout from "@/util/useAuthLogout";
import MainApi from "@/util/MainApi";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("epic-auth-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("epic-auth-change", callback);
  };
}

function getSnapshot() {
  if (!getAccessToken()) return "";
  const user = getAuthUser();
  return JSON.stringify({ ...user, role: user?.role || window.localStorage.getItem("epic_auth_role") || "CLIENT" });
}

function getServerSnapshot() { return ""; }

function Avatar({ src, name }) {
  const [failedSrc, setFailedSrc] = useState("");
  return <span className="login-dropdown-avatar overflow-hidden text-sm font-bold">
    {src && src !== failedSrc ? <Image src={src} alt={`${name} profile photo`} width={36} height={36} unoptimized onError={() => setFailedSrc(src)} className="h-full w-full object-cover" /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
  </span>;
}

export default function HeaderAccountMenu({ variant = "user" }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => snapshot ? JSON.parse(snapshot) : null, [snapshot]);
  const [vendorData, setVendorData] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();
  const role = String(user?.role || "").toUpperCase();
  const isVendor = role === "VENDOR" || role === "AGENT";
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const dashboard = isVendor ? "/partner/dashboard" : isAdmin ? "/superadmin/dashboard" : "/user/dashboard";
  const loginPath = isVendor ? "/partner/login" : isAdmin ? "/superadmin/login" : "/user/login";
  const { handleLogout, logoutFeedback } = useAuthLogout(loginPath);
  const profile = vendorData?.snapshot === snapshot ? vendorData.profile : user?.vendorProfile;
  const name = accountName(user);
  const photo = isVendor ? profile?.logoUrl : user?.profilePictureUrl || user?.profileImageUrl || user?.avatarUrl || user?.photoUrl || user?.picture || user?.logoUrl;
  const partner = variant !== "user";
  const guestLinks = partner ? [
    ["/partner/login", variant === "partner" ? "Partner Login" : "Agent Login", "Access your partner account", "user-login-icon"],
    ["/partner/sign-up", variant === "partner" ? "Partner Sign up" : "Agent Sign up", "Create a partner profile", "partner-icon"],
  ] : [
    ["/user/login", "User Login", "Continue planning your wedding", "user-login-icon"],
    ["/user/sign-up", "User Sign up", "Create a wedding account", "signup-icon"],
    ["/partner", "Become a partner", "Join as a vendor or planner", "partner-icon"],
  ];

  useEffect(() => {
    if (!isVendor) return;
    const controller = new AbortController();
    MainApi.get("/vendor/profile", { signal: controller.signal }).then((response) => {
      if (!controller.signal.aborted) setVendorData({ snapshot, profile: response.data?.data || response.data || {} });
    }).catch(() => { /* Keep the session photo if the profile request fails. */ });
    return () => controller.abort();
  }, [snapshot, isVendor]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <>
    <div ref={wrapperRef} className={`${variant === "partner" ? "partner-login-wrap" : "header-login-wrap"} relative flex shrink-0 items-center gap-2`} onMouseLeave={() => { if (!user) setOpen(false); }}>
      <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-label={user ? "Open account menu" : "Open login menu"} aria-expanded={open} aria-controls={panelId} className={`flex items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold leading-none text-[#b61f4b] hover:bg-rose-50 ${user ? "h-9 w-9 border-0 p-0" : "border border-[#b61f4b] px-4 py-2"}`}>
        {user ? <Avatar src={photo} name={name} /> : <><span className="login-icon" aria-hidden="true" /><span>{variant === "partner" ? "Sign in" : "Login"}</span></>}
        {!user && <span className="header-chevron shrink-0" aria-hidden="true" />}
      </button>
      <div id={panelId} hidden={!open} className={`login-dropdown-panel absolute right-0 top-full z-50 max-w-[calc(100vw-2rem)] ${user ? "account-dropdown-panel" : ""}`}>
        <div className="login-dropdown-head">
          {user ? <Avatar src={photo} name={name} /> : <span className="login-dropdown-avatar" aria-hidden="true"><span className="login-icon" /></span>}
          {user ? <AccountProfileInfo user={user} /> : <div className="min-w-0"><p className="truncate">Welcome to Epic Wedz</p><span className="truncate">Access your wedding account</span></div>}
        </div>
        {user ? <>
          <Link href={dashboard} onClick={() => setOpen(false)} className="login-menu-link"><span className="login-menu-icon user-login-icon" aria-hidden="true" /><span><strong>Dashboard</strong></span></Link>
          {isVendor && <Link href="/partner/update-profile" onClick={() => setOpen(false)} className="login-menu-link"><span className="login-menu-icon partner-icon" aria-hidden="true" /><span><strong>Update Profile</strong></span></Link>}
          <button type="button" onClick={() => { setOpen(false); setConfirmLogout(true); }} className="login-menu-link w-full text-left"><svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7 15.59 8.41 18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5ZM4 5h8V3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h8v-2H4V5Z" /></svg><span><strong>Logout</strong></span></button>
        </> : guestLinks.map(([href, title, description, icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="login-menu-link"><span className={`login-menu-icon ${icon}`} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span></Link>)}
      </div>
    </div>
    <ConfirmActionModal isOpen={confirmLogout} title="Logout?" text="Are you sure you want to logout from your account?" confirmLabel="Logout" cancelLabel="Cancel" onCancel={() => setConfirmLogout(false)} onConfirm={() => { setConfirmLogout(false); handleLogout(); }} />
    <ApiStatusModal status={logoutFeedback?.status} title={logoutFeedback?.title} text={logoutFeedback?.text} okLabel={logoutFeedback?.okLabel} onOk={logoutFeedback?.onOk} />
  </>;
}
