import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordToggle from "@/components/auth/PasswordToggle";

export default function AgentSignUp() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Valid email is required";
    if (!/^[0-9]{10}$/.test(form.phone)) nextErrors.phone = "Enter 10 digit phone";
    if (form.password.length < 6) nextErrors.password = "Password must be 6 characters";
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function dummyAgentSignUpApi(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 450));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    if (!validate()) return;
    await dummyAgentSignUpApi(form);
    setStatus("Agent account created successfully.");
  }

  return (
    <AuthShell
      mode="agent"
      eyebrow="Become a Partner"
      title="Join the Epic Wedz partner network"
      text="Set up your profile for wedding leads, planning support, and vendor coordination."
    >
        <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
          <h2 className="font-serif text-3xl font-bold">Agent Sign up</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <label className="mui-field"><input name="firstName" value={form.firstName} onChange={handleChange} placeholder=" " /><span>First name</span>{errors.firstName ? <small>{errors.firstName}</small> : null}</label>
            <label className="mui-field"><input name="lastName" value={form.lastName} onChange={handleChange} placeholder=" " /><span>Last name</span>{errors.lastName ? <small>{errors.lastName}</small> : null}</label>
            <label className="mui-field"><input name="email" value={form.email} onChange={handleChange} placeholder=" " /><span>Email address</span>{errors.email ? <small>{errors.email}</small> : null}</label>
            <label className="mui-field"><input name="phone" value={form.phone} onChange={handleChange} placeholder=" " /><span>Phone number</span>{errors.phone ? <small>{errors.phone}</small> : null}</label>
            <label className="mui-field password-field"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder=" " /><span>Password</span><PasswordToggle isVisible={showPassword} label="Toggle password visibility" onClick={() => setShowPassword((show) => !show)} />{errors.password ? <small>{errors.password}</small> : null}</label>
            <label className="mui-field password-field"><input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder=" " /><span>Confirm password</span><PasswordToggle isVisible={showConfirmPassword} label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword((show) => !show)} />{errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}</label>
            <button className="h-12 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f] sm:col-span-2">Create Agent Account</button>
            {status ? <p className="text-sm font-bold text-[#24784f] sm:col-span-2">{status}</p> : null}
            <p className="text-center text-sm text-stone-600 sm:col-span-2">Already an agent? <Link href="/agent/login" className="font-bold text-[#b61f4b]">Login</Link></p>
          </div>
        </form>
    </AuthShell>
  );
}
