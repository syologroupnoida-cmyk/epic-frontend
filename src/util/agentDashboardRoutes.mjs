export const agentPanelSlugs = {
  Overview: "overview",
  "Update Profile": "update-profile",
  "Update Password": "update-password",
  "Manage Services": "add-services",
  Bookings: "bookings",
  Availability: "availability",
  Enquiries: "enquiries",
  Reviews: "reviews",
  Payments: "payments",
  "Gallery / Portfolio": "gallery",
  Analytics: "analytics",
};

export function agentPanelFromSlug(slug) {
  const canonicalSlug = slug === "manage-services" ? "add-services" : slug;
  return Object.keys(agentPanelSlugs).find((panel) => agentPanelSlugs[panel] === canonicalSlug) || null;
}

export function agentPanelPath(panel) {
  const slug = Object.hasOwn(agentPanelSlugs, panel) ? agentPanelSlugs[panel] : null;
  return slug && slug !== "overview" ? `/agent/${slug}` : "/agent/dashboard";
}
