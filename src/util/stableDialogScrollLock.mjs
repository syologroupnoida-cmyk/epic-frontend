export function lockViewportScroll(root, viewportWidth) {
  const overflowY = root.style.overflowY || '';
  const scrollbarGutter = root.style.scrollbarGutter || '';
  // Retain an existing native scrollbar's space without adding body padding.
  if (viewportWidth > root.clientWidth && !scrollbarGutter.includes('stable')) root.style.scrollbarGutter = 'stable';
  root.style.overflowY = 'hidden';
  return () => {
    root.style.overflowY = overflowY;
    root.style.scrollbarGutter = scrollbarGutter;
  };
}
