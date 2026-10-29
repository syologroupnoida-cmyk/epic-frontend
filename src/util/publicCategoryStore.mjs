// Keep footer data through route changes without cancelling a shared request.
export function createPublicCategoryStore(load, { now = Date.now, maxAge = 60000 } = {}) {
  const initial = { items: [], loading: true, error: '' };
  let snapshot = initial;
  let request = null;
  let loadedAt = null;
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());
  function reload() {
    if (request) return request;
    snapshot = { ...snapshot, loading: true, error: '' };
    request = Promise.resolve().then(load).then((items) => {
      snapshot = { items, loading: false, error: '' };
      loadedAt = now();
    }, (error) => {
      snapshot = { ...snapshot, loading: false, error: error?.message || 'Unable to load vendor categories.' };
    }).finally(() => { request = null; notify(); });
    notify();
    return request;
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe(listener) {
      listeners.add(listener);
      if (loadedAt === null || now() - loadedAt >= maxAge) void reload();
      return () => listeners.delete(listener);
    },
    reload,
  };
}
