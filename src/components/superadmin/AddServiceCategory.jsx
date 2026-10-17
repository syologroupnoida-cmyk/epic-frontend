import Link from "next/link";
import { useMemo, useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";
import OfferingKindSelect from "@/components/superadmin/OfferingKindSelect";
import IsActiveRadio from "@/components/superadmin/IsActiveRadio";

export default function AddServiceCategory({ embedded = false }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [offeringKind, setOfferingKind] = useState("SERVICE");
  const [isActive, setIsActive] = useState(true);
  const [categories, setCategories] = useState([]);
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canSubmit = useMemo(() => categories.length > 0 && !isSubmitting, [categories.length, isSubmitting]);

  function addCategory(event) {
    event.preventDefault();

    const nextName = name.trim();
    if (!nextName) {
      setFieldError("Enter service category name.");
      return;
    }

    const alreadyAdded = categories.some((item) => item.name.toLowerCase() === nextName.toLowerCase());
    if (alreadyAdded) {
      setFieldError("This service category is already added.");
      return;
    }

    const nextDescription = description.trim();
    setCategories((current) => [...current, {
      name: nextName,
      ...(nextDescription ? { description: nextDescription } : {}),
      offeringKind,
      isActive,
    }]);
    setName("");
    setDescription("");
    setIsActive(true);
    setFieldError("");
  }

  function removeCategory(category) {
    setCategories((current) => current.filter((item) => item.name !== category.name));
  }

  async function submitCategories(event) {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback({
      status: "loading",
      title: "Creating categories",
      text: "Please wait while service categories are added.",
    });

    try {
      await MainApi.post("/admin/service-categories", categories);

      setCategories([]);
      setFeedback({
        status: "success",
        title: "Categories created",
        text: "Service categories added successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Category failed",
        text: getApiErrorMessage(error, "Unable to create service category."),
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
            <h1 className="font-serif text-xl font-bold text-stone-950">Add Service Category</h1>
            <div className="mt-3 border-t border-rose-100" />
          </div>
          <form onSubmit={submitCategories}>
            <div className="grid grid-cols-12 gap-4 px-4 pb-0 md:grid-cols-[repeat(3,minmax(0,1fr))_46px]">
              <OfferingKindSelect value={offeringKind} onChange={setOfferingKind} disabled={isSubmitting} className="md:col-span-1" />
              <label className="mui-field col-span-12 md:col-span-1">
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") addCategory(event); }}
                  placeholder=" "
                  disabled={isSubmitting}
                />
                <span>Description (optional)</span>
              </label>
              <label className="mui-field col-span-12 md:col-span-1">
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setFieldError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addCategory(event);
                  }}
                  placeholder=" "
                  disabled={isSubmitting}
                />
                <span>Service category name</span>
                {fieldError ? <small>{fieldError}</small> : null}
              </label>
              <div className="col-span-12 flex items-start md:col-span-1">
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={isSubmitting}
                  className="grid h-[46px] w-[46px] place-items-center rounded bg-[#b61f4b] text-2xl font-semibold leading-none text-white shadow-sm hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
                  aria-label="Add category"
                >
                  +
                </button>
              </div>
            </div>

            <IsActiveRadio value={isActive} onChange={setIsActive} disabled={isSubmitting} />

            {categories.length ? (
              <div className="mx-4 mt-1 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.name}
                    title={category.description}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium leading-none text-[#b61f4b]"
                  >
                    {category.name} · {category.offeringKind === "VENUE_PROPERTY" ? "Property" : "Service"}
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] leading-none text-[#b61f4b] hover:bg-[#b61f4b] hover:text-white"
                      disabled={isSubmitting}
                      aria-label={`Remove ${category.name}`}
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
                {isSubmitting ? "Creating..." : "Create Category"}
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
