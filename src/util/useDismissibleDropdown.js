import { useEffect, useRef } from "react";

export default function useDismissibleDropdown(open, setOpen) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      setOpen(false);
      wrapperRef.current?.querySelector("button")?.focus();
    }
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, setOpen]);

  return wrapperRef;
}
