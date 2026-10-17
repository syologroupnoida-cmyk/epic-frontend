export function vendorLocation(vendor) {
  return [vendor.area, vendor.city, vendor.stateName, vendor.countryCode].filter(Boolean).join(", ");
}

function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default function VendorBusinessDetails({ vendor, showStatus = true }) {
  const rows = [
    ["Vendor ID", vendor.userId],
    ["Business name", vendor.name],
    ["Business slug", vendor.slug],
    ["Location", vendorLocation(vendor)],
    ["KYC status", showStatus ? vendor.kycStatus : ""],
    ["Profile status", showStatus ? vendor.profileStatus : ""],
    ["Experience", vendor.years !== null ? `${vendor.years} years` : ""],
    ["Contact number", vendor.phone],
    ["Created", formatDate(vendor.createdAt)],
    ["Last updated", formatDate(vendor.updatedAt)],
  ].filter(([, value]) => value);

  return <dl className="vd-business-details">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>;
}
