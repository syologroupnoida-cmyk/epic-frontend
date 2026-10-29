import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Autocomplete, TextField } from "@mui/material";
import MainApi from "@/util/MainApi";
import { filterCities, loadAllCities } from "@/util/cities.mjs";
import { getApiErrorMessage } from "@/util/authApi";
import { getAuthUser, setAuthUser } from "@/util/authSession";

const serviceOptions = [
  "Wedding Venues",
  "Wedding Decor",
  "Photography",
  "Catering",
  "Bridal Makeup",
  "Wedding Planning",
  "Destination Weddings",
  "Invitations",
];

const categoryOptions = [
  "Venues",
  "Vendors",
  "Beauty",
  "Planning",
  "Travel",
];

const categoryServiceOptions = {
  Venues: [
    "Banquet Hall",
    "Wedding Hotel",
    "Resort",
    "Farmhouse",
    "Palace",
    "Beach Venue",
  ],
  Vendors: [
    "Wedding Decor",
    "Photography",
    "Videography",
    "Catering",
    "Wedding Music",
    "Invitations",
  ],
  Beauty: [
    "Bridal Makeup",
    "Groom Makeup",
    "Mehendi Artist",
    "Hair Styling",
    "Nail Artist",
  ],
  Planning: [
    "Wedding Planning",
    "Event Management",
    "Hospitality",
    "Guest Management",
    "Wedding Choreography",
  ],
  Travel: [
    "Destination Weddings",
    "Wedding Transportation",
    "Honeymoon Packages",
    "Guest Travel Desk",
  ],
};

function normalizeKycCategory(category = {}) {
  const id = category.id || category._id || category.serviceCategoryId || "";
  const rawSubcategories =
    category.subcategories ||
    category.subCategories ||
    category.serviceSubcategories ||
    category.serviceSubCategories ||
    category.services ||
    category.children ||
    [];

  return {
    id,
    name: category.name || category.title || "",
    services: Array.isArray(rawSubcategories)
      ? rawSubcategories
          .map((service, index) => ({
            id: typeof service === "string"
              ? `${id || category.name || "service"}-${index}`
              : service?.id || service?._id || service?.serviceSubcategoryId || service?.serviceSubCategoryId || "",
            name: typeof service === "string" ? service : service?.name || service?.title || "",
          }))
          .filter((service) => service.id && service.name)
      : [],
  };
}

function normalizeKycSubcategories(responseData) {
  const data = responseData?.data || responseData || {};
  const rawList = data.items || data.results || data.subcategories || data.subCategories || data.serviceSubcategories || data.data || [];

  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((service) => ({
      id: service?.id || service?._id || service?.serviceSubcategoryId || service?.serviceSubCategoryId || "",
      name: service?.name || service?.title || "",
    }))
    .filter((service) => service.id && service.name);
}

function normalizeKycCategories(responseData) {
  const data = responseData?.data || responseData || {};
  const rawList = data.items || data.results || data.categories || data.data || [];

  if (!Array.isArray(rawList)) return [];

  return rawList
    .map(normalizeKycCategory)
    .filter((category) => category.id && category.name);
}


function createFallbackCategories() {
  return categoryOptions.map((category) => ({
    id: category,
    name: category,
    services: (categoryServiceOptions[category] || []).map((service) => ({
      id: service,
      name: service,
    })),
  }));
}

const referralOptions = [
  "Google Search",
  "Social Media",
  "Existing Partner",
  "Epic Wedz Team",
  "Wedding Expo",
  "Other",
];

const steps = [
  { label: "Select Services", slug: "select-services" },
  { label: "Company Details", slug: "company-details" },
  { label: "Document Verification", slug: "document-verification" },
  { label: "Additional Details", slug: "additional-details" },
  { label: "Review & Submit", slug: "review-submit" },
];

const sideCopy = [
  {
    title: "Choose the services you offer",
    text: "Select the wedding categories your team wants to receive qualified inquiries for.",
  },
  {
    title: "Build your partner profile",
    text: "Add company, location, description, and social links for a complete listing.",
  },
  {
    title: "Verify business documents",
    text: "Confirm Aadhaar, PAN, GST, and CIN details before the partner review.",
  },
  {
    title: "Tell us how you found us",
    text: "Help our team understand the source of your onboarding request.",
  },
  {
    title: "Review and submit",
    text: "Check every detail once before sending your KYC for partner approval.",
  },
];

const emptyDocumentUpload = {
  fileName: "",
  preview: "",
  url: "",
  publicId: "",
};

function pickUploadData(responseData) {
  const data = responseData?.data || responseData || {};
  const imageData = data.cloudinary || data.image || data.file || data.upload || data;

  return {
    url: imageData.secure_url || imageData.secureUrl || imageData.url || data.url || "",
    publicId: imageData.public_id || imageData.publicId || data.public_id || data.publicId || "",
  };
}

function getKycDocument(documents, types) {
  if (!Array.isArray(documents)) return null;
  const normalizedTypes = types.map((type) => type.toLowerCase());

  return documents.find((document) => normalizedTypes.includes(String(document?.type || "").toLowerCase())) || null;
}

function getDocumentUpload(document, fallbackName) {
  if (!document?.documentUrl && !document?.url) return emptyDocumentUpload;

  return {
    fileName: fallbackName,
    preview: document.documentUrl || document.url || "",
    url: document.documentUrl || document.url || "",
    publicId: document.documentPublicId || document.publicId || "",
  };
}

function isMaskedAadhaarNumber(value = "") {
  return /^X{4,}\d{4}$/.test(String(value).trim().toUpperCase());
}

function normalizeExistingKycResponse(responseData) {
  const data = responseData?.data || responseData || {};
  const record = data.item || data;
  const kyc = data.kyc || record.kyc || record;
  const documents = data.documents || record.documents || [];
  const registration = data.registration || record.registration || {};
  const user = data.user || record.user || {};
  const approval = data.approval || record.approval || {};
  const panDocument = getKycDocument(documents, ["PAN"]);
  const aadhaarDocument = getKycDocument(documents, ["AADHAR", "AADHAAR"]);
  const gstDocument = getKycDocument(documents, ["GSTIN", "GST"]);
  const cinDocument = getKycDocument(documents, ["CIN"]);
  const contactPersonName = registration.contactPersonName || user.name || [user.firstName, user.lastName].filter(Boolean).join(" ");
  const aadhaarNumber = aadhaarDocument?.documentNumber || kyc.aadhaarNumber || "";
  const hasMaskedAadhaarNumber = isMaskedAadhaarNumber(aadhaarNumber);

  return {
    form: {
      categories: kyc.serviceCategoryIds || kyc.servicecategoriesIds || kyc.serviceCategoriesIds || [],
      services: kyc.serviceSubcategoryIds || kyc.servicesSubCategoryIds || kyc.serviceSubcategoriesIds || [],
      companyName: kyc.companyName || kyc.businessName || "",
      contactPerson: kyc.contactPerson || contactPersonName || "",
      email: registration.email || user.email || kyc.email || "",
      phone: registration.mobileNumber || user.phone || kyc.phone || "",
      country: kyc.addressCountry || kyc.businessAddress?.country || "",
      countryCode: kyc.addressCountryCode || kyc.businessAddress?.countryCode || kyc.primaryCity?.countryCode || "",
      state: kyc.addressState || "",
      city: kyc.addressCity || kyc.businessAddress?.city || kyc.addressLocality || "",
      primaryCityId: kyc.primaryCityId || kyc.primaryCity?.id || "",
      primaryCityName: kyc.primaryCity?.name || kyc.primaryOperatingCity || "",
      description: kyc.description || "",
      facebook: kyc.facebookUrl || kyc.socialLinks?.facebook || "",
      instagram: kyc.instagramUrl || kyc.socialLinks?.instagram || "",
      street: kyc.addressStreet || kyc.businessAddress?.street || "",
      locality: kyc.addressLocality || kyc.businessAddress?.locality || "",
      pincode: kyc.addressPincode || kyc.businessAddress?.pincode || "",
      aadhaar: hasMaskedAadhaarNumber ? "" : aadhaarNumber,
      pan: panDocument?.documentNumber || kyc.panNumber || "",
      cin: cinDocument?.documentNumber || kyc.cinNumber || "",
      gst: gstDocument?.documentNumber || kyc.gstNumber || "",
      source: Array.isArray(kyc.source) ? kyc.source : [],
      sourceNote: kyc.sourceNote || "",
    },
    uploads: {
      aadhaar: getDocumentUpload(aadhaarDocument, "Aadhaar image"),
      pan: getDocumentUpload(panDocument, "PAN image"),
    },
    verified: {
      aadhaar: Boolean(aadhaarDocument?.isVerified) && !hasMaskedAadhaarNumber,
      pan: Boolean(panDocument?.isVerified),
      cin: Boolean(cinDocument?.isVerified),
      gst: Boolean(gstDocument?.isVerified),
    },
    status: data.kycStatus || kyc.kycStatus || approval.status || "",
    rejectionReason: kyc.rejectionReason || approval.message || "",
    existingAadhaarNumber: hasMaskedAadhaarNumber ? aadhaarNumber : "",
  };
}

function isDocumentValueReady(name, value = "") {
  const trimmedValue = value.trim();
  const patterns = {
    aadhaar: /^\d{12}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    cin: /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  };

  return patterns[name]?.test(trimmedValue) || false;
}

function getDocumentValidationMessage(name, label) {
  const messages = {
    aadhaar: "Enter a valid 12 digit Aadhaar number",
    pan: "Enter a valid PAN number, like ABCDE1234F",
    gst: "Enter a valid 15 character GSTIN",
    cin: "Enter a valid 21 character CIN",
  };

  return messages[name] || `Enter ${label} number`;
}

export default function KycForm() {
  const router = useRouter();
  const serviceSelectRef = useRef(null);
  const documentPreviewUrlsRef = useRef(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExistingKyc, setIsLoadingExistingKyc] = useState(false);
  const [isResubmission, setIsResubmission] = useState(false);
  const [resubmissionReason, setResubmissionReason] = useState("");
  const [existingAadhaarNumber, setExistingAadhaarNumber] = useState("");
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [cityRecords, setCityRecords] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [categoryServicesById, setCategoryServicesById] = useState({});
  const [isLoadingCategoryServices, setIsLoadingCategoryServices] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [documentUploads, setDocumentUploads] = useState({
    aadhaar: emptyDocumentUpload,
    pan: emptyDocumentUpload,
  });
  const [documentUploadStatus, setDocumentUploadStatus] = useState({
    aadhaar: "idle",
    pan: "idle",
  });
  const [documentErrors, setDocumentErrors] = useState({});
  const [verified, setVerified] = useState({
    aadhaar: false,
    pan: false,
    cin: false,
    gst: false,
  });
  const [form, setForm] = useState({
    categories: [],
    services: [],
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    country: "",
    countryCode: "",
    state: "",
    city: "",
    primaryCityId: "",
    primaryCityName: "",
    description: "",
    facebook: "",
    instagram: "",
    street: "",
    locality: "",
    pincode: "",
    aadhaar: "",
    pan: "",
    cin: "",
    gst: "",
    source: [],
    sourceNote: "",
  });
  const step = useMemo(() => {
    if (!router.isReady) return 0;

    const stepIndex = steps.findIndex((item) => item.slug === router.query.steps);
    return stepIndex >= 0 ? stepIndex : 0;
  }, [router.isReady, router.query.steps]);
  const currentCopy = sideCopy[step];
  const availableCategories = categoryRecords.length ? categoryRecords : createFallbackCategories();
  const activeCategory = availableCategories.find((category) => category.id === activeCategoryId);
  const activeServiceOptions = activeCategoryId
    ? categoryServicesById[activeCategoryId] || activeCategory?.services || []
    : [];
  const allKnownServices = availableCategories
    .flatMap((category) => categoryServicesById[category.id] || category.services || [])
    .filter((service, index, list) => list.findIndex((item) => item.id === service.id) === index);
  const selectedPrimaryCity = cityRecords.find((city) =>
    city.id === form.primaryCityId || (
      form.primaryCityName && city.name.toLowerCase() === form.primaryCityName.toLowerCase()
    )
  );
  const selectedPrimaryCityId = selectedPrimaryCity?.id || form.primaryCityId;

  function getCategoryName(categoryId) {
    return availableCategories.find((category) => category.id === categoryId)?.name || categoryId;
  }

  function getServiceName(serviceId) {
    return allKnownServices.find((service) => service.id === serviceId)?.name || serviceId;
  }

  function getServicesForCategories(categoryIds) {
    return availableCategories
      .filter((item) => categoryIds.includes(item.id))
      .flatMap((item) => categoryServicesById[item.id] || item.services || []);
  }

  useEffect(() => {
    const previewUrls = documentPreviewUrlsRef.current;

    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await MainApi.get("/service-categories");
        if (!isMounted) return;
        const nextCategories = normalizeKycCategories(response.data);
        setCategoryRecords(nextCategories);
      } catch {
        if (isMounted) setCategoryRecords([]);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      setIsLoadingCities(true);
      try {
        const cities = await loadAllCities((...args) => MainApi.get(...args), { signal: controller.signal });
        if (!controller.signal.aborted) setCityRecords(cities);
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
        setVerifyModal({
          status: "error",
          title: "Cities Failed",
          text: getApiErrorMessage(error, "Unable to load cities."),
        });
      } finally {
        if (!controller.signal.aborted) setIsLoadingCities(false);
      }
    }

    loadCities();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    const nextStep = String(user?.vendorProfile?.nextStep || "").toUpperCase();
    const kycStatus = String(user?.vendorProfile?.kycStatus || "").toUpperCase();
    const shouldLoadExistingKyc = user?.role === "VENDOR" && (nextStep === "RESUBMIT_KYC" || kycStatus === "REJECTED");

    if (!shouldLoadExistingKyc) return undefined;

    let isMounted = true;

    async function loadExistingKyc() {
      setIsLoadingExistingKyc(true);
      setIsResubmission(true);

      try {
        const response = await MainApi.get("/vendor/kyc");
        if (!isMounted) return;

        const existingKyc = normalizeExistingKycResponse(response.data);
        setForm((current) => ({ ...current, ...existingKyc.form }));
        setVerified((current) => ({ ...current, ...existingKyc.verified }));
        setDocumentUploads((current) => ({
          ...current,
          ...existingKyc.uploads,
        }));
        setDocumentUploadStatus((current) => ({
          ...current,
          aadhaar: existingKyc.uploads.aadhaar.url ? "uploaded" : current.aadhaar,
          pan: existingKyc.uploads.pan.url ? "uploaded" : current.pan,
        }));
        setResubmissionReason(existingKyc.rejectionReason || "");
        setExistingAadhaarNumber(existingKyc.existingAadhaarNumber || "");
        setActiveCategoryId(existingKyc.form.categories[0] || "");
      } catch (error) {
        if (!isMounted) return;
        setVerifyModal({
          status: "error",
          title: "KYC Details Failed",
          text: getApiErrorMessage(error, "Unable to load your existing KYC details."),
        });
      } finally {
        if (isMounted) setIsLoadingExistingKyc(false);
      }
    }

    loadExistingKyc();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCategoryId || categoryServicesById[activeCategoryId]) return undefined;

    let isMounted = true;

    async function loadCategoryServices() {
      setIsLoadingCategoryServices(true);
      try {
        const response = await MainApi.get("/service-subcategories", {
          params: { serviceCategoryId: activeCategoryId },
        });
        if (!isMounted) return;
        const nextServices = normalizeKycSubcategories(response.data);

        setCategoryServicesById((current) => ({ ...current, [activeCategoryId]: nextServices }));
        setCategoryRecords((current) =>
          current.map((category) =>
            category.id === activeCategoryId
              ? { ...category, services: nextServices }
              : category
          )
        );
      } catch (error) {
        if (!isMounted) return;
        setVerifyModal({
          status: "error",
          title: "Services Failed",
          text: getApiErrorMessage(error, "Unable to load category services."),
        });
      } finally {
        if (isMounted) setIsLoadingCategoryServices(false);
      }
    }

    loadCategoryServices();

    return () => {
      isMounted = false;
    };
  }, [activeCategoryId, categoryServicesById]);

  useEffect(() => {
    const missingCategoryIds = form.categories.filter((categoryId) => categoryId && !categoryServicesById[categoryId]);
    if (!missingCategoryIds.length) return undefined;

    let isMounted = true;

    async function loadSelectedCategoryServices() {
      try {
        const results = await Promise.all(
          missingCategoryIds.map(async (categoryId) => {
            const response = await MainApi.get("/service-subcategories", {
              params: { serviceCategoryId: categoryId },
            });

            return [categoryId, normalizeKycSubcategories(response.data)];
          }),
        );

        if (!isMounted) return;

        const servicesByCategory = Object.fromEntries(results);
        setCategoryServicesById((current) => ({ ...current, ...servicesByCategory }));
        setCategoryRecords((current) =>
          current.map((category) =>
            servicesByCategory[category.id]
              ? { ...category, services: servicesByCategory[category.id] }
              : category
          )
        );
      } catch {
        // Service labels can safely fall back to IDs if the lookup is unavailable.
      }
    }

    loadSelectedCategoryServices();

    return () => {
      isMounted = false;
    };
  }, [categoryServicesById, form.categories]);

  useEffect(() => {
    if (!verifyModal) return undefined;
    if (verifyModal.status !== "success") return undefined;

    const timeoutId = window.setTimeout(() => setVerifyModal(null), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [verifyModal]);

  useEffect(() => {
    if (!showSuccessModal) return undefined;

    const timeoutId = window.setTimeout(() => {
      router.replace("/partner/login");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [router, showSuccessModal]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!serviceSelectRef.current?.contains(event.target)) {
        setCategoryDropdownOpen(false);
        setServiceDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePrimaryCity(city) {
    setForm((current) => ({
      ...current,
      primaryCityId: city?.id || "",
      primaryCityName: city?.name || "",
      city: current.city || city?.name || "",
      state: current.state || city?.stateName || "",
      countryCode: city?.countryCode || current.countryCode,
    }));
  }

  function updateDocumentField(event) {
    const { name, value } = event.target;
    const nextValue = name === "aadhaar" ? value.replace(/\D/g, "").slice(0, 12) : value.toUpperCase();

    setDocumentErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({ ...current, [name]: nextValue }));
  }

  function goToStep(nextStep) {
    const boundedStep = Math.max(0, Math.min(nextStep, steps.length - 1));

    router.replace(
      {
        pathname: "/kyc",
        query: { steps: steps[boundedStep].slug },
      },
      undefined,
      { shallow: true },
    );
  }

  async function handleDocumentImageChange(event, type) {
    const file = event.target.files?.[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);
    const uploadMeta = type === "pan"
      ? { purpose: "kyc-pan", name: "pan-card" }
      : { purpose: "kyc-aadhaar", name: "aaddhar-card" };
    const formData = new FormData();

    formData.append("file", file);
    formData.append("purpose", uploadMeta.purpose);
    formData.append("name", uploadMeta.name);
    documentPreviewUrlsRef.current.add(preview);

    setDocumentErrors((current) => ({ ...current, [`${type}Image`]: "" }));
    setDocumentUploadStatus((current) => ({ ...current, [type]: "uploading" }));
    setDocumentUploads((current) => {
      if (current[type].preview) {
        URL.revokeObjectURL(current[type].preview);
        documentPreviewUrlsRef.current.delete(current[type].preview);
      }

      return {
        ...current,
        [type]: {
          ...emptyDocumentUpload,
          fileName: file.name,
          preview,
        },
      };
    });

    try {
      const response = await MainApi.post("/uploads/image", formData);
      const uploadData = pickUploadData(response.data);

      if (!uploadData.url || !uploadData.publicId) {
        throw new Error("Upload response did not include image URL or public ID.");
      }

      setDocumentUploads((current) => ({
        ...current,
        [type]: {
          ...current[type],
          url: uploadData.url,
          publicId: uploadData.publicId,
        },
      }));
      setDocumentUploadStatus((current) => ({ ...current, [type]: "uploaded" }));
    } catch (error) {
      setDocumentUploadStatus((current) => ({ ...current, [type]: "idle" }));
      setDocumentErrors((current) => ({
        ...current,
        [`${type}Image`]: getApiErrorMessage(error, `Unable to upload ${type === "pan" ? "PAN" : "Aadhaar"} image.`),
      }));
    } finally {
      event.target.value = "";
    }
  }

  function removeDocumentImage(type) {
    setDocumentUploads((current) => {
      if (current[type].preview) {
        URL.revokeObjectURL(current[type].preview);
        documentPreviewUrlsRef.current.delete(current[type].preview);
      }

      return {
        ...current,
        [type]: emptyDocumentUpload,
      };
    });
    setDocumentUploadStatus((current) => ({ ...current, [type]: "idle" }));
    setDocumentErrors((current) => ({ ...current, [`${type}Image`]: "" }));
  }

  function toggleService(serviceId) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(serviceId)
        ? current.services.filter((item) => item !== serviceId)
        : [...current.services, serviceId],
    }));
  }

  function removeService(serviceId) {
    setForm((current) => ({
      ...current,
      services: current.services.filter((item) => item !== serviceId),
    }));
  }

  function selectCategory(categoryId) {
    setActiveCategoryId(categoryId);
    setCategoryDropdownOpen(false);
    setServiceDropdownOpen(false);
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(categoryId)
        ? current.categories
        : [...current.categories, categoryId],
    }));
  }

  function removeCategory(categoryId) {
    setForm((current) => {
      const nextCategories = current.categories.filter((item) => item !== categoryId);
      const nextServices = new Set(getServicesForCategories(nextCategories).map((service) => service.id));

      return {
        ...current,
        categories: nextCategories,
        services: nextCategories.length ? current.services.filter((service) => nextServices.has(service)) : [],
      };
    });

    if (activeCategoryId === categoryId) {
      setActiveCategoryId("");
      setServiceDropdownOpen(false);
    }
  }

  function toggleReferral(source) {
    setForm((current) => ({
      ...current,
      source: current.source.includes(source)
        ? current.source.filter((item) => item !== source)
        : [...current.source, source],
    }));
  }

  async function verifyDocument(name, label) {
    const value = form[name].trim();
    const documentEndpoints = {
      aadhaar: "/vendor/kyc/validate/aadhaar",
      pan: "/vendor/kyc/validate/pan",
      cin: "/vendor/kyc/validate/cin",
      gst: "/vendor/kyc/validate/gstin",
    };

    if (!isDocumentValueReady(name, value)) {
      setDocumentErrors((current) => ({ ...current, [name]: getDocumentValidationMessage(name, label) }));
      return;
    }

    setVerifyModal({
      status: "loading",
      title: "Verifying...",
      text: `Verifying ${label} details.`,
    });

    try {
      await MainApi.post(documentEndpoints[name], { number: value });
      setVerified((current) => ({ ...current, [name]: true }));
      setVerifyModal({
        status: "success",
        title: "Verified!",
        text: `${label} details verified successfully.`,
      });
    } catch (error) {
      setVerifyModal({
        status: "error",
        title: "Verification Failed",
        text: getApiErrorMessage(error, `Unable to verify ${label} details.`),
      });
    }
  }

  function createKycPayload() {
    const primaryCity = cityRecords.find((city) => city.id === selectedPrimaryCityId);
    const documents = {
      pan: {
        number: form.pan,
        url: documentUploads.pan.url,
        publicId: documentUploads.pan.publicId,
      },
    };

    if (form.aadhaar.trim()) {
      documents.aadhaar = {
        number: form.aadhaar.trim(),
        url: documentUploads.aadhaar.url,
        publicId: documentUploads.aadhaar.publicId,
      };
    }

    return {
      servicecategoriesIds: form.categories,
      servicesSubCategoryIds: form.services,
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      primaryCityId: selectedPrimaryCityId,
      businessAddress: {
        street: form.street,
        locality: form.locality || form.city,
        state: form.state,
        city: form.city.trim() || primaryCity?.name || form.primaryCityName,
        countryCode: form.countryCode || primaryCity?.countryCode || "",
        pincode: form.pincode,
      },
      description: form.description,
      socialLinks: {
        facebook: form.facebook,
        instagram: form.instagram,
      },
      documents,
      source: form.source,
      sourceNote: form.sourceNote,
    };
  }

  function validateCompanyDetails() {
    const primaryCity = cityRecords.find((city) => city.id === selectedPrimaryCityId);
    const businessCity = form.city.trim() || primaryCity?.name || form.primaryCityName;
    const countryCode = form.countryCode || primaryCity?.countryCode || "";

    if (!selectedPrimaryCityId || !businessCity || !countryCode) {
      setVerifyModal({
        status: "error",
        title: "Company Details Required",
        text: !selectedPrimaryCityId
          ? "Please select a primary city."
          : !businessCity
            ? "Please add the business address city."
            : "Please select a primary city with a valid country code.",
      });
      return false;
    }

    return true;
  }

  function validateDocumentUploads() {
    const nextErrors = {};
    const aadhaarValue = form.aadhaar.trim();

    if (!aadhaarValue && !existingAadhaarNumber) {
      nextErrors.aadhaar = "Enter Aadhaar number";
    } else if (aadhaarValue && !isDocumentValueReady("aadhaar", aadhaarValue)) {
      nextErrors.aadhaar = getDocumentValidationMessage("aadhaar", "Aadhaar");
    }

    if (!isDocumentValueReady("pan", form.pan)) {
      nextErrors.pan = getDocumentValidationMessage("pan", "PAN");
    }

    setDocumentErrors((current) => ({
      ...current,
      aadhaar: nextErrors.aadhaar || "",
      pan: nextErrors.pan || "",
    }));
    return !Object.keys(nextErrors).length;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateCompanyDetails()) return;

    if (!validateDocumentUploads()) {
      setVerifyModal({
        status: "error",
        title: "Documents Required",
        text: "Please add valid Aadhaar and PAN numbers before submitting KYC.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await MainApi.post("/vendor/kyc", createKycPayload());
      const user = getAuthUser();

      if (user?.role === "VENDOR") {
        setAuthUser({
          ...user,
          vendorProfile: {
            ...(user.vendorProfile || {}),
            kycStatus: "AWAITING",
            nextStep: "AWAITING_APPROVAL",
          },
        });
      }

      setShowSuccessModal(true);
    } catch (error) {
      setVerifyModal({
        status: "error",
        title: "Submit Failed",
        text: getApiErrorMessage(error, "Unable to submit KYC right now."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNextStep() {
    if (step === 1 && !validateCompanyDetails()) return;

    if (step === 2 && !validateDocumentUploads()) {
      setVerifyModal({
        status: "error",
        title: "Documents Required",
        text: "Please add valid Aadhaar and PAN numbers before continuing.",
      });
      return;
    }

    goToStep(step + 1);
  }

  return (
    <div className="kyc-page min-h-screen bg-white text-stone-900">
      <main className="kyc-shell">
        <aside className="kyc-side-panel">
          <div className="kyc-image-slider" aria-hidden="true">
            <span className="kyc-slide kyc-slide-one" />
            <span className="kyc-slide kyc-slide-two" />
            <span className="kyc-slide kyc-slide-three" />
          </div>
          <Link href="/partner/login" className="kyc-brand-mark">
            <Image
              src="/images/epic-logo-new.png"
              alt="Epic Wedz"
              width={156}
              height={55}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
          <div className="kyc-side-copy">
            <h2>{currentCopy.title}</h2>
            <p>{currentCopy.text}</p>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="kyc-form-panel">
          <div className="kyc-form-head">
            <h1>{isResubmission ? "Resubmit KYC" : "KYC Verification"}</h1>
            <p>
              {isLoadingExistingKyc
                ? "Loading your existing KYC details..."
                : isResubmission
                  ? "Update the rejected details and resubmit your KYC for review"
                  : "Complete your KYC verification process"}
            </p>
            {isResubmission && resubmissionReason ? (
              <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-700">
                Rejection reason: {resubmissionReason}
              </div>
            ) : null}
          </div>

          <div className="kyc-horizontal-stepper">
            {steps.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => goToStep(index)}
                className={`kyc-step-node ${step === index ? "is-active" : ""} ${step > index ? "is-complete" : ""}`}
              >
                <span>{step > index ? "✓" : index + 1}</span>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>

          <div className="kyc-step-content">
            {step === 0 ? (
              <section>
                <div className="kyc-category-row" ref={serviceSelectRef}>
                  <div className="kyc-select-field">
                    <span>Categories</span>
                    <button
                      type="button"
                      className="kyc-multi-select-button"
                      onClick={() => {
                        setCategoryDropdownOpen((open) => !open);
                        setServiceDropdownOpen(false);
                      }}
                    >
                      <span>{activeCategory ? activeCategory.name : "Select category"}</span>
                      <i className="header-chevron" aria-hidden="true" />
                    </button>
                    {categoryDropdownOpen ? (
                      <div className="kyc-multi-select-menu">
                        {availableCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            className={`kyc-select-option ${activeCategoryId === category.id ? "is-selected" : ""}`}
                            onClick={() => selectCategory(category.id)}
                          >
                            <span>{category.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="kyc-multi-select">
                    <span className="kyc-multi-label">Category services</span>
                    <button
                      type="button"
                      disabled={!activeCategoryId}
                      onClick={() => {
                        setServiceDropdownOpen((open) => !open);
                        setCategoryDropdownOpen(false);
                      }}
                      className="kyc-multi-select-button"
                    >
                      <span>
                        {activeCategoryId
                          ? isLoadingCategoryServices
                            ? "Loading services..."
                            : activeServiceOptions.length
                              ? "Select services"
                              : "No services found"
                          : "Select category first"}
                      </span>
                      <i className="header-chevron" aria-hidden="true" />
                    </button>
                    {serviceDropdownOpen ? (
                      <div className="kyc-multi-select-menu">
                        {activeServiceOptions.map((service) => (
                          <label key={service.id} className="kyc-multi-option">
                            <input
                              type="checkbox"
                              checked={form.services.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                            />
                            <span>{service.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {form.categories.length ? (
                  <div className="kyc-service-chips">
                    {form.categories.map((categoryId) => (
                      <span key={categoryId} className="kyc-service-chip">
                        {getCategoryName(categoryId)}
                        <button type="button" onClick={() => removeCategory(categoryId)} aria-label={`Remove ${getCategoryName(categoryId)}`}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                {form.services.length ? (
                  <div className="kyc-service-chips">
                    {form.services.map((serviceId) => (
                      <span key={serviceId} className="kyc-service-chip">
                        {getServiceName(serviceId)}
                        <button type="button" onClick={() => removeService(serviceId)} aria-label={`Remove ${getServiceName(serviceId)}`}>
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="kyc-service-hint">
                  Select a category, choose its services, then select another category to add more services.
                </div>
              </section>
            ) : null}

            {step === 1 ? (
              <section>
                <div className="kyc-company-grid mt-5">
                  <label className="mui-field"><input name="companyName" value={form.companyName} onChange={updateField} placeholder=" " /><span>Company name</span></label>
                  <label className="mui-field"><input name="contactPerson" value={form.contactPerson} onChange={updateField} placeholder=" " /><span>Contact person</span></label>
                  <label className="mui-field"><input name="email" value={form.email} onChange={updateField} placeholder=" " /><span>Email address</span></label>
                  <label className="mui-field"><input name="phone" value={form.phone} onChange={updateField} placeholder=" " /><span>Phone number</span></label>
                  <label className="mui-field"><input name="street" value={form.street} onChange={updateField} placeholder=" " /><span>Street address</span></label>
                  <label className="mui-field"><input name="locality" value={form.locality} onChange={updateField} placeholder=" " /><span>Locality</span></label>
                  <KycLocationInput label="Country" name="country" type="country" value={form.country} onSelect={(value) => setForm((current) => ({ ...current, country: value }))} />
                  <KycLocationInput label="State" name="state" type="state" value={form.state} onSelect={(value) => setForm((current) => ({ ...current, state: value }))} />
                  <KycLocationInput label="City" name="city" type="city" value={form.city} cities={cityRecords} onSelect={(value) => setForm((current) => ({ ...current, city: value }))} />
                  <Autocomplete
                    options={cityRecords}
                    value={selectedPrimaryCity || (form.primaryCityName ? { id: form.primaryCityId, name: form.primaryCityName } : null)}
                    getOptionLabel={(city) => [city.name, city.stateName].filter(Boolean).join(", ")}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, city) => updatePrimaryCity(city)}
                    loading={isLoadingCities}
                    disabled={isLoadingCities || isSubmitting}
                    loadingText="Loading cities..."
                    noOptionsText="No cities found"
                    renderInput={(params) => <TextField {...params} name="primaryCityId" label="Primary city" placeholder="Select primary city" size="small" />}
                    sx={{ mb: '10px', '& .MuiOutlinedInput-root': { minHeight: 38, borderRadius: '4px', fontSize: 13, cursor: 'pointer' }, '& .MuiAutocomplete-input': { cursor: 'pointer' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#f2c9d4' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#b61f4b' }, '& .MuiInputLabel-root': { fontSize: 13 }, '& .MuiInputLabel-root.Mui-focused': { color: '#b61f4b' } }}
                  />
                  <label className="mui-field"><input name="pincode" value={form.pincode} onChange={updateField} placeholder=" " /><span>Pincode</span></label>
                  <label className="mui-field"><input name="facebook" value={form.facebook} onChange={updateField} placeholder=" " /><span>Facebook link</span></label>
                  <label className="mui-field"><input name="instagram" value={form.instagram} onChange={updateField} placeholder=" " /><span>Instagram link</span></label>
                  <label className="mui-field sm:col-span-2"><input name="description" value={form.description} onChange={updateField} placeholder=" " /><span>Description</span></label>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section>
                <div className="kyc-document-grid mt-5">
                  <KycVerifyField
                    label="Aadhaar number"
                    name="aadhaar"
                    value={form.aadhaar}
                    verified={verified.aadhaar}
                    ready={isDocumentValueReady("aadhaar", form.aadhaar)}
                    error={documentErrors.aadhaar}
                    helperText={existingAadhaarNumber ? `Your existing Aadhaar number is ${existingAadhaarNumber}. If you want to change it, enter a new number above.` : ""}
                    onChange={updateDocumentField}
                    onVerify={() => verifyDocument("aadhaar", "Aadhaar")}
                    className="kyc-verify-row-with-upload"
                    afterInput={(
                    <KycImageUploadField
                      label="Aadhaar image"
                      status={documentUploadStatus.aadhaar}
                      upload={documentUploads.aadhaar}
                      error={documentErrors.aadhaarImage}
                      onChange={(event) => handleDocumentImageChange(event, "aadhaar")}
                      onRemove={() => removeDocumentImage("aadhaar")}
                    />
                    )}
                  />
                  <KycVerifyField
                    label="PAN number"
                    name="pan"
                    value={form.pan}
                    verified={verified.pan}
                    ready={isDocumentValueReady("pan", form.pan)}
                    error={documentErrors.pan}
                    onChange={updateDocumentField}
                    onVerify={() => verifyDocument("pan", "PAN")}
                    className="kyc-verify-row-with-upload"
                    afterInput={(
                    <KycImageUploadField
                      label="PAN image"
                      status={documentUploadStatus.pan}
                      upload={documentUploads.pan}
                      error={documentErrors.panImage}
                      onChange={(event) => handleDocumentImageChange(event, "pan")}
                      onRemove={() => removeDocumentImage("pan")}
                    />
                    )}
                  />
                  <KycVerifyField label="GST number" name="gst" value={form.gst} verified={verified.gst} ready={isDocumentValueReady("gst", form.gst)} error={documentErrors.gst} onChange={updateDocumentField} onVerify={() => verifyDocument("gst", "GST")} />
                  <KycVerifyField label="CIN" name="cin" value={form.cin} verified={verified.cin} ready={isDocumentValueReady("cin", form.cin)} error={documentErrors.cin} onChange={updateDocumentField} onVerify={() => verifyDocument("cin", "CIN")} />
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section>
                <div className="kyc-service-grid kyc-source-grid">
                  {referralOptions.map((source) => (
                    <label key={source} className="kyc-checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.source.includes(source)}
                        onChange={() => toggleReferral(source)}
                      />
                      <span>{source}</span>
                    </label>
                  ))}
                </div>
                <label className="mui-field mt-5"><input name="sourceNote" value={form.sourceNote} onChange={updateField} placeholder=" " /><span>Additional note</span></label>
              </section>
            ) : null}

            {step === 4 ? (
              <section>
                <div className="kyc-review-card">
                  <ReviewGroup
                    title="Services"
                    items={[
                      ["Categories", form.categories.map(getCategoryName).join(", ") || "Not selected"],
                      ["Selected services", form.services.map(getServiceName).join(", ") || "Not selected"],
                    ]}
                  />
                  <ReviewGroup
                    title="Company Details"
                    items={[
                      ["Company", form.companyName || "Not added"],
                      ["Contact", form.contactPerson || "Not added"],
                      ["Email", form.email || "Not added"],
                      ["Phone", form.phone || "Not added"],
                      ["Street", form.street || "Not added"],
                      ["Locality", form.locality || "Not added"],
                      ["Country", form.country || "Not added"],
                      ["State", form.state || "Not added"],
                      ["City", form.city || "Not added"],
                      ["Primary city", selectedPrimaryCity?.name || form.primaryCityName || "Not added"],
                      ["Pincode", form.pincode || "Not added"],
                      ["Facebook", form.facebook || "Not added"],
                      ["Instagram", form.instagram || "Not added"],
                      ["Description", form.description || "Not added"],
                    ]}
                  />
                  <ReviewGroup
                    title="Document Verification"
                    items={[
                      ["Aadhaar", form.aadhaar || existingAadhaarNumber || "Not added"],
                      ["Aadhaar image", documentUploads.aadhaar.fileName || "Not uploaded"],
                      ["PAN", form.pan || "Not added"],
                      ["PAN image", documentUploads.pan.fileName || "Not uploaded"],
                      ["GST", form.gst || "Not added"],
                      ["CIN", form.cin || "Not added"],
                    ]}
                  />
                  <ReviewGroup
                    title="Additional Details"
                    items={[
                      ["Source", form.source.join(", ") || "Not selected"],
                      ["Note", form.sourceNote || "Not added"],
                    ]}
                  />
                </div>
              </section>
            ) : null}
          </div>

          <div className="kyc-action-bar">
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              disabled={step === 0}
              className="kyc-nav-button"
            >
              <span className="kyc-arrow-icon kyc-arrow-left" aria-hidden="true" />
              Back
            </button>
            {step < steps.length - 1 ? (
              <button type="button" onClick={handleNextStep} className="kyc-primary-button">
                Next
                <span className="kyc-arrow-icon kyc-arrow-right" aria-hidden="true" />
              </button>
            ) : (
              <button className="kyc-primary-button" disabled={isSubmitting || isLoadingExistingKyc}>
                {isSubmitting ? "Submitting..." : isResubmission ? "Resubmit" : "Submit"}
                {!isSubmitting ? <span className="kyc-arrow-icon kyc-arrow-right" aria-hidden="true" /> : null}
              </button>
            )}
          </div>
        </form>
      </main>
      {showSuccessModal ? (
        <div className="kyc-success-modal" role="dialog" aria-modal="true" aria-labelledby="kyc-success-title">
          <div>
            <span className="kyc-success-icon">✓</span>
            <h2 id="kyc-success-title">KYC is submitted</h2>
            <p>KYC approval is pending from Admin side.</p>
            <button type="button" onClick={() => router.replace("/partner/login")}>
              Go to login
            </button>
          </div>
        </div>
      ) : null}
      {verifyModal ? (
        <div className="kyc-success-modal kyc-verify-tick-modal" role="status" aria-label={verifyModal.title}>
          <div>
            {verifyModal.status === "loading" ? (
              <span className="kyc-verify-spinner" aria-hidden="true" />
            ) : verifyModal.status === "error" ? (
              <span className="kyc-success-icon">!</span>
            ) : (
              <span className="kyc-success-icon">✓</span>
            )}
            <h2>{verifyModal.title}</h2>
            <p>{verifyModal.text}</p>
            {verifyModal.status === "error" ? (
              <button type="button" onClick={() => setVerifyModal(null)}>
                Close
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewGroup({ title, items }) {
  return (
    <div className="kyc-review-group">
      <h3>{title}</h3>
      <div>
        {items.map(([label, value]) => (
          <p key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </p>
        ))}
      </div>
    </div>
  );
}

function KycVerifyField({ label, name, value, verified, ready, error, helperText = "", onChange, onVerify, afterInput = null, className = "" }) {
  const buttonText = verified ? "Verified" : "Verify";
  const verifiedText = {
    aadhaar: "Verified Aadhaar card",
    pan: "Verified PAN card",
    gst: "Verified GSTIN",
    cin: "Verified CIN",
  }[name] || `Verified ${label}`;

  return (
    <div className={`kyc-verify-row ${className}`}>
      <label className="mui-field">
        <input name={name} value={value} onChange={onChange} placeholder=" " disabled={verified} />
        <span>{label}</span>
        {error ? <small>{error}</small> : null}
        {!error && helperText ? <small className="kyc-document-helper-note">{helperText}</small> : null}
        {verified ? (
          <small className="kyc-document-verified-note">
            <span aria-hidden="true" />
            {verifiedText}
          </small>
        ) : null}
      </label>
      {afterInput}
      <button
        type="button"
        onClick={onVerify}
        disabled={verified || !ready}
        className={verified ? "is-verified" : ""}
      >
        {buttonText}
      </button>
    </div>
  );
}

function KycImageUploadField({ label, upload, status, error, onChange, onRemove }) {
  const isUploading = status === "uploading";
  const isUploaded = status === "uploaded";
  const previewSrc = upload.preview || upload.url;

  return (
    <div className="kyc-document-upload-wrap">
      {isUploaded && previewSrc ? (
        <div className="kyc-document-image-preview">
          {/* Standard img keeps uploaded KYC previews working for object URLs and remote URLs. */}
          <img src={previewSrc} alt={`${label} preview`} />
          <button type="button" aria-label={`Remove ${label}`} onClick={onRemove}>
            x
          </button>
        </div>
      ) : (
        <label className={`kyc-document-upload-field ${isUploading ? "is-uploading" : ""}`}>
          <span className={isUploading ? "kyc-upload-spinner" : "kyc-upload-image-icon"} aria-hidden="true" />
          <span>
            {isUploading ? "Uploading..." : label}
            <small>Upload image</small>
          </span>
          <input type="file" accept="image/*" onChange={onChange} disabled={isUploading} />
        </label>
      )}
      {isUploaded && !previewSrc ? (
        <div className="kyc-document-image-preview">
          <button type="button" aria-label={`Remove ${label}`} onClick={onRemove}>
            x
          </button>
        </div>
      ) : null}
      {error ? <small className="kyc-document-upload-error">{error}</small> : null}
    </div>
  );
}

function KycLocationInput({ label, name, type, value, onSelect, cities = [] }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setHasActivated(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setQuery(value || ""), 0);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const search = query.trim();

    if (type === "city" || search.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(search)}&type=${encodeURIComponent(type)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        setSuggestions(data.results || []);
        if (hasActivated) setIsOpen(true);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
        }
      }
    }, 260);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [hasActivated, query, type]);

  function activateSuggestions() {
    setHasActivated(true);
    if (type === "city" || suggestions.length) setIsOpen(true);
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const response = await fetch(
        `/api/reverse-geocode?lat=${encodeURIComponent(position.coords.latitude)}&lng=${encodeURIComponent(position.coords.longitude)}&type=${encodeURIComponent(type)}`,
      );
      const data = await response.json();
      const nextValue = data.result?.name || "";

      if (nextValue) {
        setQuery(nextValue);
        onSelect(nextValue);
        setIsOpen(false);
        setHasActivated(false);
      }
    });
  }

  const visibleSuggestions = type === "city" ? filterCities(cities, query) : query.trim().length < 2 ? [] : suggestions;

  return (
    <div className="kyc-location-field" ref={wrapperRef}>
      <label className="mui-field">
        <input
          name={name}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onSelect(event.target.value);
          }}
          onClick={activateSuggestions}
          onFocus={activateSuggestions}
          placeholder=" "
        />
        <span>{label}</span>
      </label>
      <button type="button" aria-label={`Use current ${label}`} onClick={detectLocation}>
        <span className="target-icon" aria-hidden="true" />
      </button>
      {isOpen && visibleSuggestions.length ? (
        <div className="kyc-location-suggestions">
          {(type === "city" ? visibleSuggestions : visibleSuggestions.slice(0, 5)).map((item) => (
            <button
              key={item.id || item.name}
              type="button"
              onClick={() => {
                setQuery(item.name);
                onSelect(item.name);
                setIsOpen(false);
                setHasActivated(false);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
