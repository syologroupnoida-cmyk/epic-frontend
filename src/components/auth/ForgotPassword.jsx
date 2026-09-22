import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function dummyForgotPasswordApi(payload) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true, resetUrl: "/reset-password", payload }), 500),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Registered email is required");
      return;
    }

    await dummyForgotPasswordApi({ email });
    setStatus("Password reset link has been shared on your registered email id.");
  }

  return (
    <AuthShell
      mode="user"
      eyebrow="Password Help"
      title="Recover access to your account"
      text="Enter your registered email and we will share a password reset link."
    >
      <form onSubmit={handleSubmit} className="auth-panel w-full rounded border border-white/40 p-6 shadow-2xl sm:p-8">
        <h2 className="font-serif text-3xl font-bold">Forgot Password</h2>
        <div className="mt-6 grid gap-4">
          <label className="mui-field">
            <input name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder=" " />
            <span>Registered email</span>
            {error ? <small>{error}</small> : null}
          </label>
          <button className="h-12 rounded bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f]">
            Send Reset Link
          </button>
          {status ? <p className="text-sm font-bold text-[#24784f]">{status}</p> : null}
          <p className="text-sm text-stone-600">
            Already have a link?{" "}
            <Link href="/reset-password" className="font-bold text-[#b61f4b]">
              Create new password
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
