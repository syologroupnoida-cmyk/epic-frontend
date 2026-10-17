export default function ConfirmActionModal({
  isOpen,
  title,
  text,
  confirmLabel = "Logout",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-7 py-8 text-center text-stone-900 shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-[#b61f4b]">
          <span className="text-3xl font-black">?</span>
        </div>
        <h2 className="mt-5 text-xl font-black">{title}</h2>
        {text ? <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p> : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border border-rose-100 bg-white text-sm font-bold text-stone-700 hover:bg-rose-50 hover:text-[#b61f4b]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-xl bg-[#b61f4b] text-sm font-bold text-white hover:bg-[#981a3f]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
