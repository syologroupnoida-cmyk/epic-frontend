import { cloneElement, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ProfileSelect from "@/components/vendor/ProfileSelect";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";
import { loadAllCities } from "@/util/cities.mjs";
import { loadPublicServiceCategories } from "@/util/serviceCategories.mjs";

const emptyForm = { businessName: "", about: "", logoUrl: "", logoPublicId: "", primaryCityId: "", profileStatus: "ACTIVE", serviceCategoryIds: [], serviceSubcategoryIds: [] };

function list(value, keys) {
  const data = value?.data ?? value ?? {};
  if (Array.isArray(data)) return data;
  return keys.map((key) => data[key]).find(Array.isArray) || [];
}

function normalizeItems(value, type) {
  const keys = type === "city" ? ["items", "cities", "results", "data"] : type === "category" ? ["items", "categories", "results", "data"] : ["items", "subcategories", "serviceSubcategories", "results", "data"];
  return list(value, keys).map((item) => ({
    id: item?.id || item?._id || item?.cityId || item?.serviceCategoryId || item?.serviceSubcategoryId || "",
    name: item?.name || item?.cityName || item?.title || "",
    stateName: item?.stateName || item?.state || "",
    services: [],
  })).filter((item) => item.id && item.name);
}

function normalizeCapabilities(value) {
  const categoryMap = new Map();
  const serviceIds = [];
  list(value, ["capabilities", "items", "results", "data"]).forEach((capability) => {
    const service = capability?.service || capability;
    const category = service?.category || capability?.category;
    if (!service?.id || !category?.id) return;
    if (!categoryMap.has(category.id)) categoryMap.set(category.id, { id: category.id, name: category.name, services: [] });
    categoryMap.get(category.id).services.push({ id: service.id, name: service.name });
    serviceIds.push(service.id);
  });
  return { categories: [...categoryMap.values()], categoryIds: [...categoryMap.keys()], serviceIds };
}

function mergeCategories(first, second) {
  const result = new Map();
  [...first, ...second].forEach((category) => {
    const old = result.get(category.id);
    const services = [...(old?.services || []), ...(category.services || [])];
    result.set(category.id, { ...old, ...category, services: services.filter((service, index) => services.findIndex((item) => item.id === service.id) === index) });
  });
  return [...result.values()];
}

function Pencil() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m16.9 3.1 4 4L8.5 19.5 3 21l1.5-5.5L16.9 3.1Z" /><path d="m14 6 4 4" /></svg>;
}

function Field({ label, children }) {
  const id = useId();
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const editable = children.type === "input" || children.type === "textarea";

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return <div className="grid min-w-0 gap-1"><label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label><div className="relative">{cloneElement(children, { id, ...(editable ? { ref: inputRef, disabled: !editing } : {}) })}{editable && !editing && <button type="button" aria-label={`Edit ${label.toLowerCase()}`} aria-controls={id} onClick={() => setEditing(true)} className="absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-[#b61f4b] hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-[#b61f4b]"><Pencil /></button>}</div></div>;
}

function Chip({ label, onRemove }) {
  return <span className="inline-flex h-7 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-xs font-normal text-slate-700">{label}<button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="grid h-4 w-4 place-items-center rounded-full bg-[#b61f4b] text-white"><span className="relative -top-px text-sm leading-none">x</span></button></span>;
}

export default function BusinessProfileUpdate() {
  const [form, setForm] = useState(emptyForm);
  const [meta, setMeta] = useState({});
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editVersion, setEditVersion] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [failedImage, setFailedImage] = useState("");
  const imageInputRef = useRef(null);
  const imageUploadRef = useRef(null);
  const profileImage = imagePreview || form.logoUrl;

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => () => imageUploadRef.current?.abort(), []);

  const activeServices = categories.find((category) => category.id === activeCategoryId)?.services || [];
  const selectedCategories = categories.filter((category) => form.serviceCategoryIds.includes(category.id));
  const selectedServices = useMemo(() => {
    const all = categories.flatMap((category) => category.services);
    return all.filter((service, index) => form.serviceSubcategoryIds.includes(service.id) && all.findIndex((item) => item.id === service.id) === index);
  }, [categories, form.serviceSubcategoryIds]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      MainApi.get("/vendor/profile", { signal: controller.signal }), MainApi.get("/vendor/capabilities", { signal: controller.signal }),
      loadPublicServiceCategories((...args) => MainApi.get(...args), { signal: controller.signal }), loadAllCities((...args) => MainApi.get(...args), { signal: controller.signal }),
    ]).then(([profileResponse, capabilitiesResponse, categoryRecords, cityRecords]) => {
      if (controller.signal.aborted) return;
      const profile = profileResponse.data?.data || profileResponse.data || {};
      const capabilities = normalizeCapabilities(capabilitiesResponse.data);
      if (profile.primaryCity?.id && !cityRecords.some((city) => city.id === profile.primaryCity.id)) cityRecords.unshift(profile.primaryCity);
      setForm({ ...emptyForm, businessName: profile.businessName || "", about: profile.about || "", logoUrl: profile.logoUrl || "", logoPublicId: profile.logoPublicId || "", primaryCityId: profile.primaryCity?.id || profile.primaryCityId || "", profileStatus: profile.profileStatus || "ACTIVE", serviceCategoryIds: capabilities.categoryIds, serviceSubcategoryIds: capabilities.serviceIds });
      setMeta({ kycStatus: profile.kycStatus, profileStatus: profile.profileStatus });
      setCategories(mergeCategories(categoryRecords.map((category) => ({ ...category, services: [] })), capabilities.categories));
      setCities(cityRecords);
      setActiveCategoryId(capabilities.categoryIds[0] || "");
      setLoadingServices(Boolean(capabilities.categoryIds[0]));
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error, "Unable to load business profile."));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    if (!activeCategoryId || categories.find((category) => category.id === activeCategoryId)?.loaded) return;
    let mounted = true;
    MainApi.get("/service-subcategories", { params: { serviceCategoryId: activeCategoryId } }).then((response) => {
      if (!mounted) return;
      const services = normalizeItems(response.data, "service");
      setCategories((current) => current.map((category) => category.id === activeCategoryId ? { ...category, services: mergeCategories([{ ...category }], [{ ...category, services }])[0].services, loaded: true } : category));
    }).catch((error) => { if (mounted) setFeedback({ status: "error", title: "Services failed", text: getApiErrorMessage(error, "Unable to load services."), okLabel: "OK", onOk: () => setFeedback(null) }); }).finally(() => { if (mounted) setLoadingServices(false); });
    return () => { mounted = false; };
  }, [activeCategoryId, categories]);

  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function chooseCategory(id) { if (!id) return; setLoadingServices(!categories.find((category) => category.id === id)?.loaded); setActiveCategoryId(id); setForm((current) => ({ ...current, serviceCategoryIds: [...new Set([...current.serviceCategoryIds, id])] })); }
  function chooseServices(ids) {
    const selectedIds = typeof ids === "string" ? ids.split(",") : ids;
    const activeIds = new Set(activeServices.map((service) => service.id));
    setForm((current) => ({ ...current, serviceSubcategoryIds: [...new Set([...current.serviceSubcategoryIds.filter((id) => !activeIds.has(id)), ...selectedIds])] }));
  }
  function removeCategory(id) {
    const childIds = categories.find((category) => category.id === id)?.services.map((service) => service.id) || [];
    setForm((current) => ({ ...current, serviceCategoryIds: current.serviceCategoryIds.filter((value) => value !== id), serviceSubcategoryIds: current.serviceSubcategoryIds.filter((value) => !childIds.includes(value)) }));
    if (activeCategoryId === id) { setActiveCategoryId(""); setLoadingServices(false); }
  }

  async function uploadProfileImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploadingImage || saving) return;
    setImageError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Choose an image smaller than 5 MB.");
      return;
    }

    const controller = new AbortController();
    imageUploadRef.current = controller;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    const data = new FormData();
    data.append("file", file);
    data.append("purpose", "company-logo");
    data.append("name", "profile-image");
    try {
      const response = await MainApi.post("/uploads/image", data, { signal: controller.signal });
      const result = response.data?.data || response.data || {};
      const image = result.cloudinary || result.image || result.file || result.upload || result;
      const url = image.secure_url || image.secureUrl || image.url || result.url;
      const publicId = image.public_id || image.publicId || result.public_id || result.publicId;
      if (!url || !publicId) throw new Error("Upload response did not include an image URL or public ID.");
      if (controller.signal.aborted) return;
      setForm((current) => ({ ...current, logoUrl: url, logoPublicId: publicId }));
    } catch (error) {
      if (!controller.signal.aborted) setImageError(getApiErrorMessage(error, "Unable to upload profile image. Please try again."));
    } finally {
      if (!controller.signal.aborted) {
        setImagePreview("");
        setUploadingImage(false);
      }
    }
  }

  function removeProfileImage() {
    if (uploadingImage || saving) return;
    setForm((current) => ({ ...current, logoUrl: "", logoPublicId: "" }));
    setImagePreview("");
    setImageError("");
    setFailedImage("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (uploadingImage || saving || savingServices || loading || loadError) return;
    setSaving(true); setFeedback({ status: "loading", title: "Updating profile", text: "Please wait while business profile details are saved." });
    try {
      await MainApi.patch("/vendor/profile", {
        businessName: form.businessName.trim(),
        about: form.about.trim(),
        logoUrl: form.logoUrl.trim() || null,
        logoPublicId: form.logoPublicId.trim() || null,
        primaryCityId: form.primaryCityId,
        profileStatus: form.profileStatus,
      });
      setEditVersion((current) => current + 1);
      setMeta((current) => ({ ...current, profileStatus: form.profileStatus }));
      setFeedback({ status: "success", title: "Profile updated", text: "Business profile updated successfully.", okLabel: "OK", onOk: () => setFeedback(null) });
    } catch (error) { setFeedback({ status: "error", title: "Update failed", text: getApiErrorMessage(error, "Unable to update business profile."), okLabel: "OK", onOk: () => setFeedback(null) }); }
    finally { setSaving(false); }
  }

  async function saveServices(event) {
    event.preventDefault();
    if (savingServices || saving || loading || loadingServices || loadError) return;
    setSavingServices(true);
    setFeedback({ status: "loading", title: "Saving services", text: "Please wait while your services are submitted." });
    try {
      await MainApi.put("/vendor/capabilities", {
        serviceCategoryIds: form.serviceCategoryIds,
        serviceSubcategoryIds: form.serviceSubcategoryIds,
      });
      setFeedback({ status: "success", title: "Services saved", text: "Categories and services updated successfully.", okLabel: "OK", onOk: () => setFeedback(null) });
    } catch (error) {
      setFeedback({ status: "error", title: "Services failed", text: getApiErrorMessage(error, "Unable to save services."), okLabel: "OK", onOk: () => setFeedback(null) });
    } finally {
      setSavingServices(false);
    }
  }

  const inputClass = "h-9 w-full rounded border border-slate-300 bg-white px-3 pr-9 text-sm outline-none focus:border-[#b61f4b] disabled:bg-slate-50 disabled:text-slate-600";
  return <section className="rounded border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"><h1 className="text-lg font-semibold text-slate-950">Update Business Profile</h1><div className="flex gap-2 text-xs">{meta.kycStatus && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">KYC: {meta.kycStatus}</span>}{meta.profileStatus && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Profile: {meta.profileStatus}</span>}</div></div>
    <form key={editVersion} onSubmit={submit} className="grid gap-4 p-4">{loading ? <p className="bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading business profile...</p> : loadError ? <div role="alert" className="rounded border border-rose-200 bg-rose-50 p-4"><p className="text-sm text-rose-800">{loadError}</p><button type="button" onClick={() => { setLoadError(""); setLoading(true); setLoadAttempt((current) => current + 1); }} className="mt-3 rounded bg-[#b61f4b] px-4 py-2 text-sm font-semibold text-white">Retry loading profile</button></div> : <>
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-4">
        <div className="relative h-24 w-24 shrink-0">
          <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-rose-100 bg-rose-50 text-3xl font-semibold text-[#b61f4b]">
            {profileImage && profileImage !== failedImage ? <Image key={profileImage} src={profileImage} alt="Business profile photo" width={96} height={96} unoptimized onError={() => setFailedImage(profileImage)} className="h-full w-full object-cover" /> : <span aria-label="No profile photo">{form.businessName.trim().charAt(0).toUpperCase() || <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 5v3h18v-3c0-2.5-4-5-9-5Z" /></svg>}</span>}
          </div>
          <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage || saving} aria-label="Upload profile photo" className="absolute left-[85.355%] top-[85.355%] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#b61f4b] text-white shadow-sm hover:bg-[#981a3f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b61f4b] disabled:opacity-60">
            {uploadingImage ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="4" /></svg>}
          </button>
          {profileImage && <button type="button" onClick={removeProfileImage} disabled={uploadingImage || saving} aria-label="Remove profile photo" title="Remove profile photo" className="absolute left-[85.355%] top-[14.645%] grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-slate-700 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b61f4b] disabled:opacity-60"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M6 18 18 6" /></svg></button>}
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" onChange={uploadProfileImage} disabled={uploadingImage || saving} className="hidden" />
        </div>
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold text-slate-950">Profile photo</h2>
          {uploadingImage && <p role="status" className="text-xs text-slate-500">Uploading photo...</p>}
          {imageError && <p role="alert" className="text-xs text-rose-700">{imageError}</p>}
        </div>
      </div>
      <div className="grid items-end gap-3 md:grid-cols-2"><Field label="Business name"><input name="businessName" value={form.businessName} onChange={change} className={inputClass} /></Field><ProfileSelect label="Primary city" name="primaryCityId" value={form.primaryCityId} onChange={change} placeholder="Select city" options={cities.map((city) => ({ ...city, name: city.stateName ? `${city.name}, ${city.stateName}` : city.name }))} disabled={saving || savingServices} /></div>
      <Field label="About business"><textarea name="about" value={form.about} onChange={change} rows={3} className={`${inputClass} h-auto resize-none py-2`} /></Field>
      <fieldset disabled={saving || savingServices || uploadingImage} className="m-0 min-w-0 border-0 p-0">
        <legend className="mb-2 p-0 text-xs font-semibold text-slate-600">Profile status</legend>
        <div className="flex flex-wrap items-center gap-6">
          {["ACTIVE", "SUSPENDED"].map((status) => <label key={status} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input type="radio" name="profileStatus" value={status} checked={form.profileStatus === status} onChange={change} required className="h-4 w-4 accent-[#b61f4b]" />
            {status}
          </label>)}
        </div>
        {!["ACTIVE", "SUSPENDED"].includes(form.profileStatus) && <p className="mt-2 text-xs text-slate-500">Current status: {form.profileStatus}. Select a status before updating your profile.</p>}
      </fieldset>
    </>}<div className="flex justify-end border-t border-slate-200 pt-3"><button type="submit" disabled={saving || savingServices || loading || uploadingImage || Boolean(loadError)} className="rounded bg-[#b61f4b] px-5 py-2.5 text-sm font-bold text-white disabled:bg-stone-300">{saving ? "Updating..." : "Update Profile"}</button></div></form>
    {!loading && !loadError && <form onSubmit={saveServices} className="grid gap-4 px-4 pb-4">
      <fieldset disabled={savingServices || saving} className="min-w-0">
      <div className="grid gap-3 border-t border-slate-200 pt-3"><h2 className="text-sm font-bold text-slate-950">Categories And Services</h2><div className="grid gap-3 md:grid-cols-2"><ProfileSelect label="Service category" value={activeCategoryId} onChange={(event) => chooseCategory(event.target.value)} placeholder="Select category" options={categories} disabled={saving || savingServices} /><ProfileSelect label="Service" multiple value={form.serviceSubcategoryIds.filter((id) => activeServices.some((service) => service.id === id))} disabled={!activeCategoryId || loadingServices || saving || savingServices} onChange={(event) => chooseServices(event.target.value)} placeholder={loadingServices ? "Loading services..." : "Select service"} options={activeServices} /></div>
      <div className="flex flex-wrap gap-2">{selectedCategories.map((category) => <Chip key={category.id} label={category.name} onRemove={() => removeCategory(category.id)} />)}</div><div className="flex flex-wrap gap-2">{selectedServices.map((service) => <Chip key={service.id} label={service.name} onRemove={() => setForm((current) => ({ ...current, serviceSubcategoryIds: current.serviceSubcategoryIds.filter((id) => id !== service.id) }))} />)}</div></div>
      </fieldset>
      <div className="flex justify-end border-t border-slate-200 pt-3"><button type="submit" disabled={savingServices || saving || loadingServices} className="rounded bg-[#b61f4b] px-5 py-2.5 text-sm font-bold text-white disabled:bg-stone-300">{savingServices ? "Saving..." : "Save Services"}</button></div>
    </form>}
    <ApiStatusModal status={feedback?.status} title={feedback?.title} text={feedback?.text} okLabel={feedback?.okLabel} onOk={feedback?.onOk} />
  </section>;
}
