import { useLayoutEffect, useRef } from 'react';

export default function ViewportFit({ children, className, scale, onFit }) {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    function fit() {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (!width || !height) return;
      const availableHeight = Math.max(1, (window.visualViewport?.height || window.innerHeight) - 24);
      const availableWidth = Math.max(1, (window.visualViewport?.width || window.innerWidth) - 24);
      const nextScale = Math.min(1, availableHeight / height, availableWidth / width);
      onFit((current) => current.width === width && current.height === height && current.scale === nextScale ? current : { width, height, scale: nextScale });
    }
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    window.addEventListener('resize', fit);
    window.visualViewport?.addEventListener('resize', fit);
    fit();
    return () => { observer.disconnect(); window.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('resize', fit); };
  }, [onFit]);
  return <div ref={canvasRef} className={className} style={{ transform: `scale(${scale})` }}>{children}</div>;
}
