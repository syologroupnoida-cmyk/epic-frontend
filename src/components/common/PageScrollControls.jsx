import { useEffect, useState } from 'react';
import styles from './PageScrollControls.module.css';

export default function PageScrollControls() {
  const [atBottom, setAtBottom] = useState(false);
  useEffect(() => {
    function updatePosition() {
      const root = document.documentElement;
      setAtBottom(root.scrollHeight > window.innerHeight && window.scrollY + window.innerHeight >= root.scrollHeight - 2);
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    const observer = new ResizeObserver(updatePosition);
    observer.observe(document.body);
    return () => { window.removeEventListener('scroll', updatePosition); window.removeEventListener('resize', updatePosition); observer.disconnect(); };
  }, []);
  function scrollToEdge(bottom) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: bottom ? document.documentElement.scrollHeight : 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  return <div className={styles.controls} role="group" aria-label="Page scrolling">
    <button type="button" aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'} onClick={() => scrollToEdge(!atBottom)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={atBottom ? 'm6 14 6-6 6 6' : 'm6 10 6 6 6-6'} /></svg></button>
  </div>;
}
