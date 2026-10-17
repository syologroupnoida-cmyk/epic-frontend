import { useEffect, useMemo, useRef, useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";

function getValue(record, paths, fallback = "") {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], record);
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function formatReadableValue(value) {
  if (value === undefined || value === null || value === "") return "Not added";
  if (Array.isArray(value)) {
    const values = value
      .map((item) => {
        if (item === undefined || item === null || item === "") return "";
        if (typeof item !== "object") return String(item);
        return item.name || item.title || item.label || item.id || item._id || "";
      })
      .filter(Boolean);

    return values.length ? values.join(", ") : "Not added";
  }

  if (typeof value !== "object") return String(value);

  const displayValue = value.name || value.title || value.label || value.url || value.secure_url || "";
  if (displayValue) return String(displayValue);

  const pairs = Object.entries(value)
    .filter(([, itemValue]) => itemValue !== undefined && itemValue !== null && itemValue !== "")
    .map(([key, itemValue]) => `${formatKey(key)}: ${formatReadableValue(itemValue)}`);

  return pairs.length ? pairs.join(", ") : "Not added";
}

function formatAddress(address, city, state) {
  if (typeof address === "string") return address || [city, state].filter(Boolean).join(", ") || "Not added";

  const addressParts = [
    address?.street,
    address?.locality,
    address?.city || city,
    address?.state || state,
    address?.pincode,
    address?.country,
  ].filter(Boolean);

  return addressParts.length ? addressParts.join(", ") : "Not added";
}

function getDocumentUrl(document) {
  if (!document || typeof document !== "object") return "";
  return document.url || document.secure_url || document.secureUrl || document.documentUrl || document.imageUrl || "";
}

function getDocumentByType(documents, types) {
  if (!Array.isArray(documents)) return null;
  const normalizedTypes = types.map((type) => type.toLowerCase());

  return documents.find((document) => normalizedTypes.includes(String(document?.type || "").toLowerCase())) || null;
}

function getDocumentNumber(document, fallback = "") {
  return document?.documentNumber || document?.number || fallback || "Not added";
}

function formatBoolean(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not available";
}

function getApiFieldError(error, fieldName) {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors)) return "";

  return errors.find((item) => item?.field === fieldName)?.message || "";
}

function normalizeVendorKyc(item = {}) {
  const kyc = item.kyc || item;
  const user = item.user || item.vendorUser || item.vendor || {};
  const documents = Array.isArray(item.documents) ? item.documents : [];
  const panDocument = getDocumentByType(documents, ["PAN"]);
  const aadhaarDocument = getDocumentByType(documents, ["AADHAR", "AADHAAR"]);
  const gstDocument = getDocumentByType(documents, ["GSTIN", "GST"]);
  const cinDocument = getDocumentByType(documents, ["CIN"]);
  const vendorUserId = getValue(item, [
    "kyc.vendorUserId",
    "vendorUserId",
    "vendorUser.id",
    "vendorUser._id",
    "userId",
    "user.id",
    "user._id",
    "vendor.id",
    "vendor._id",
  ]);

  return {
    id: getValue(item, ["id", "_id", "kycId"], vendorUserId || JSON.stringify(item).slice(0, 32)),
    vendorUserId,
    userId: getValue(item, ["userId", "user.id", "vendorUserId"], vendorUserId),
    companyName: getValue(item, ["kyc.companyName", "kyc.businessName", "companyName", "businessName", "vendor.companyName"], "Not added"),
    businessName: kyc.businessName || kyc.companyName || "Not added",
    contactPerson: getValue(item, ["kyc.contactPerson", "contactPerson", "vendor.contactPerson", "user.name", "vendorUser.name"], "Not added"),
    email: getValue(item, ["email", "user.email", "vendorUser.email"], "Not added"),
    phone: getValue(item, ["phone", "mobile", "user.phone", "vendorUser.phone"], "Not added"),
    userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "Not added",
    userActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt || "",
    userCreatedAt: user.createdAt || "",
    status: getValue(item, ["status", "kycStatus"], "SUBMITTED"),
    city: getValue(item, ["kyc.primaryOperatingCity", "businessAddress.city", "city"], ""),
    state: getValue(item, ["kyc.addressState", "businessAddress.state", "state"], ""),
    businessAddress: getValue(item, ["businessAddress", "address"], {
      street: kyc.addressStreet,
      locality: kyc.addressLocality,
      state: kyc.addressState,
      pincode: kyc.addressPincode,
    }),
    logoName: getValue(item, ["kyc.logoName", "logoName", "logo.name", "logo.originalName"], ""),
    description: getValue(item, ["kyc.description", "description", "businessDescription", "about"], ""),
    whatsappNumber: kyc.whatsappNumber || "",
    primaryOperatingCity: kyc.primaryOperatingCity || "",
    panNumber: getDocumentNumber(panDocument, getValue(item, ["documents.pan.number", "pan.number", "panNumber"], "")),
    panDocument,
    aadhaarNumber: getDocumentNumber(aadhaarDocument, getValue(item, ["documents.aadhaar.number", "aadhaar.number", "aadhaarNumber"], "")),
    aadhaarDocument,
    gstNumber: getDocumentNumber(gstDocument, getValue(item, ["gst", "gstNumber", "documents.gst.number", "documents.gstin.number"], "")),
    gstDocument,
    cinNumber: getDocumentNumber(cinDocument, getValue(item, ["cin", "cinNumber", "documents.cin.number"], "")),
    cinDocument,
    documents,
    socialLinks: getValue(item, ["socialLinks", "social", "links"], {
      facebook: kyc.facebookUrl,
      instagram: kyc.instagramUrl,
    }),
    facebookUrl: kyc.facebookUrl || "",
    instagramUrl: kyc.instagramUrl || "",
    categories: getValue(item, ["kyc.serviceCategoryIds", "serviceCategories", "servicecategories", "servicecategoriesIds", "serviceCategoryIds"], []),
    services: getValue(item, ["kyc.serviceSubcategoryIds", "services", "serviceSubcategories", "servicesSubCategoryIds", "serviceSubcategoryIds"], []),
    source: getValue(item, ["kyc.source", "source", "referralSource"], []),
    sourceNote: getValue(item, ["kyc.sourceNote", "sourceNote", "referralNote"], ""),
    declaredDocumentStatus: kyc.declaredDocumentStatus || {},
    submittedAt: getValue(item, ["kyc.submittedAt", "submittedAt", "createdAt", "created_at", "updatedAt"], ""),
    reviewedAt: kyc.reviewedAt || "",
    reviewedByAdminId: kyc.reviewedByAdminId || "",
    rejectionReason: kyc.rejectionReason || "",
    createdAt: item.createdAt || kyc.createdAt || "",
    updatedAt: item.updatedAt || kyc.updatedAt || "",
    raw: item,
  };
}

function normalizeVendorKycResponse(responseData, fallbackPage, fallbackLimit) {
  const data = responseData?.data || responseData || {};
  const rawList = data.items || data.results || data.vendorKycs || data.kycs || data.content || data.data || [];
  const records = Array.isArray(rawList) ? rawList.map(normalizeVendorKyc) : [];
  const total = Number(data.total || data.totalCount || data.totalElements || data.count || records.length || 0);
  const page = Number(data.page || data.currentPage || fallbackPage);
  const limit = Number(data.limit || data.size || data.perPage || fallbackLimit);
  const totalPages = Number(data.totalPages || data.pages || Math.max(1, Math.ceil(total / limit)));

  return { records, total, page, limit, totalPages };
}

function DetailRow({ label, value, href = "" }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[170px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-950">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-[#b61f4b] hover:underline">
            View document
          </a>
        ) : (
          formatReadableValue(value)
        )}
      </dd>
    </div>
  );
}

function DetailGroup({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-slate-950">{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

function DocumentInfoRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
      <dt className="shrink-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate whitespace-nowrap text-right text-xs font-semibold text-slate-950">
        {formatReadableValue(value)}
      </dd>
    </div>
  );
}

function DocumentCard({ document, title }) {
  const documentUrl = getDocumentUrl(document);

  return (
    <article className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <div>
          <h4 className="text-sm font-bold text-slate-950">{title}</h4>
          <p className="mt-0.5 font-mono text-xs text-slate-600">{getDocumentNumber(document)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${document?.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {document?.isVerified ? "Verified" : "Pending"}
        </span>
      </div>
      {documentUrl ? (
        <a href={documentUrl} target="_blank" rel="noreferrer" className="block bg-slate-50 p-2">
          {/* Standard img keeps external KYC previews working without Next image domain config. */}
          <img
            src={documentUrl}
            alt={`${title} document`}
            className="h-24 w-full rounded border border-slate-200 bg-white object-contain"
          />
        </a>
      ) : (
        <div className="grid h-24 place-items-center bg-slate-50 px-3 text-center text-xs font-semibold text-slate-400">
          No image uploaded
        </div>
      )}
      <dl className="px-3 py-2.5">
        <DocumentInfoRow label="Type" value={document?.type || title} />
        <DocumentInfoRow label="Updated" value={formatDate(document?.updatedAt)} />
        <DocumentInfoRow label="Notes" value={document?.notes} />
      </dl>
    </article>
  );
}

export default function VendorKycList() {
  const actionMenuRef = useRef(null);
  const rowsDropdownRef = useRef(null);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [openActionId, setOpenActionId] = useState("");
  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [search, setSearch] = useState("");

  const visibleFrom = useMemo(() => (total ? (page - 1) * limit + 1 : 0), [limit, page, total]);
  const visibleTo = useMemo(() => Math.min(page * limit, total), [limit, page, total]);
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) =>
      [
        record.companyName,
        record.contactPerson,
        record.email,
        record.phone,
        record.panNumber,
        record.aadhaarNumber,
        record.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [records, search]);

  useEffect(() => {
    function closeActionMenu(event) {
      if (!actionMenuRef.current || actionMenuRef.current.contains(event.target)) return;
      setOpenActionId("");
    }

    if (openActionId) document.addEventListener("mousedown", closeActionMenu);
    return () => document.removeEventListener("mousedown", closeActionMenu);
  }, [openActionId]);

  useEffect(() => {
    function closeRowsDropdown(event) {
      if (!rowsDropdownRef.current || rowsDropdownRef.current.contains(event.target)) return;
      setRowsDropdownOpen(false);
    }

    if (rowsDropdownOpen) document.addEventListener("mousedown", closeRowsDropdown);
    return () => document.removeEventListener("mousedown", closeRowsDropdown);
  }, [rowsDropdownOpen]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadVendorKycs() {
      setIsLoading(true);
      try {
        const response = await MainApi.get("/admin/vendor-kyc", {
          params: { status: "SUBMITTED", page: page - 1, size: limit },
          signal: controller.signal,
        });
        const result = normalizeVendorKycResponse(response.data, page, limit);
        setRecords(result.records);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
        setFeedback({
          status: "error",
          title: "KYC list failed",
          text: getApiErrorMessage(error, "Unable to load vendor KYC records."),
          okLabel: "OK",
          onOk: () => setFeedback(null),
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadVendorKycs();

    return () => controller.abort();
  }, [limit, page]);

  function openRejectModal(record) {
    setRejectTarget(record);
    setRejectReason("");
    setRejectError("");
  }

  async function updateKycStatus(record, action, reason = "") {
    if (!record?.vendorUserId) {
      setFeedback({
        status: "error",
        title: "Missing vendor",
        text: "Vendor user id was not found for this KYC record.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
      return;
    }

    const nextReason = reason.trim();

    if (action === "reject" && !nextReason) {
      setRejectError("Rejection reason is required");
      return;
    }

    setIsUpdatingStatus(true);
    if (action === "approve") {
      setFeedback({
        status: "loading",
        title: "Approving KYC",
        text: "Please wait while the vendor KYC status is updated.",
      });
    }

    try {
      const payload = action === "reject" ? { reason: nextReason } : undefined;
      await MainApi.post(`/admin/vendor-kyc/${record.vendorUserId}/${action}`, payload);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setDetailRecord(null);
      setRejectTarget(null);
      setRejectReason("");
      setRejectError("");
      setTotal((current) => Math.max(0, current - 1));
      setFeedback({
        status: "success",
        title: action === "approve" ? "KYC approved" : "KYC rejected",
        text: action === "approve" ? "Vendor KYC approved successfully." : "Vendor KYC rejected successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      if (action === "reject") {
        const fieldError = getApiFieldError(error, "reason");
        setRejectError(fieldError || getApiErrorMessage(error, "Unable to reject KYC."));
        return;
      }

      setFeedback({
        status: "error",
        title: action === "approve" ? "Approve failed" : "Reject failed",
        text: getApiErrorMessage(error, "Unable to update KYC status."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <section className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-950">Vendor KYC List</h1>
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
            placeholder="Search vendor KYC"
            className="h-9 w-full rounded border border-slate-300 bg-white pl-10 pr-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b61f4b]"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900">
            <tr>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Company</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Contact Person</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Email</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">PAN</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Aadhaar</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right text-[13px] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                  Loading vendor KYC records...
                </td>
              </tr>
            ) : filteredRecords.length ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="bg-white transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-[#00194f]">
                    <p className="truncate">{record.companyName}</p>
                    <p className="mt-0.5 truncate text-xs font-normal text-slate-500">{[record.city, record.state].filter(Boolean).join(", ") || "Location not added"}</p>
                  </td>
                  <td className="truncate px-4 py-3 font-semibold text-slate-800">{record.contactPerson}</td>
                  <td className="truncate px-4 py-3 font-normal text-slate-800">{record.email}</td>
                  <td className="truncate px-4 py-3 font-mono text-xs text-slate-800">{record.panNumber}</td>
                  <td className="truncate px-4 py-3 font-mono text-xs text-slate-800">{record.aadhaarNumber}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{record.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div ref={openActionId === record.id ? actionMenuRef : null} className="relative flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenActionId((current) => current === record.id ? "" : record.id)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        aria-label={`Actions for ${record.companyName}`}
                      >
                        <span className="flex gap-[2px]">
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span className="h-1 w-1 rounded-full bg-current" />
                          <span className="h-1 w-1 rounded-full bg-current" />
                        </span>
                      </button>
                      {openActionId === record.id ? (
                        <div className="absolute right-0 top-7 z-20 w-44 rounded border border-slate-200 bg-white py-1.5 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionId("");
                              setDetailRecord(record);
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-[#b61f4b]"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                              <path d="M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
                            </svg>
                            View detail
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
                        <path d="M12 2 4 5v6c0 5.05 3.41 9.76 8 11 4.59-1.24 8-5.95 8-11V5l-8-3Zm0 3.2 5 1.88V11c0 3.8-2.07 7.25-5 8.83C9.07 18.25 7 14.8 7 11V7.08l5-1.88Zm2.78 4.38L11 13.36l-1.78-1.78-1.42 1.42L11 16.2 16.2 11l-1.42-1.42Z" />
                      </svg>
                    </span>
                    <span>{search ? "No matching vendor KYC records found." : "No submitted vendor KYC records found."}</span>
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

      {detailRecord ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-6">
          <section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Vendor KYC Details</h2>
                <p className="mt-1 text-sm text-slate-500">{detailRecord.companyName}</p>
              </div>
              <button type="button" onClick={() => setDetailRecord(null)} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close details">
                x
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 px-5 py-5">
              <div className="grid gap-5">
                <div className="rounded border border-slate-200 bg-white p-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">KYC status</p>
                      <p className="mt-1 text-sm font-black text-amber-700">{detailRecord.status}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Submitted</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{formatDate(detailRecord.submittedAt)}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">PAN</p>
                      <p className="mt-1 font-mono text-sm font-black text-slate-950">{detailRecord.panNumber}</p>
                    </div>
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Aadhaar</p>
                      <p className="mt-1 font-mono text-sm font-black text-slate-950">{detailRecord.aadhaarNumber}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-5">
                  <div className="grid gap-6 lg:grid-cols-2">
                  <DetailGroup title="Company And Contact">
                    <DetailRow label="Business name" value={detailRecord.businessName} />
                    <DetailRow label="Company name" value={detailRecord.companyName} />
                    <DetailRow label="Contact person" value={detailRecord.contactPerson} />
                    <DetailRow label="WhatsApp number" value={detailRecord.whatsappNumber} />
                    <DetailRow label="Email" value={detailRecord.email} />
                    <DetailRow label="Phone" value={detailRecord.phone} />
                    <DetailRow label="Submitted on" value={formatDate(detailRecord.submittedAt)} />
                  </DetailGroup>

                  <DetailGroup title="Address And Business">
                    <DetailRow label="Address" value={formatAddress(detailRecord.businessAddress, detailRecord.city, detailRecord.state)} />
                    <DetailRow label="Primary city" value={detailRecord.primaryOperatingCity} />
                    <DetailRow label="Description" value={detailRecord.description} />
                    <DetailRow label="Logo name" value={detailRecord.logoName} />
                  </DetailGroup>

                  <DetailGroup title="Social And Source">
                    <DetailRow label="Facebook" value={detailRecord.facebookUrl || detailRecord.socialLinks?.facebook} />
                    <DetailRow label="Instagram" value={detailRecord.instagramUrl || detailRecord.socialLinks?.instagram} />
                    <DetailRow label="Website" value={detailRecord.socialLinks?.website} />
                    <DetailRow label="Source" value={detailRecord.source} />
                    <DetailRow label="Source note" value={detailRecord.sourceNote} />
                  </DetailGroup>
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950">Documents</h3>
                      <p className="mt-1 text-xs font-medium text-slate-500">Document numbers, verification status, and uploaded images from the KYC API.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {detailRecord.documents.length} records
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <DocumentCard title="PAN" document={detailRecord.panDocument} />
                    <DocumentCard title="Aadhaar" document={detailRecord.aadhaarDocument} />
                    <DocumentCard title="GSTIN" document={detailRecord.gstDocument} />
                    <DocumentCard title="CIN" document={detailRecord.cinDocument} />
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-5">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <DetailGroup title="Review Details">
                      <DetailRow label="Reviewed on" value={formatDate(detailRecord.reviewedAt)} />
                      <DetailRow label="Rejection reason" value={detailRecord.rejectionReason} />
                    </DetailGroup>

                    <DetailGroup title="User Account">
                      <DetailRow label="User name" value={detailRecord.userName} />
                      <DetailRow label="User email" value={detailRecord.email} />
                      <DetailRow label="User phone" value={detailRecord.phone} />
                      <DetailRow label="User active" value={formatBoolean(detailRecord.userActive)} />
                      <DetailRow label="Email verified on" value={formatDate(detailRecord.emailVerifiedAt)} />
                      <DetailRow label="Account created on" value={formatDate(detailRecord.userCreatedAt)} />
                    </DetailGroup>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => openRejectModal(detailRecord)}
                className="rounded border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Reject KYC
              </button>
              <button
                type="button"
                onClick={() => updateKycStatus(detailRecord, "approve")}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Approve KYC
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 px-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateKycStatus(rejectTarget, "reject", rejectReason);
            }}
            className="w-full max-w-md rounded bg-white shadow-2xl"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Reject Vendor KYC</h2>
              <p className="mt-1 text-sm text-slate-500">{rejectTarget.companyName}</p>
            </div>
            <div className="px-5 py-5">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Rejection reason
                </span>
                <textarea
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    setRejectError("");
                  }}
                  rows={4}
                  className="resize-none rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b61f4b] focus:ring-2 focus:ring-rose-100"
                  placeholder="Please provide a clearer PAN document."
                  autoFocus
                />
              </label>
              {rejectError ? (
                <p className="mt-2 text-sm font-semibold text-red-600">{rejectError}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                  setRejectError("");
                }}
                disabled={isUpdatingStatus}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
              >
                {isUpdatingStatus ? "Rejecting..." : "Reject KYC"}
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
