import { useEffect, useId, useRef, useState } from "react";
import Popover from "@mui/material/Popover";
import MainApi from "@/util/MainApi";
import { loadAllServiceSubcategories } from "@/util/serviceCategories.mjs";
import { getApiErrorMessage } from "@/util/authApi";

export function ServiceActionIcon({ action }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {action === "delete" ? <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /> : <path d="m15 5 4 4M4 20l5-1L21 7l-4-4L5 15l-1 5Z" />}
  </svg>;
}

export default function ServiceSubcategoryMenu({ category, onLoaded, onEdit, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef(null);
  const id = useId();
  useEffect(() => () => controllerRef.current?.abort(), []);

  async function loadServices() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const subcategories = await loadAllServiceSubcategories((...args) => MainApi.get(...args), category.id, { signal: controller.signal });
      if (!controller.signal.aborted) onLoaded(category.id, subcategories);
    } catch (failure) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(failure, "Unable to load subcategories."));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function open(event) {
    setAnchor(event.currentTarget);
    if (!category.subcategoriesLoaded) loadServices();
  }

  return <>
    <button id={id} type="button" onClick={open} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
      className="flex h-8 w-full min-w-0 max-w-[220px] cursor-pointer items-center justify-between gap-2 rounded border border-rose-200 bg-white px-2.5 text-left text-xs hover:border-[#b61f4b]">
      <span className="truncate">{category.subcategoriesLoaded ? `${category.subcategories.length} subcategories` : "View subcategories"}</span>
      <span aria-hidden="true" className="text-[#b61f4b]">▾</span>
    </button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} disableScrollLock
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { role: "dialog", "aria-labelledby": id, sx: { mt: 0.5, width: 280, maxWidth: "calc(100vw - 32px)", maxHeight: "min(380px, calc(100dvh - 80px))", border: "1px solid #f5dce3", borderRadius: 1.5 } } }}>
      <div className="border-b border-rose-100 px-3 py-1.5 text-xs font-semibold text-stone-500">{category.name}</div>
      {loading ? <p role="status" className="p-4 text-sm text-stone-500">Loading subcategories…</p> : error ? <div role="alert" className="p-4 text-sm text-red-600">{error}<button type="button" onClick={loadServices} className="mt-2 block font-semibold underline">Try again</button></div> : category.subcategories.length ? <ul className="py-1">
        {category.subcategories.map((service, index) => <li key={service.id || index} className="group flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-rose-50 focus-within:bg-rose-50">
          <span className="min-w-0 text-[13px] leading-5 text-stone-800">{service.name}</span>
          {service.id && <span className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
            <button type="button" aria-label={`Edit ${service.name}`} title={`Edit ${service.name}`} onClick={() => { setAnchor(null); onEdit(service); }} className="grid h-7 w-7 cursor-pointer place-items-center rounded text-[#b61f4b] hover:bg-rose-100"><ServiceActionIcon action="edit" /></button>
            <button type="button" aria-label={`Delete ${service.name}`} title={`Delete ${service.name}`} onClick={() => { setAnchor(null); onDelete(service); }} className="grid h-7 w-7 cursor-pointer place-items-center rounded text-red-600 hover:bg-red-100"><ServiceActionIcon action="delete" /></button>
          </span>}
        </li>)}
      </ul> : <p className="p-4 text-sm text-stone-500">No subcategories yet.</p>}
    </Popover>
  </>;
}
