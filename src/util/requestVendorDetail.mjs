// Draft profiles may be absent from the public directory. Only the signed-in
// vendor can preview their own profile, and only when its slug matches exactly.
export async function requestVendorDetail(get, slug, { signal, resource = 'vendors', allowOwnProfile = false, allowBusinessProfile = false } = {}) {
  if (resource === 'businesses') {
    const response = await get(`/marketplace/businesses/${encodeURIComponent(slug)}`, { signal });
    return { ...response, marketplaceResource: 'businesses' };
  }
  try {
    return await get(`/marketplace/vendors/${encodeURIComponent(slug)}`, { signal });
  } catch (error) {
    if (signal?.aborted || error.response?.status !== 404) throw error;
    if (allowBusinessProfile) {
      try {
        const response = await get(`/marketplace/businesses/${encodeURIComponent(slug)}`, { signal });
        return { ...response, marketplaceResource: 'businesses' };
      } catch (businessError) {
        if (signal?.aborted || businessError.response?.status !== 404) throw businessError;
      }
    }
    if (!allowOwnProfile) throw error;
    const response = await get("/vendor/profile", { signal });
    if (response.data?.success === false || response.data?.data?.slug !== slug) throw error;
    return response;
  }
}
