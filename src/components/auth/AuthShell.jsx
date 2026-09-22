export default function AuthShell({ children, eyebrow, title, text, mode = "user" }) {
  return (
    <div className={`auth-main auth-${mode}-split auth-split-page min-h-screen px-4 py-10 text-stone-900`}>
      <div className="auth-split-card">
        <aside className="auth-visual-panel">
          <div className="auth-visual-copy">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{text}</span>
          </div>
        </aside>
        <div className="auth-form-panel">{children}</div>
      </div>
    </div>
  );
}

