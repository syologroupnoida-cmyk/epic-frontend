import { useState } from "react";
import { createPortal } from "react-dom";

function MuiField({ label, name, value, error, onChange, type = "text" }) {
  return (
    <label className="mui-field">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
      />
      <span>{label}</span>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export default function QuoteModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: "",
    city: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.city.trim()) nextErrors.city = "City is required";
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a 10 digit phone number";
    }
    if (form.message.trim().length < 8) {
      nextErrors.message = "Message should be at least 8 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function dummyQuoteApi(payload) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true, payload }), 450);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!validate()) return;

    await dummyQuoteApi(form);
    setStatus("Quote request submitted successfully.");
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-w-xl quote-modal-panel rounded border border-rose-100 bg-white p-6 text-stone-900 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b61f4b]">
              Get Quote
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-stone-950">
              Find the right wedding vendor
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Share your details and our dummy quote flow will prepare vendor
              suggestions for your celebration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quote form"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rose-100 text-xl font-bold text-stone-500 hover:border-[#b61f4b] hover:text-[#b61f4b]"
          >
            x
          </button>
        </div>

        <form className="mt-5 grid gap-2 sm:grid-cols-2" onSubmit={handleSubmit}>
          <MuiField
            label="Name"
            name="name"
            value={form.name}
            error={errors.name}
            onChange={handleChange}
          />
          <MuiField
            label="City"
            name="city"
            value={form.city}
            error={errors.city}
            onChange={handleChange}
          />
          <MuiField
            label="Phone number"
            name="phone"
            value={form.phone}
            error={errors.phone}
            onChange={handleChange}
          />
          <MuiField
            label="Message"
            name="message"
            value={form.message}
            error={errors.message}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="h-12 rounded bg-[#b61f4b] px-6 text-sm font-bold text-white hover:bg-[#981a3f] sm:col-span-2"
          >
            Get a Free quote
          </button>
          {status ? (
            <p className="text-center text-sm font-bold text-[#24784f] sm:col-span-2">
              {status}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modal, document.body);
}
