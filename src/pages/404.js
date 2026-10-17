import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Link href="/" className="not-found-logo" aria-label="Go to home page">
        <Image src="/images/epic-logo-new.png" alt="Epic Wed Planner" width={150} height={72} priority />
      </Link>
      <section className="not-found-panel">
        <p>404</p>
        <h1>Page not found</h1>
        <span>The page you are looking for is unavailable or has moved.</span>
        <Link href="/" className="not-found-action">
          Back to home
          <span className="epic-button-arrow" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
