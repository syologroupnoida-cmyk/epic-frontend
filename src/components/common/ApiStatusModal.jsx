export default function ApiStatusModal({ status, title, text, okLabel, onOk }) {
  if (!status) return null;

  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="grid w-full max-w-sm justify-items-center rounded-2xl bg-white px-8 py-9 text-center text-stone-900 shadow-2xl">
        {isLoading ? (
          <span className="api-bubble-spinner" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : isError ? (
          <span className="api-status-error" aria-hidden="true">
            !
          </span>
        ) : (
          <span className="api-status-success" aria-hidden="true">
            <span className="api-status-check" />
          </span>
        )}
        <h2 className="mt-5 text-xl font-black">{title}</h2>
        {text ? <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p> : null}
        {!isLoading && onOk ? (
          <button
            type="button"
            onClick={onOk}
            className="mt-5 rounded bg-[#b61f4b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#981a3f]"
          >
            {okLabel || "OK"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
