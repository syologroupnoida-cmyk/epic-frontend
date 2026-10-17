import Link from "next/link";
import { useMemo, useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";

const initialForm = {
  name: "",
  stateName: "",
  countryCode: "IN",
  isActive: true,
};

export default function AddCity({ embedded = false }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canSubmit = useMemo(
    () => Boolean(form.name.trim() && form.stateName.trim() && form.countryCode.trim() && !isSubmitting),
    [form.countryCode, form.name, form.stateName, isSubmitting],
  );

  function updateField(event) {
    const { name, value, type } = event.target;
    setErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({
      ...current,
      [name]: type === "radio" && name === "isActive" ? value === "true" : value,
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Enter city name.";
    if (!form.stateName.trim()) nextErrors.stateName = "Enter state name.";
    if (!form.countryCode.trim()) nextErrors.countryCode = "Enter country code.";

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  async function submitCity(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      stateName: form.stateName.trim(),
      countryCode: form.countryCode.trim().toUpperCase(),
      isActive: Boolean(form.isActive),
    };

    setIsSubmitting(true);
    setFeedback({
      status: "loading",
      title: "Creating city",
      text: "Please wait while the city is added.",
    });

    try {
      await MainApi.post("/admin/cities", payload);
      setForm(initialForm);
      setFeedback({
        status: "success",
        title: "City created",
        text: "City added successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "City failed",
        text: getApiErrorMessage(error, "Unable to create city."),
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
            <h1 className="font-serif text-xl font-bold text-stone-950">Add City</h1>
            <div className="mt-3 border-t border-rose-100" />
          </div>

          <form onSubmit={submitCity}>
            <div className="grid grid-cols-12 gap-4 px-4 pb-0">
              <label className="mui-field col-span-12 md:col-span-5">
                <input name="name" value={form.name} onChange={updateField} placeholder=" " />
                <span>City name</span>
                {errors.name ? <small>{errors.name}</small> : null}
              </label>

              <label className="mui-field col-span-12 md:col-span-5">
                <input name="stateName" value={form.stateName} onChange={updateField} placeholder=" " />
                <span>State name</span>
                {errors.stateName ? <small>{errors.stateName}</small> : null}
              </label>

              <label className="mui-field col-span-12 md:col-span-2">
                <input name="countryCode" value={form.countryCode} onChange={updateField} maxLength={3} placeholder=" " className="uppercase" />
                <span>Country code</span>
                {errors.countryCode ? <small>{errors.countryCode}</small> : null}
              </label>

              <div className="col-span-12 flex flex-wrap items-center gap-4 py-1 md:col-span-12">
                <span className="text-sm font-bold text-stone-700">Status</span>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-700">
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
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-700">
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

            <div className="mx-4 mt-7 flex justify-end border-t border-rose-100 py-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded bg-[#b61f4b] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isSubmitting ? "Creating..." : "Create City"}
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
