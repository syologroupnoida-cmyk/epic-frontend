import { useState } from "react";
import ApiStatusModal from "@/components/common/ApiStatusModal";
import PasswordToggle from "@/components/auth/PasswordToggle";
import MainApi from "@/util/MainApi";
import { getApiErrorMessage } from "@/util/authApi";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function BusinessPasswordUpdate() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.currentPassword) nextErrors.currentPassword = "Enter current password.";
    if (!form.newPassword) {
      nextErrors.newPassword = "Enter new password.";
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters.";
    }
    if (form.confirmPassword !== form.newPassword) nextErrors.confirmPassword = "Passwords do not match.";

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  async function submitPassword(event) {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setFeedback({
      status: "loading",
      title: "Updating password",
      text: "Please wait while password is updated.",
    });

    try {
      await MainApi.patch("/vendor/profile/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(initialForm);
      setFeedback({
        status: "success",
        title: "Password updated",
        text: "Password updated successfully.",
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Password failed",
        text: getApiErrorMessage(error, "Unable to update password."),
        okLabel: "OK",
        onOk: () => setFeedback(null),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-950">Update Password</h1>
      </div>

      <form onSubmit={submitPassword} className="grid gap-3 p-4 md:grid-cols-3 md:items-start">
        {[
          ["currentPassword", "Current password", "current-password"],
          ["newPassword", "New password", "new-password"],
          ["confirmPassword", "Confirm password", "new-password"],
        ].map(([name, label, autoComplete]) => (
          <label key={name} className="mui-field password-field min-w-0">
            <input
              name={name}
              type={showPassword[name] ? "text" : "password"}
              value={form[name]}
              onChange={updateField}
              placeholder=" "
              autoComplete={autoComplete}
            />
            <span>{label}</span>
            <PasswordToggle
              isVisible={showPassword[name]}
              label={`Toggle ${label.toLowerCase()} visibility`}
              onClick={() => setShowPassword((current) => ({ ...current, [name]: !current[name] }))}
            />
            {errors[name] ? <small>{errors[name]}</small> : null}
          </label>
        ))}

        <div className="flex justify-end border-t border-slate-200 pt-3 md:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-[#b61f4b] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#981a3f] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

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
