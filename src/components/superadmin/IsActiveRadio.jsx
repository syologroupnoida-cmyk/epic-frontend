import { useId } from "react";

export default function IsActiveRadio({ value, onChange, disabled = false }) {
  const name = useId();

  return (
    <fieldset disabled={disabled} className="mx-4 mb-3 flex flex-wrap items-center gap-4 border-0 p-0 text-sm text-stone-700 disabled:opacity-60">
      <legend className="sr-only">Status</legend>
      <span aria-hidden="true" className="font-medium">Status</span>
      {[true, false].map((option) => (
        <label key={String(option)} className="inline-flex cursor-pointer items-center gap-2">
          <input type="radio" name={name} value={String(option)} checked={value === option}
            onChange={() => onChange(option)} className="h-4 w-4 cursor-pointer accent-[#b61f4b]" />
          {option ? "Activate" : "Deactivate"}
        </label>
      ))}
    </fieldset>
  );
}
