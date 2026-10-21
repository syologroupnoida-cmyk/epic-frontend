import { accountName, accountType } from "@/util/accountProfile.mjs";

export default function AccountProfileInfo({ user, fallbackName = "My Account", fallbackType = "User" }) {
  return <div className="account-profile-info min-w-0">
    <div className="account-name-row">
      <p className="break-words text-sm font-normal text-stone-950">{accountName(user, fallbackName)}</p>
      <span className="account-role-chip">{accountType(user, fallbackType)}</span>
    </div>
    <p className="account-email mt-1 break-words text-stone-500">{user?.email || "Email not provided"}</p>
  </div>;
}
