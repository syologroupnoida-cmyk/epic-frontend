import { useSyncExternalStore } from 'react';
import { createPublicCategoryStore } from './publicCategoryStore.mjs';
import { getPublicCatalog } from './publicCatalog.mjs';
import { loadPublicServiceCategories } from './serviceCategories.mjs';

const store = createPublicCategoryStore(async () => (
  await loadPublicServiceCategories(getPublicCatalog)
).filter((item) => item.isActive !== false));

export default function useFooterCategories() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { ...snapshot, retry: store.reload };
}
