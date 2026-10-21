import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";
import { normalizeCategoryResponse } from "@/util/serviceCategories.mjs";
import ServiceSubcategoryMenu from "@/components/superadmin/ServiceSubcategoryMenu";
import ServiceCategoryActions from "@/components/superadmin/ServiceCategoryActions";
import ServiceCategoryDetails from "@/components/superadmin/ServiceCategoryDetails";


export default function ServiceCategoryList() {
  const rowsDropdownRef = useRef(null);
  const editOverlayRef = useRef(null);
  const editPanelRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [apiSearch, setApiSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);

  const visibleFrom = useMemo(() => (total ? (page - 1) * limit + 1 : 0), [limit, page, total]);
  const visibleTo = useMemo(() => Math.min((page - 1) * limit + categories.length, total), [categories.length, limit, page, total]);


  useEffect(() => {
    function closeRowsDropdown(event) {
      if (!rowsDropdownRef.current || rowsDropdownRef.current.contains(event.target)) return;
      setRowsDropdownOpen(false);
    }

    if (rowsDropdownOpen) document.addEventListener("mousedown", closeRowsDropdown);
    return () => document.removeEventListener("mousedown", closeRowsDropdown);
  }, [rowsDropdownOpen]);

  useEffect(() => {
    if (!editTarget || !editOverlayRef.current || !editPanelRef.current) return undefined;

    const context = gsap.context(() => {
      gsap.set(editOverlayRef.current, { autoAlpha: 0 });
      gsap.set(editPanelRef.current, { y: -96, autoAlpha: 0, scale: 0.96 });
      gsap.timeline()
        .to(editOverlayRef.current, { autoAlpha: 1, duration: 0.22, ease: "power2.out" })
        .to(editPanelRef.current, { y: 0, autoAlpha: 1, scale: 1, duration: 0.52, ease: "power3.out" }, "-=0.08");
    }, editOverlayRef);

    return () => context.revert();
  }, [editTarget]);

  useEffect(() => {
    const trimmedSearch = search.trim();
    const nextSearch = trimmedSearch.length >= 3 ? trimmedSearch : "";
    const timeout = setTimeout(() => {
      setApiSearch(nextSearch);
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setIsLoading(true);
      try {
        const response = await MainApi.get("/admin/service-categories", {
          params: { page, limit, search: apiSearch },
          signal: controller.signal,
        });
        const result = normalizeCategoryResponse(response.data, page, limit);
        if (controller.signal.aborted) return;
        setCategories(result.categories);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
        setFeedback({
          status: "error",
          title: "Categories failed",
          text: getApiErrorMessage(error, "Unable to load service categories."),
          okLabel: "OK",
          onOk: () => setFeedback(null),
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadCategories();

    return () => controller.abort();
  }, [apiSearch, limit, page]);

  async function deleteRow() {
    if (!deleteTarget) return;

    setFeedback({
      status: "loading",
      title: deleteTarget.rowType === "category" ? "Deleting category" : "Deleting subcategory",
      text: "Please wait while the record is removed.",
    });

    try {
      if (deleteTarget.rowType === "category") {
        await MainApi.delete(`/admin/service-categories/${deleteTarget.categoryId}`);
        setTotal((current) => Math.max(0, current - 1));
        setTotalPages(Math.max(1, Math.ceil((total - 1) / limit)));
        if (categories.length === 1 && page > 1) setPage((current) => current - 1);
      } else {
        await MainApi.delete(`/admin/service-subcategories/${deleteTarget.serviceId}`);
      }

      setDeleteTarget(null);
      setFeedback({
        status: "success",
        title: deleteTarget.rowType === "category" ? "Category deleted" : "Subcategory deleted",
        text: deleteTarget.rowType === "category" ? "Service category deleted successfully." : "Subcategory deleted successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
      setCategories((current) => {
        if (deleteTarget.rowType === "category") {
          return current.filter((category) => category.id !== deleteTarget.categoryId);
        }

        return current.map((category) =>
          category.id === deleteTarget.categoryId
            ? {
                ...category,
                subcategories: category.subcategories.filter((subcategory) => subcategory.id !== deleteTarget.serviceId),
              }
            : category
        );
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Delete failed",
        text: getApiErrorMessage(error, "Unable to delete record."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    }
  }

  function openEditModal(target) {
    setEditTarget(target);
    setEditName(target.name);
    setEditDescription(target.description || "");
    setEditError("");
  }

  function closeEditModal() {
    if (!editOverlayRef.current || !editPanelRef.current) {
      setEditTarget(null);
      return;
    }

    gsap.timeline({
      onComplete: () => setEditTarget(null),
    })
      .to(editPanelRef.current, { y: -78, autoAlpha: 0, scale: 0.97, duration: 0.24, ease: "power2.in" })
      .to(editOverlayRef.current, { autoAlpha: 0, duration: 0.18, ease: "power2.in" }, "-=0.08");
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editTarget) return;

    const nextName = editName.trim();
    const nextDescription = editDescription.trim();

    if (!nextName) {
      setEditError(editTarget.type === "category" ? "Enter category name." : "Enter service name.");
      return;
    }

    setIsUpdating(true);
    setFeedback({
      status: "loading",
      title: editTarget.type === "category" ? "Updating category" : "Updating service",
      text: "Please wait while changes are saved.",
    });

    try {
      if (editTarget.type === "category") {
        await MainApi.patch(`/admin/service-categories/${editTarget.categoryId}`, {
          name: nextName,
          description: nextDescription,
        });

        setCategories((current) =>
          current.map((category) =>
            category.id === editTarget.categoryId
              ? { ...category, name: nextName, description: nextDescription }
              : category
          )
        );
      } else {
        await MainApi.patch(`/admin/service-subcategories/${editTarget.serviceId}`, {
          name: nextName,
          description: nextDescription,
          serviceCategoryId: editTarget.categoryId,
        });

        setCategories((current) =>
          current.map((category) =>
            category.id === editTarget.categoryId
              ? {
                  ...category,
                  subcategories: category.subcategories.map((subcategory) =>
                    subcategory.id === editTarget.serviceId
                      ? { ...subcategory, name: nextName, description: nextDescription }
                      : subcategory
                  ),
                }
              : category
          )
        );
      }

      closeEditModal();
      setFeedback({
        status: "success",
        title: editTarget.type === "category" ? "Category updated" : "Service updated",
        text: editTarget.type === "category" ? "Service category updated successfully." : "Service updated successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Update failed",
        text: getApiErrorMessage(error, "Unable to update details."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-950">Services List</h1>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-200 px-4 py-2.5">
        <label className="relative block w-full md:w-[360px]">
            <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-full w-full fill-current" aria-hidden="true">
                <path d="m20.49 19.07-4.35-4.35a7.1 7.1 0 1 0-1.42 1.42l4.35 4.35 1.42-1.42ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service or category"
              className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b61f4b]"
            />
          </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[27%]" />
            <col className="w-[29%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900">
            <tr>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Service Category</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Subcategories</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Status</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Created On</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Updated On</th>
              <th className="px-4 py-2.5 text-right text-[13px] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Loading categories...</td></tr> : categories.length ? categories.map((category) => (
              <tr key={category.id} className="bg-white transition hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-800">{category.name}</td>
                <td className="px-4 py-3">
                  <ServiceSubcategoryMenu category={category}
                    onLoaded={(categoryId, subcategories) => setCategories((current) => current.map((item) => item.id === categoryId ? { ...item, subcategories, subcategoriesLoaded: true } : item))}
                    onEdit={(service) => openEditModal({ type: "subcategory", name: service.name, description: service.description, serviceId: service.id, categoryId: category.id })}
                    onDelete={(service) => setDeleteTarget({ rowType: "subcategory", serviceId: service.id, title: service.name, categoryId: category.id, categoryName: category.name })}
                  />
                </td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{category.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 text-xs text-slate-700">{category.createdAt ? new Date(category.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "Not available"}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{category.updatedAt ? new Date(category.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "Not available"}</td>
                <td className="px-4 py-3">
                  <ServiceCategoryActions category={category}
                    onView={() => setDetailTarget(category)}
                    onEdit={() => openEditModal({ type: "category", name: category.name, description: category.description, categoryId: category.id })}
                    onDelete={() => setDeleteTarget({ rowType: "category", categoryId: category.id, categoryName: category.name })}
                  />
                </td>
              </tr>
            )) : <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">No services found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex min-h-12 flex-wrap items-center justify-end gap-5 border-t border-slate-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-normal text-slate-950">
          Rows per page:
          <div ref={rowsDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setRowsDropdownOpen((open) => !open)}
              className={`flex h-8 min-w-20 items-center justify-between gap-2 rounded border bg-white py-0 pl-3 pr-2 text-sm font-normal text-slate-900 outline-none transition ${rowsDropdownOpen ? "border-[#b61f4b]" : "border-slate-300"}`}
              aria-haspopup="listbox"
              aria-expanded={rowsDropdownOpen}
              aria-label="Rows per page"
            >
              <span>{limit}</span>
              <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-current text-slate-500 transition ${rowsDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="M7 10l5 5 5-5H7Z" />
              </svg>
            </button>
            {rowsDropdownOpen ? (
              <div className="absolute bottom-10 right-0 z-30 w-24 rounded border border-slate-200 bg-white py-1 shadow-xl" role="listbox">
                {[20, 50, 100].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setLimit(value);
                      setPage(1);
                      setRowsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-rose-50 hover:text-[#b61f4b] ${limit === value ? "bg-rose-50 font-semibold text-[#b61f4b]" : "text-slate-700"}`}
                    role="option"
                    aria-selected={limit === value}
                  >
                    {value}
                    {limit === value ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />
                      </svg>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <span className="text-sm font-normal text-slate-950">
          {visibleFrom}-{visibleTo} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
            className="grid h-8 w-8 place-items-center rounded text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || isLoading}
            className="grid h-8 w-8 place-items-center rounded text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Next page"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z" />
            </svg>
          </button>
        </div>
      </div>

      {detailTarget && <ServiceCategoryDetails key={detailTarget.id} category={detailTarget} onClose={() => setDetailTarget(null)} />}
      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.rowType === "category" ? "Delete category?" : "Delete subcategory?"}
        text={deleteTarget ? `Are you sure you want to delete ${deleteTarget.rowType === "category" ? deleteTarget.categoryName : deleteTarget.title}?` : ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteRow}
      />
      {editTarget ? (
        <div ref={editOverlayRef} className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <form ref={editPanelRef} onSubmit={submitEdit} className="w-full max-w-md rounded bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">
                {editTarget.type === "category" ? "Edit Category" : "Edit Service"}
              </h2>
            </div>
            <div className="grid gap-4 px-5 py-5">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Name</span>
                <input
                  value={editName}
                  onChange={(event) => {
                    setEditName(event.target.value);
                    setEditError("");
                  }}
                  className="h-11 rounded border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-[#b61f4b]"
                  autoFocus
                />
                {editError ? <small className="text-xs font-medium text-red-600">{editError}</small> : null}
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Description</span>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  className="resize-none rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b61f4b]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={closeEditModal}
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
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <ApiStatusModal
        status={feedback?.status}
        title={feedback?.title}
        text={feedback?.text}
        okLabel={feedback?.okLabel}
        onOk={feedback?.onOk}
      />
    </section>
  );
}
