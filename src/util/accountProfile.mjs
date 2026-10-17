function clean(value) { return typeof value === "string" ? value.trim() : ""; }

export function accountName(user, fallback = "My Account") {
  return [clean(user?.firstName), clean(user?.lastName)].filter(Boolean).join(" ") || clean(user?.name) || clean(user?.fullName) || fallback;
}

export function accountType(user, fallback = "User") {
  const type = clean(user?.role) || clean(user?.type) || clean(user?.userType) || fallback;
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
