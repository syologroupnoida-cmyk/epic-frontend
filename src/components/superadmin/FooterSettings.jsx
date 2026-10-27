import { useEffect, useState } from "react";
import MainApi from "@/util/MainApi";
import { loadAllServiceCategories } from "@/util/serviceCategories.mjs";
import { readFooterCategoryIds, saveFooterCategoryIds } from "@/util/footerSettings";
import ApiStatusModal from "@/components/common/ApiStatusModal";

export default function FooterSettings() {
  const [categories, setCategories] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savePopupOpen, setSavePopupOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadAllServiceCategories((...args) => MainApi.get(...args), { signal: controller.signal })
      .then((items) => {
        const activeCategories = items.filter((item) => item.isActive !== false);
        const storedIds = readFooterCategoryIds();
        setCategories(activeCategories);
        setSelectedIds(storedIds === null ? activeCategories.map((item) => item.id) : storedIds);
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError" && requestError.code !== "ERR_CANCELED") {
          setError(requestError.message || "Unable to load service categories.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function toggleCategory(categoryId) {
    setSelectedIds((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  }

  function saveSettings() {
    saveFooterCategoryIds(selectedIds);
    setSavePopupOpen(true);
  }

  return (
    <section className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-950">Footer Settings</h1>
        <p className="mt-1 text-sm font-normal text-slate-500">Choose the service-category columns displayed in the website footer.</p>
      </div>

      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Each selected category displays links for all available cities.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSelectedIds(categories.map((item) => item.id))} className="h-9 rounded border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:border-[#b61f4b] hover:text-[#b61f4b]">Select all</button>
            <button type="button" onClick={() => setSelectedIds([])} className="h-9 rounded border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:border-[#b61f4b] hover:text-[#b61f4b]">Clear all</button>
          </div>
        </div>

        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading categories...</p> : null}
        {error ? <p className="rounded bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {!loading && !error ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <label key={category.id} className={`flex cursor-pointer items-center gap-3 px-1 py-2 text-sm transition ${selectedIds.includes(category.id) ? "text-[#8f173b]" : "text-slate-700 hover:text-[#b61f4b]"}`}>
                <input type="checkbox" checked={selectedIds.includes(category.id)} onChange={() => toggleCategory(category.id)} className="h-4 w-4 cursor-pointer accent-[#b61f4b]" />
                <span className="font-medium">{category.name}</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-4">
          <button type="button" onClick={saveSettings} disabled={loading || Boolean(error)} className="h-10 rounded bg-[#b61f4b] px-6 text-sm font-semibold text-white hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:opacity-50">Save Footer Settings</button>
        </div>
      </div>
      <ApiStatusModal
        status={savePopupOpen ? "success" : undefined}
        title="Footer settings saved"
        text="The selected service categories will now appear in the website footer."
        okLabel="OK"
        onOk={() => setSavePopupOpen(false)}
      />
    </section>
  );
}
