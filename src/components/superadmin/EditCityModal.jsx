import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

function getCityForm(city = {}) {
  return {
    name: city.name || "",
    stateName: city.stateName || "",
    countryCode: city.countryCode || "IN",
    isActive: Boolean(city.isActive),
  };
}

export default function EditCityModal({ city, isUpdating, onClose, onSubmit }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const [form, setForm] = useState(() => getCityForm(city));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!city || !overlayRef.current || !panelRef.current) return undefined;

    const context = gsap.context(() => {
      gsap.set(overlayRef.current, { autoAlpha: 0 });
      gsap.set(panelRef.current, { y: -90, autoAlpha: 0, scale: 0.96 });
      gsap.timeline()
        .to(overlayRef.current, { autoAlpha: 1, duration: 0.2, ease: "power2.out" })
        .to(panelRef.current, { y: 0, autoAlpha: 1, scale: 1, duration: 0.46, ease: "power3.out" }, "-=0.08");
    }, overlayRef);

    return () => context.revert();
  }, [city]);

  if (!city) return null;

  function updateField(event) {
    const { name, value, type } = event.target;
    setErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({
      ...current,
      [name]: type === "radio" && name === "isActive" ? value === "true" : value,
    }));
  }

  function closeWithAnimation() {
    if (!overlayRef.current || !panelRef.current) {
      onClose();
      return;
    }

    gsap.timeline({ onComplete: onClose })
      .to(panelRef.current, { y: -70, autoAlpha: 0, scale: 0.97, duration: 0.22, ease: "power2.in" })
      .to(overlayRef.current, { autoAlpha: 0, duration: 0.16, ease: "power2.in" }, "-=0.08");
  }

  function submitForm(event) {
    event.preventDefault();

    const nextForm = {
      name: form.name.trim(),
      stateName: form.stateName.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      isActive: Boolean(form.isActive),
    };
    const nextErrors = {};

    if (!nextForm.name) nextErrors.name = "Enter city name.";
    if (!nextForm.stateName) nextErrors.stateName = "Enter state name.";
    if (!nextForm.countryCode) nextErrors.countryCode = "Enter country code.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(city.id, nextForm, closeWithAnimation);
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
      <form ref={panelRef} onSubmit={submitForm} className="w-full max-w-lg rounded bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Edit City</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Update city name, state, country, and active status.</p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">City name</span>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              className="h-11 rounded border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#b61f4b]"
              autoFocus
            />
            {errors.name ? <small className="text-xs font-medium text-red-600">{errors.name}</small> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">State name</span>
            <input
              name="stateName"
              value={form.stateName}
              onChange={updateField}
              className="h-11 rounded border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#b61f4b]"
            />
            {errors.stateName ? <small className="text-xs font-medium text-red-600">{errors.stateName}</small> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Country code</span>
            <input
              name="countryCode"
              value={form.countryCode}
              onChange={updateField}
              maxLength={3}
              className="h-11 rounded border border-slate-300 px-3 text-sm uppercase text-slate-900 outline-none focus:border-[#b61f4b]"
            />
            {errors.countryCode ? <small className="text-xs font-medium text-red-600">{errors.countryCode}</small> : null}
          </label>

          <div className="flex flex-wrap items-center gap-4 py-1 sm:col-span-2">
            <span className="text-sm font-bold text-slate-700">Status</span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                name="isActive"
                type="radio"
                value="true"
                checked={form.isActive === true}
                onChange={updateField}
                className="h-4 w-4 accent-[#b61f4b]"
              />
              Active
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                name="isActive"
                type="radio"
                value="false"
                checked={form.isActive === false}
                onChange={updateField}
                className="h-4 w-4 accent-[#b61f4b]"
              />
              Inactive
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={closeWithAnimation}
            disabled={isUpdating}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded bg-[#b61f4b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#981a3f] disabled:bg-slate-300"
          >
            {isUpdating ? "Updating..." : "Update City"}
          </button>
        </div>
      </form>
    </div>
  );
}
