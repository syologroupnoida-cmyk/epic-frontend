import { useEffect, useId, useState } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton, Slide } from "@mui/material";
import MainApi from "@/util/MainApi";
import { loadAllServiceSubcategories } from "@/util/serviceCategories.mjs";
import { getApiErrorMessage } from "@/util/authApi";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "Not provided";
}

export default function ServiceCategoryDetails({ category, onClose }) {
  const id = useId();
  const [services, setServices] = useState(category.subcategories);
  const [loading, setLoading] = useState(!category.subcategoriesLoaded);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (category.subcategoriesLoaded) return;
    const controller = new AbortController();
    loadAllServiceSubcategories((...args) => MainApi.get(...args), category.id, { signal: controller.signal })
      .then((records) => { if (!controller.signal.aborted) setServices(records); })
      .catch((failure) => { if (!controller.signal.aborted) setError(getApiErrorMessage(failure, "Unable to load subcategories.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category.id, category.subcategoriesLoaded, attempt]);

  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" disableScrollLock aria-labelledby={id}
    slots={{ transition: Slide }} slotProps={{ transition: { direction: "down" }, paper: { sx: { borderRadius: 2, maxHeight: "85dvh" } } }}>
    <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, borderBottom: "1px solid #fce7f3" }}>
      <div><p className="text-xs font-semibold text-[#b61f4b]">Category details</p><h2 id={id} className="mt-1 text-lg font-semibold text-stone-900">{category.name}</h2></div>
      <IconButton onClick={onClose} aria-label="Close category details">×</IconButton>
    </DialogTitle>
    <DialogContent sx={{ pt: "20px !important" }}>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
        <div><dt className="text-xs text-stone-500">Service type</dt><dd className="mt-1 font-medium">{category.offeringKind === "VENUE_PROPERTY" ? "Property" : category.offeringKind === "SERVICE" ? "Service" : "Not provided"}</dd></div>
        <div><dt className="text-xs text-stone-500">Status</dt><dd className="mt-1 font-medium">{category.isActive ? "Active" : "Inactive"}</dd></div>
        <div><dt className="text-xs text-stone-500">Created on</dt><dd className="mt-1">{formatDate(category.createdAt)}</dd></div>
        <div><dt className="text-xs text-stone-500">Updated on</dt><dd className="mt-1">{formatDate(category.updatedAt)}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-stone-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-stone-700">{category.description || "No description provided."}</dd></div>
      </dl>
      <h3 className="mb-2 mt-6 text-sm font-semibold">Subcategories{!loading && !error ? ` (${services.length})` : ""}</h3>
      {loading ? <p role="status" className="py-3 text-sm text-stone-500">Loading subcategories…</p> : error ? <div role="alert" className="text-sm text-red-600">{error} <button type="button" onClick={() => { setError(""); setLoading(true); setAttempt((current) => current + 1); }} className="underline">Try again</button></div> : services.length ? <ul className="divide-y divide-rose-100 rounded border border-rose-100">
        {services.map((service, index) => <li key={service.id || index} className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{service.name}</span><span className={`text-xs ${service.isActive ? "text-emerald-700" : "text-stone-500"}`}>{service.isActive ? "Active" : "Inactive"}</span></div>
          {service.description && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-stone-500">{service.description}</p>}
        </li>)}
      </ul> : <p className="text-sm text-stone-500">No subcategories yet.</p>}
    </DialogContent>
  </Dialog>;
}
