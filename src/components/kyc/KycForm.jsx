import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

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
    text: "Add company, location, logo, description, and social links for a complete listing.",
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

export default function KycForm() {
  const router = useRouter();
  const verifyTimerRef = useRef(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [documentErrors, setDocumentErrors] = useState({});
  const [verified, setVerified] = useState({
    aadhaar: false,
    pan: false,
    cin: false,
    gst: false,
  });
  const [form, setForm] = useState({
    services: [],
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    logoName: "",
    description: "",
    facebook: "",
    instagram: "",
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

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!verifyModal) return undefined;
    if (verifyModal.status !== "success") return undefined;

    const timeoutId = window.setTimeout(() => setVerifyModal(null), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [verifyModal]);

  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) window.clearTimeout(verifyTimerRef.current);
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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

  function handleLogoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);

    setLogoPreview(URL.createObjectURL(file));
    setForm((current) => ({ ...current, logoName: file.name }));
  }

  function removeLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview("");
    setForm((current) => ({ ...current, logoName: "" }));
  }

  function toggleService(service) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }));
  }

  function toggleReferral(source) {
    setForm((current) => ({
      ...current,
      source: current.source.includes(source)
        ? current.source.filter((item) => item !== source)
        : [...current.source, source],
    }));
  }

  function verifyDocument(name, label) {
    const value = form[name].trim();
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    if (name === "aadhaar" && !/^\d{12}$/.test(value)) {
      setDocumentErrors((current) => ({ ...current, aadhaar: "Enter a valid 12 digit Aadhaar number" }));
      return;
    }

    if (name === "pan" && !panPattern.test(value)) {
      setDocumentErrors((current) => ({ ...current, pan: "Enter a valid PAN number, like ABCDE1234F" }));
      return;
    }

    if (verifyTimerRef.current) window.clearTimeout(verifyTimerRef.current);

    setVerifyModal({
      status: "loading",
      title: "Verifying...",
      text: `Checking ${label} details.`,
    });

    verifyTimerRef.current = window.setTimeout(() => {
      setVerified((current) => ({ ...current, [name]: true }));
      setVerifyModal({
        status: "success",
        title: "Verified!",
        text: `${label} verified successfully.`,
      });
      verifyTimerRef.current = null;
    }, 3500);
  }

  async function dummyKycSubmitApi(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 650));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await dummyKycSubmitApi(form);
    setShowSuccessModal(true);
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
          <Link href="/partner" className="kyc-brand-mark">
            <Image
              src="/images/epic-logo.webp"
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
            <h1>KYC Verification</h1>
            <p>Complete your KYC verification process</p>
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
                <div className="kyc-service-grid">
                  {serviceOptions.map((service) => (
                    <label key={service} className="kyc-checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.services.includes(service)}
                        onChange={() => toggleService(service)}
                      />
                      <span>{service}</span>
                    </label>
                  ))}
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
                  <KycLocationInput label="Country" name="country" type="country" value={form.country} onSelect={(value) => setForm((current) => ({ ...current, country: value }))} />
                  <KycLocationInput label="State" name="state" type="state" value={form.state} onSelect={(value) => setForm((current) => ({ ...current, state: value }))} />
                  <KycLocationInput label="City" name="city" type="city" value={form.city} onSelect={(value) => setForm((current) => ({ ...current, city: value }))} />
                  <label className="kyc-logo-field">
                    <span>Company logo</span>
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    {logoPreview ? (
                      <span className="kyc-logo-preview">
                        <Image src={logoPreview} alt="Company logo preview" width={42} height={42} unoptimized />
                        <button type="button" aria-label="Remove company logo" onClick={removeLogo}>×</button>
                      </span>
                    ) : null}
                  </label>
                  <label className="mui-field"><input name="facebook" value={form.facebook} onChange={updateField} placeholder=" " /><span>Facebook link</span></label>
                  <label className="mui-field"><input name="instagram" value={form.instagram} onChange={updateField} placeholder=" " /><span>Instagram link</span></label>
                  <label className="mui-field sm:col-span-2"><input name="description" value={form.description} onChange={updateField} placeholder=" " /><span>Description</span></label>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section>
                <div className="kyc-document-grid mt-5">
                  <KycVerifyField label="Aadhaar number" verifiedLabel="Verified" name="aadhaar" value={form.aadhaar} verified={verified.aadhaar} error={documentErrors.aadhaar} onChange={updateDocumentField} onVerify={() => verifyDocument("aadhaar", "Aadhaar")} />
                  <KycVerifyField label="PAN number" verifiedLabel="Verified" name="pan" value={form.pan} verified={verified.pan} error={documentErrors.pan} onChange={updateDocumentField} onVerify={() => verifyDocument("pan", "PAN")} />
                  <KycVerifyField label="GST number" verifiedLabel="Verified" name="gst" value={form.gst} verified={verified.gst} error={documentErrors.gst} onChange={updateDocumentField} onVerify={() => verifyDocument("gst", "GST")} />
                  <KycVerifyField label="CIN" verifiedLabel="Verified" name="cin" value={form.cin} verified={verified.cin} error={documentErrors.cin} onChange={updateDocumentField} onVerify={() => verifyDocument("cin", "CIN")} />
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
                    items={[["Selected services", form.services.join(", ") || "Not selected"]]}
                  />
                  <ReviewGroup
                    title="Company Details"
                    items={[
                      ["Company", form.companyName || "Not added"],
                      ["Contact", form.contactPerson || "Not added"],
                      ["Email", form.email || "Not added"],
                      ["Phone", form.phone || "Not added"],
                      ["Country", form.country || "Not added"],
                      ["State", form.state || "Not added"],
                      ["City", form.city || "Not added"],
                      ["Logo", form.logoName || "Not uploaded"],
                      ["Facebook", form.facebook || "Not added"],
                      ["Instagram", form.instagram || "Not added"],
                      ["Description", form.description || "Not added"],
                    ]}
                  />
                  <ReviewGroup
                    title="Document Verification"
                    items={[
                      ["Aadhaar", form.aadhaar || "Not added"],
                      ["PAN", form.pan || "Not added"],
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
              <button type="button" onClick={() => goToStep(step + 1)} className="kyc-primary-button">
                Next
                <span className="kyc-arrow-icon kyc-arrow-right" aria-hidden="true" />
              </button>
            ) : (
              <button className="kyc-primary-button">
                Submit
                <span className="kyc-arrow-icon kyc-arrow-right" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </main>
      {showSuccessModal ? (
        <div className="kyc-success-modal" role="dialog" aria-modal="true" aria-labelledby="kyc-success-title">
          <div>
            <span className="kyc-success-icon">✓</span>
            <h2 id="kyc-success-title">KYC submitted successfully</h2>
            <p>Our partner team will review it shortly and contact you with the next steps.</p>
            <button type="button" onClick={() => setShowSuccessModal(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
      {verifyModal ? (
        <div className="kyc-success-modal kyc-verify-tick-modal" role="status" aria-label={verifyModal.title}>
          <div>
            {verifyModal.status === "loading" ? (
              <span className="kyc-verify-spinner" aria-hidden="true" />
            ) : (
              <span className="kyc-success-icon">✓</span>
            )}
            <h2>{verifyModal.title}</h2>
            <p>{verifyModal.text}</p>
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

function KycVerifyField({ label, verifiedLabel, name, value, verified, error, onChange, onVerify }) {
  const buttonText = verified ? verifiedLabel : "Verify";

  return (
    <div className="kyc-verify-row">
      <label className="mui-field">
        <input name={name} value={value} onChange={onChange} placeholder=" " disabled={verified} />
        <span>{label}</span>
        {error ? <small>{error}</small> : null}
      </label>
      <button
        type="button"
        onClick={onVerify}
        disabled={verified || !value.trim()}
        className={verified ? "is-verified" : ""}
      >
        {buttonText}
      </button>
    </div>
  );
}

function KycLocationInput({ label, name, type, value, onSelect }) {
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
    const search = query.trim();

    if (search.length < 2) {
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
    if (suggestions.length) setIsOpen(true);
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

  const visibleSuggestions = query.trim().length < 2 ? [] : suggestions;

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
          {visibleSuggestions.slice(0, 5).map((item) => (
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
