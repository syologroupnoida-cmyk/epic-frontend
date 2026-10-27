import { useEffect, useMemo, useRef, useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import EditCityModal from "@/components/superadmin/EditCityModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";
import { normalizeCityResponse } from "@/util/cities.mjs";


function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CityList() {
  const rowsDropdownRef = useRef(null);
  const actionMenuRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [countryCode, setCountryCode] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState("");
  const [editCity, setEditCity] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const visibleFrom = useMemo(() => (total ? (page - 1) * limit + 1 : 0), [limit, page, total]);
  const visibleTo = useMemo(() => Math.min((page - 1) * limit + cities.length, total), [cities.length, limit, page, total]);

  useEffect(() => {
    function closeRowsDropdown(event) {
      if (!rowsDropdownRef.current || rowsDropdownRef.current.contains(event.target)) return;
      setRowsDropdownOpen(false);
    }

    if (rowsDropdownOpen) document.addEventListener("mousedown", closeRowsDropdown);
    return () => document.removeEventListener("mousedown", closeRowsDropdown);
  }, [rowsDropdownOpen]);

  useEffect(() => {
    function closeActionMenu(event) {
      if (!actionMenuRef.current || actionMenuRef.current.contains(event.target)) return;
      setOpenActionId("");
    }

    if (openActionId) document.addEventListener("mousedown", closeActionMenu);
    return () => document.removeEventListener("mousedown", closeActionMenu);
  }, [openActionId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      setIsLoading(true);
      try {
        const response = await MainApi.get("/admin/cities", {
          params: {
            page,
            limit,
            ...(countryFilter ? { countryCode: countryFilter } : {}),
          },
          signal: controller.signal,
        });
        const result = normalizeCityResponse(response.data, page, limit);
        if (controller.signal.aborted) return;
        setCities(result.cities);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setHasNextPage(result.hasNextPage);
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
        setFeedback({
          status: "error",
          title: "Cities failed",
          text: getApiErrorMessage(error, "Unable to load cities."),
          okLabel: "OK",
          onOk: () => setFeedback(null),
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadCities();

    return () => controller.abort();
  }, [countryFilter, limit, page]);

  function applyCountryFilter() {
    const nextCountryCode = countryCode.trim().toUpperCase();
    if (nextCountryCode.length !== 0 && nextCountryCode.length !== 2) return;
    setCountryCode(nextCountryCode);
    setCountryFilter(nextCountryCode);
    setPage(1);
  }

  async function toggleCityStatus(city) {
    const nextStatus = !city.isActive;
    setOpenActionId("");
    setFeedback({
      status: "loading",
      title: nextStatus ? "Activating city" : "Deactivating city",
      text: "Please wait while the city status is updated.",
    });

    try {
      await MainApi.patch(`/admin/cities/${city.id}`, { isActive: nextStatus });
      setCities((current) =>
        current.map((item) => item.id === city.id ? { ...item, isActive: nextStatus } : item),
      );
      setFeedback({
        status: "success",
        title: "City status updated",
        text: `${city.name} is now ${nextStatus ? "active" : "inactive"}.`,
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Status failed",
        text: getApiErrorMessage(error, "Unable to update city status."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    }
  }

  async function updateCity(cityId, payload, closeModal) {
    setIsUpdating(true);
    setFeedback({
      status: "loading",
      title: "Updating city",
      text: "Please wait while the city details are saved.",
    });

    try {
      await MainApi.put(`/admin/cities/${cityId}`, payload);
      setCities((current) =>
        current.map((city) => city.id === cityId ? { ...city, ...payload } : city),
      );
      closeModal();
      setFeedback({
        status: "success",
        title: "City updated",
        text: "City details updated successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Update failed",
        text: getApiErrorMessage(error, "Unable to update city details."),
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
        <h1 className="text-lg font-semibold text-slate-950">City List</h1>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-200 px-4 py-2.5">
        <label className="relative block w-full md:w-[360px]">
          <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-full w-full fill-current" aria-hidden="true">
              <path d="m20.49 19.07-4.35-4.35a7.1 7.1 0 1 0-1.42 1.42l4.35 4.35 1.42-1.42ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" />
            </svg>
          </span>
          <input
            value={countryCode}
            onChange={(event) => {
              const nextCountryCode = event.target.value.toUpperCase();
              setCountryCode(nextCountryCode);
              if (nextCountryCode.length === 0 || nextCountryCode.length === 2) {
                setCountryFilter(nextCountryCode);
                setPage(1);
              }
            }}
            onBlur={applyCountryFilter}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyCountryFilter();
              }
            }}
            maxLength={2}
            placeholder="Search country code"
            aria-label="Filter cities by country code"
            className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-[#b61f4b]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[23%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900">
            <tr>
              <th className="px-4 py-2.5 text-[13px] font-semibold">City Name</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">State Name</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Country Code</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Status</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Created On</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Updated On</th>
              <th className="px-4 py-2.5 text-right text-[13px] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                  Loading cities...
                </td>
              </tr>
            ) : cities.length ? (
              cities.map((city) => (
                <tr key={city.id} className="bg-white transition hover:bg-slate-50">
                  <td className="truncate px-4 py-3 font-medium text-[#00194f]">{city.name}</td>
                  <td className="truncate px-4 py-3 font-semibold text-slate-800">{city.stateName || "Not available"}</td>
                  <td className="px-4 py-3 font-semibold uppercase text-slate-800">{city.countryCode || "NA"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${city.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {city.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-normal text-slate-800">{formatDate(city.createdAt)}</td>
                  <td className="px-4 py-3 font-normal text-slate-800">{formatDate(city.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div ref={openActionId === city.id ? actionMenuRef : null} className="relative flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenActionId((current) => current === city.id ? "" : city.id)}
                        className="grid h-5 w-5 cursor-pointer place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        aria-label={`Actions for ${city.name}`}
                      >
                        <span className="flex gap-[2px]">
                          <span className="h-[3px] w-[3px] rounded-full bg-current" />
                          <span className="h-[3px] w-[3px] rounded-full bg-current" />
                          <span className="h-[3px] w-[3px] rounded-full bg-current" />
                        </span>
                      </button>

                      {openActionId === city.id ? (
                        <div className="absolute right-0 top-7 z-20 w-44 rounded border border-slate-200 bg-white py-1.5 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setEditCity(city);
                              setOpenActionId("");
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-[#b61f4b]"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                              <path d="M5 3h9.5l-2 2H5v14h14v-7.5l2-2V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2Zm13.38.58a1.5 1.5 0 0 1 2.12 0l.92.92a1.5 1.5 0 0 1 0 2.12l-8.72 8.72-4.1.98.98-4.1 8.8-8.64Zm-7.02 9.44-.22.9.9-.22 6.8-6.8-.68-.68-6.8 6.8Z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCityStatus(city)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-[#b61f4b]"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                              <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm-1 14-4-4 1.41-1.41L11 13.17l5.59-5.58L18 9l-7 7Z" />
                            </svg>
                            {city.isActive ? "Set Inactive" : "Set Active"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                  <div className="grid justify-items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                        <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                      </svg>
                    </span>
                    <span>No cities found.</span>
                  </div>
                </td>
              </tr>
            )}
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
            disabled={!hasNextPage || isLoading}
            className="grid h-8 w-8 place-items-center rounded text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Next page"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z" />
            </svg>
          </button>
        </div>
      </div>

      {editCity ? (
        <EditCityModal
          key={editCity.id}
          city={editCity}
          isUpdating={isUpdating}
          onClose={() => setEditCity(null)}
          onSubmit={updateCity}
        />
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
