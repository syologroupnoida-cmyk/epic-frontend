import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";
import IsActiveRadio from "@/components/superadmin/IsActiveRadio";
import { loadAllServiceCategories } from "@/util/serviceCategories.mjs";


export default function AddServices({ embedded = false }) {
  const categoryDropdownRef = useRef(null);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [services, setServices] = useState([]);
  const [fieldError, setFieldError] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selectedCategory = useMemo(
    () => serviceCategories.find((category) => category.id === selectedCategoryId),
    [selectedCategoryId, serviceCategories],
  );
  const canSubmit = Boolean(selectedCategoryId && services.length && !isSubmitting);

  useEffect(() => {
    function closeCategoryDropdown(event) {
      if (!categoryDropdownRef.current || categoryDropdownRef.current.contains(event.target)) return;
      setCategoryDropdownOpen(false);
    }

    if (categoryDropdownOpen) document.addEventListener("mousedown", closeCategoryDropdown);
    return () => document.removeEventListener("mousedown", closeCategoryDropdown);
  }, [categoryDropdownOpen]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const nextCategories = await loadAllServiceCategories((...args) => MainApi.get(...args), { signal: controller.signal });
        if (!isMounted) return;
        setServiceCategories(nextCategories);
        if (nextCategories.length) {
          setSelectedCategoryId(nextCategories[0].id);
        }
      } catch (error) {
        if (!isMounted) return;
        setFeedback({
          status: "error",
          title: "Categories failed",
          text: getApiErrorMessage(error, "Unable to load service categories."),
          okLabel: "OK",
          onOk: () => setFeedback(null),
        });
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  function addService(event) {
    event.preventDefault();

    const nextName = serviceName.trim();
    if (!selectedCategoryId) {
      setFieldError("Select service category first.");
      return;
    }

    if (!nextName) {
      setFieldError("Enter service name.");
      return;
    }

    const alreadyAdded = services.some((item) => item.name.toLowerCase() === nextName.toLowerCase());
    if (alreadyAdded) {
      setFieldError("This service is already added.");
      return;
    }

    const description = serviceDescription.trim();
    setServices((current) => [...current, {
      name: nextName,
      ...(description ? { description } : {}),
      isActive,
    }]);
    setServiceName("");
    setServiceDescription("");
    setIsActive(true);
    setFieldError("");
  }

  function removeService(service) {
    setServices((current) => current.filter((item) => item.name !== service.name));
  }

  function changeCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setCategoryDropdownOpen(false);
    setServices([]);
    setServiceName("");
    setServiceDescription("");
    setFieldError("");
  }

  async function submitServices(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback({
      status: "loading",
      title: "Creating services",
      text: "Please wait while services are added.",
    });

    try {
      await MainApi.post("/admin/service-subcategories", {
        serviceCategoryId: selectedCategoryId,
        subcategories: services,
      });

      setServices([]);
      setServiceName("");
      setServiceDescription("");
      setFeedback({
        status: "success",
        title: "Services created",
        text: "Services added successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Services failed",
        text: getApiErrorMessage(error, "Unable to create services."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={embedded ? "text-stone-900" : "min-h-screen bg-[#f7f2ef] text-stone-900"}>
      <main className={embedded ? "w-full" : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
        {!embedded ? (
          <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/superadmin/dashboard"
              className="rounded border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:border-[#b61f4b] hover:text-[#b61f4b]"
            >
              Back to dashboard
            </Link>
          </div>
        ) : null}

        <section className="rounded border border-rose-100 bg-white shadow-sm">
          <div className="px-4 py-4">
            <h1 className="font-serif text-xl font-bold text-stone-950">Add Services</h1>
            <div className="mt-3 border-t border-rose-100" />
          </div>
          <form onSubmit={submitServices}>
            <div className="grid grid-cols-12 gap-4 px-4 pb-0 md:grid-cols-[repeat(3,minmax(0,1fr))_46px]">
              <div ref={categoryDropdownRef} className="relative col-span-12 pb-[18px] md:col-span-1">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((open) => !open)}
                  disabled={isLoadingCategories || !serviceCategories.length}
                  className={`flex h-[46px] w-full items-center justify-between rounded border bg-white px-3 text-left text-sm outline-none transition ${categoryDropdownOpen ? "border-[#b61f4b]" : "border-rose-200"} ${selectedCategory ? "text-stone-900" : "text-stone-500"} disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400`}
                  aria-haspopup="listbox"
                  aria-expanded={categoryDropdownOpen}
                >
                  <span className="truncate">{isLoadingCategories ? "Loading categories..." : selectedCategory?.name || "Select service category"}</span>
                  <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current text-[#b61f4b] transition ${categoryDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true">
                    <path d="M7 10l5 5 5-5H7Z" />
                  </svg>
                </button>
                <span className="pointer-events-none absolute left-3 top-[-8px] bg-white px-1 text-xs font-medium text-[#b61f4b]">Service category</span>
                {categoryDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-[52px] z-30 max-h-[min(384px,60dvh)] overflow-auto rounded border border-slate-200 bg-white py-1 shadow-xl" role="listbox">
                    {serviceCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => changeCategory(category.id)}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-rose-50 hover:text-[#b61f4b] ${selectedCategoryId === category.id ? "bg-rose-50 font-semibold text-[#b61f4b]" : "text-stone-700"}`}
                        role="option"
                        aria-selected={selectedCategoryId === category.id}
                      >
                        <span className="truncate">{category.name}</span>
                        {selectedCategoryId === category.id ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
                          </svg>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <label className="mui-field col-span-12 md:col-span-1">
                <input
                  value={serviceDescription}
                  onChange={(event) => setServiceDescription(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") addService(event); }}
                  placeholder=" "
                  disabled={!selectedCategoryId || isSubmitting}
                />
                <span>Description (optional)</span>
              </label>
              <label className="mui-field col-span-12 md:col-span-1">
                <input
                  value={serviceName}
                  onChange={(event) => {
                    setServiceName(event.target.value);
                    setFieldError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addService(event);
                  }}
                  placeholder=" "
                  disabled={!selectedCategoryId}
                />
                <span>Service name</span>
                {fieldError ? <small>{fieldError}</small> : null}
              </label>
              <div className="col-span-12 flex items-start md:col-span-1">
                <button
                  type="button"
                  onClick={addService}
                  disabled={!selectedCategoryId}
                  className="grid h-[46px] w-[46px] place-items-center rounded bg-[#b61f4b] text-2xl font-semibold leading-none text-white shadow-sm hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
                  aria-label="Add service"
                >
                  +
                </button>
              </div>
            </div>

            <IsActiveRadio value={isActive} onChange={setIsActive} disabled={isSubmitting || !selectedCategoryId} />

            {selectedCategory ? (
              <p className="mx-4 mt-1 text-sm font-medium text-stone-500">
                Selected category: <span className="text-[#b61f4b]">{selectedCategory.name}</span>
              </p>
            ) : null}

            {services.length ? (
              <div className="mx-4 mt-4 flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service.name}
                    title={service.description}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium leading-none text-[#b61f4b]"
                  >
                    {service.name}
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] leading-none text-[#b61f4b] hover:bg-[#b61f4b] hover:text-white"
                      aria-label={`Remove ${service.name}`}
                    >
                      <span className="-translate-y-px">x</span>
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mx-4 mt-7 flex justify-end border-t border-rose-100 py-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded bg-[#b61f4b] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? "Creating..." : "Create Service"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <ApiStatusModal
        status={feedback?.status}
        title={feedback?.title}
        text={feedback?.text}
        okLabel={feedback?.okLabel}
        onOk={feedback?.onOk}
      />
    </div>
  );
}
