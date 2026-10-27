export const FOOTER_CATEGORY_SETTINGS_KEY = "epic_footer_category_ids";
export const FOOTER_SETTINGS_EVENT = "epic-footer-settings-changed";

export function readFooterCategoryIds() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(FOOTER_CATEGORY_SETTINGS_KEY) || "null");
    return Array.isArray(value) ? value.filter((id) => typeof id === "string" && id) : null;
  } catch {
    return null;
  }
}

export function saveFooterCategoryIds(ids) {
  if (typeof window === "undefined") return;
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  window.localStorage.setItem(FOOTER_CATEGORY_SETTINGS_KEY, JSON.stringify(uniqueIds));
  window.dispatchEvent(new CustomEvent(FOOTER_SETTINGS_EVENT, { detail: uniqueIds }));
}
