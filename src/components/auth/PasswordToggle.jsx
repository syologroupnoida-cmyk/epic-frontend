export default function PasswordToggle({ isVisible, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`password-toggle ${isVisible ? "is-visible" : "is-hidden"}`}
    >
      <span />
    </button>
  );
}
