import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordToggle from "@/components/auth/PasswordToggle";

export default function AgentLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Valid email is required";
    if (form.password.length < 6) nextErrors.password = "Password must be 6 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function dummyAgentLoginApi(payload) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, payload }), 450));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    if (!validate()) return;
    await dummyAgentLoginApi(form);
    setStatus("Agent login successful.");
  }

  return (
    <AuthShell
      mode="agent"
      eyebrow="Partner Portal"
      title="Work leads with better context"
      text="Track wedding inquiries, visits, packages, and client follow-ups in one place."
    >
        <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
          <h2 className="font-serif text-3xl font-bold">Agent Login</h2>
          <div className="mt-6 grid gap-4">
            <label className="mui-field"><input name="email" value={form.email} onChange={handleChange} placeholder=" " /><span>Email address</span>{errors.email ? <small>{errors.email}</small> : null}</label>
            <label className="mui-field password-field"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder=" " /><span>Password</span><PasswordToggle isVisible={showPassword} label="Toggle password visibility" onClick={() => setShowPassword((show) => !show)} />{errors.password ? <small>{errors.password}</small> : null}</label>
            <Link href="/forgot-password" className="auth-forgot-link">Forgot Password?</Link>
            <button className="h-12 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f]">Login</button>
            {status ? <p className="text-sm font-bold text-[#24784f]">{status}</p> : null}
            <p className="text-sm text-stone-600">New agent? <Link href="/agent/sign-up" className="font-bold text-[#b61f4b]">Create agent account</Link></p>
          </div>
        </form>
    </AuthShell>
  );
}
