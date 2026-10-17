import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString();
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export default function EmailOtpModal({
  email,
  isOpen,
  isResending,
  isVerifying,
  eyebrow = "Email Verification",
  heading = "Enter OTP",
  description = "We sent a verification code to",
  verifyLabel = "Verify Email",
  message,
  error,
  onClose,
  onResend,
  onVerify,
}) {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const inputRefs = useRef([]);
  const lastSubmittedOtpRef = useRef("");
  const canResend = secondsLeft === 0 && !isResending;
  const timerLabel = useMemo(() => formatTime(secondsLeft), [secondsLeft]);
  const otp = otpValues.join("");

  useEffect(() => {
    if (!isOpen || secondsLeft === 0) return undefined;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isOpen, secondsLeft]);

  useEffect(() => {
    if (!isOpen || isVerifying || otp.length !== 6 || lastSubmittedOtpRef.current === otp) {
      return;
    }

    lastSubmittedOtpRef.current = otp;
    onVerify(otp);
  }, [isOpen, isVerifying, onVerify, otp]);

  if (!isOpen) return null;

  function updateOtpValue(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpValues((current) => {
      const next = [...current];
      next[index] = digit;
      if (next.join("").length < 6) {
        lastSubmittedOtpRef.current = "";
      }
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(event, index) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedOtp) return;

    setOtpValues((current) =>
      current.map((_, index) => pastedOtp[index] || ""),
    );
    if (pastedOtp.length < 6) {
      lastSubmittedOtpRef.current = "";
    }
    inputRefs.current[Math.min(pastedOtp.length, 6) - 1]?.focus();
  }

  async function handleResend() {
    if (!canResend) return;

    const didResend = await onResend();
    if (didResend) {
      setSecondsLeft(300);
      setOtpValues(["", "", "", "", "", ""]);
      lastSubmittedOtpRef.current = "";
      inputRefs.current[0]?.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/55 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-stone-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#b61f4b]">
              {eyebrow}
            </p>
            <h2 className="mt-1.5 text-xl font-black">{heading}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-lg font-black text-[#b61f4b] hover:bg-[#b61f4b] hover:text-white"
            aria-label="Close OTP modal"
          >
            x
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-stone-600">
          {description}{" "}
          <span className="font-bold text-stone-900">{email}</span>.
        </p>

        <div className="mt-4 grid gap-3">
          <div>
            <div className="grid grid-cols-6 gap-2">
              {otpValues.map((value, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  aria-label={`OTP digit ${index + 1}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(event) => updateOtpValue(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(event, index)}
                  onPaste={handleOtpPaste}
                  className="h-11 rounded-xl border border-[#f2c9d4] bg-white text-center text-lg font-black text-[#421321] outline-none shadow-sm focus:border-[#b61f4b] focus:ring-2 focus:ring-[#f8d7df]"
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-[#8f1f3f]">
            Expires in {timerLabel}
          </div>

          {message ? <p className="text-center text-xs font-bold text-[#24784f]">{message}</p> : null}
          {error ? <p className="text-center text-xs font-bold text-[#b42318]">{error}</p> : null}

          {isVerifying ? (
            <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-50 text-sm font-bold text-[#8f1f3f]">
              <span className="button-spinner button-spinner-dark" aria-hidden="true" />
              Verifying...
            </div>
          ) : null}
        </div>

        {canResend ? (
          <div className="mt-3 text-center text-xs text-stone-600">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center justify-center gap-2 font-black text-[#b61f4b] hover:text-[#8f1f3f] disabled:cursor-not-allowed disabled:text-stone-400"
            >
              {isResending ? <span className="button-spinner button-spinner-dark" aria-hidden="true" /> : null}
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
